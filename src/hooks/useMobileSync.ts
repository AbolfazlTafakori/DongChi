"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type SyncStatus = "SYNCED" | "SYNCING" | "OFFLINE" | "ERROR";

export interface QueuedOfflineAction {
  id: string;
  type: "QUICK_EXPENSE" | "MARK_NOTIF_READ";
  payload: any;
  createdAt: string;
}

export interface SyncUserData {
  id: string;
  name: string;
  phone: string;
  cardNumber: string | null;
  role: string;
}

export interface SyncResponseData {
  authenticated: boolean;
  user?: SyncUserData;
  isPro?: boolean;
  groupsCount?: number;
  latestActivityAt?: string;
  unreadNotifications?: number;
  syncHash?: string;
  serverTime?: string;
}

const STORAGE_QUEUE_KEY = "dongchi_offline_queue";
const BROADCAST_CHANNEL_NAME = "dongchi_live_sync";

export function useMobileSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("SYNCING");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [syncData, setSyncData] = useState<SyncResponseData | null>(null);

  const lastKnownHashRef = useRef<string | null>(null);
  const isSyncingRef = useRef<boolean>(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Helper to read offline queue from localStorage
  const getOfflineQueue = useCallback((): QueuedOfflineAction[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_QUEUE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  // Update pending count in state
  const refreshQueueCount = useCallback(() => {
    const queue = getOfflineQueue();
    setPendingQueueCount(queue.length);
  }, [getOfflineQueue]);

  // Enqueue an action when offline
  const enqueueOfflineAction = useCallback(
    (action: { type: "QUICK_EXPENSE" | "MARK_NOTIF_READ"; payload: any }) => {
      if (typeof window === "undefined") return;
      const currentQueue = getOfflineQueue();
      const newAction: QueuedOfflineAction = {
        id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: action.type,
        payload: action.payload,
        createdAt: new Date().toISOString(),
      };
      currentQueue.push(newAction);
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(currentQueue));
      setPendingQueueCount(currentQueue.length);
      return newAction.id;
    },
    [getOfflineQueue]
  );

  // Flush offline queue to server
  const flushOfflineQueue = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !navigator.onLine) return false;
    const queue = getOfflineQueue();
    if (queue.length === 0) return true;

    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingActions: queue }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      const syncedIds: string[] = data.syncedIds || [];

      // Remove synced actions from local queue
      const remaining = queue.filter((item) => !syncedIds.includes(item.id));
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(remaining));
      setPendingQueueCount(remaining.length);

      // Dispatch event to inform other components that local mutations have landed
      window.dispatchEvent(
        new CustomEvent("dongchi:data-synced", {
          detail: { source: "flush-queue", syncedCount: syncedIds.length },
        })
      );

      return true;
    } catch (err) {
      console.warn("Error flushing offline queue:", err);
      return false;
    }
  }, [getOfflineQueue]);

  // Main sync trigger
  const triggerSync = useCallback(
    async (manual = false): Promise<SyncResponseData | null> => {
      if (typeof window === "undefined") return null;

      if (!navigator.onLine) {
        setSyncStatus("OFFLINE");
        return null;
      }

      if (isSyncingRef.current && !manual) {
        return null;
      }

      try {
        isSyncingRef.current = true;
        setSyncStatus("SYNCING");

        // 1. Flush any pending offline queue first
        await flushOfflineQueue();

        // 2. Fetch latest state fingerprint from server
        const res = await fetch("/api/sync", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok) {
          throw new Error(`Sync API responded with status ${res.status}`);
        }

        const data: SyncResponseData = await res.json();

        if (data.authenticated) {
          setSyncData(data);
          setUnreadNotifications(data.unreadNotifications || 0);

          // Check if data changed remotely
          const prevHash = lastKnownHashRef.current;
          const newHash = data.syncHash || "";

          if (prevHash && prevHash !== newHash) {
            // State changed remotely! Notify current window and broadcast to other tabs
            window.dispatchEvent(
              new CustomEvent("dongchi:data-synced", {
                detail: { source: "remote-change", newHash, data },
              })
            );

            if (broadcastChannelRef.current) {
              broadcastChannelRef.current.postMessage({
                type: "SYNC_UPDATED",
                syncHash: newHash,
                serverTime: data.serverTime,
              });
            }
          }

          lastKnownHashRef.current = newHash;
        }

        setSyncStatus("SYNCED");
        const now = new Date();
        setLastSyncedAt(now);
        refreshQueueCount();
        return data;
      } catch (err) {
        console.warn("Mobile sync error:", err);
        setSyncStatus(navigator.onLine ? "ERROR" : "OFFLINE");
        return null;
      } finally {
        isSyncingRef.current = false;
      }
    },
    [flushOfflineQueue, refreshQueueCount]
  );

  // Setup broadcast channel, interval, and lifecycle events
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. BroadcastChannel setup for multi-tab / mobile PWA instant sync (<50ms)
    try {
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.onmessage = (event) => {
          if (event.data?.type === "SYNC_UPDATED") {
            // Trigger refresh from server without broadcast loop
            triggerSync(false);
          }
        };
        broadcastChannelRef.current = channel;
      }
    } catch {}

    // 2. Initial sync on mount
    refreshQueueCount();
    triggerSync(true);

    // 3. Periodic polling every 15 seconds when tab is active
    const intervalId = window.setInterval(() => {
      if (!document.hidden && navigator.onLine) {
        triggerSync(false);
      }
    }, 15000);

    // 4. Focus & visibility triggers
    const handleFocus = () => {
      if (navigator.onLine) triggerSync(false);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        triggerSync(false);
      }
    };

    // 5. Online / Offline network triggers
    const handleOnline = () => {
      setSyncStatus("SYNCING");
      triggerSync(true);
    };

    const handleOffline = () => {
      setSyncStatus("OFFLINE");
    };

    // 6. Custom manual sync request event listener
    const handleRequestSync = () => {
      triggerSync(true);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("dongchi:request-sync", handleRequestSync);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("dongchi:request-sync", handleRequestSync);

      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.close();
        } catch {}
      }
    };
  }, [triggerSync, refreshQueueCount]);

  return {
    syncStatus,
    lastSyncedAt,
    pendingQueueCount,
    unreadNotifications,
    syncData,
    triggerSync,
    enqueueOfflineAction,
    flushOfflineQueue,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  };
}
