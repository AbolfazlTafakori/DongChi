import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { GET as getSyncHandler, POST as postSyncHandler } from "../app/api/sync/route";
import { GET as getAppVersionHandler } from "../app/api/app-version/route";
import { GET as getApkDownloadHandler } from "../app/api/apk/download/route";
import * as sessionModule from "../lib/session";
import { prisma } from "../lib/prisma";
import { createNotificationItem } from "../lib/notification-store";

describe("Mobile PWA & Real-Time Sync Engine Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. PWA Manifest & Native Capacitor Configuration", () => {
    it("should contain valid PWA manifest with standalone display, RTL and shortcuts", () => {
      const manifestPath = path.join(process.cwd(), "public/manifest.json");
      expect(fs.existsSync(manifestPath)).toBe(true);

      const raw = fs.readFileSync(manifestPath, "utf-8");
      const manifest = JSON.parse(raw);

      expect(manifest.name).toContain("دنگ‌چی");
      expect(manifest.short_name).toBe("دنگ‌چی");
      expect(manifest.display).toBe("standalone");
      expect(manifest.dir).toBe("rtl");
      expect(manifest.lang).toBe("fa-IR");
      expect(manifest.start_url).toContain("/app");
      expect(manifest.theme_color).toBe("#059669");

      // Verify native shortcuts
      expect(Array.isArray(manifest.shortcuts)).toBe(true);
      expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3);

      const shortcutNames = manifest.shortcuts.map((s: any) => s.name);
      expect(shortcutNames).toContain("ثبت خرج جدید");
      expect(shortcutNames).toContain("پیشخوان مالی");
      expect(shortcutNames).toContain("پروفایل و کارت شتاب");
    });

    it("should contain valid Capacitor mobile app configuration", () => {
      const capPath = path.join(process.cwd(), "capacitor.config.json");
      expect(fs.existsSync(capPath)).toBe(true);

      const cap = JSON.parse(fs.readFileSync(capPath, "utf-8"));
      expect(cap.appId).toBe("ir.dongchi.app");
      expect(cap.appName).toBe("DongChi");
      expect(cap.server).toBeDefined();
      expect(cap.server.url).toContain("http");
    });
  });

  describe("2. GET /api/sync Endpoint", () => {
    it("should return unauthenticated status when no session exists", async () => {
      vi.spyOn(sessionModule, "getSession").mockResolvedValue(null);

      const res = await getSyncHandler();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.authenticated).toBe(false);
      expect(json.serverTime).toBeDefined();
    });

    it("should return complete telemetry fingerprint and syncHash for authenticated user", async () => {
      // Find or use demo user
      const user = await prisma.user.findFirst();
      expect(user).toBeDefined();

      vi.spyOn(sessionModule, "getSession").mockResolvedValue({
        userId: user!.id,
        phone: user!.phone,
        role: user!.role as any,
      });

      const res = await getSyncHandler();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.authenticated).toBe(true);
      expect(json.user).toBeDefined();
      expect(json.user.id).toBe(user!.id);
      expect(typeof json.isPro).toBe("boolean");
      expect(typeof json.groupsCount).toBe("number");
      expect(typeof json.unreadNotifications).toBe("number");
      expect(json.syncHash).toBeDefined();
      expect(json.syncHash.length).toBe(32); // MD5 hash length
      expect(json.serverTime).toBeDefined();
    });
  });

  describe("3. POST /api/sync Offline Batch Queue Processing", () => {
    it("should reject unauthenticated offline sync with 401", async () => {
      vi.spyOn(sessionModule, "getSession").mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingActions: [] }),
      });

      const res = await postSyncHandler(req);
      expect(res.status).toBe(401);
    });

    it("should process MARK_NOTIF_READ action and return syncedIds", async () => {
      const user = await prisma.user.findFirst();
      expect(user).toBeDefined();

      vi.spyOn(sessionModule, "getSession").mockResolvedValue({
        userId: user!.id,
        phone: user!.phone,
        role: user!.role as any,
      });

      // Create a test notification
      const notif = createNotificationItem({
        title: "تست همگام‌سازی نوتیفیکیشن",
        body: "متن پیام تست برای بررسی صف آفلاین",
        level: "INFO",
        target: "ALL",
      });

      const req = new NextRequest("http://localhost:3000/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pendingActions: [
            {
              id: "action-123",
              type: "MARK_NOTIF_READ",
              payload: { notifId: notif.id },
            },
          ],
        }),
      });

      const res = await postSyncHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.syncedIds).toContain("action-123");
      expect(json.syncHash).toBeDefined();
      expect(json.serverTime).toBeDefined();
    });
  });

  describe("4. GET /api/app-version Endpoint (OTA Engine)", () => {
    it("should return valid app version and distribution market URLs", async () => {
      const res = await getAppVersionHandler(new NextRequest("http://localhost:3000/api/app-version"));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.versionName).toBeDefined();
      expect(typeof json.versionCode).toBe("number");
      expect(typeof json.minRequiredVersionCode).toBe("number");
      expect(typeof json.forceUpdate).toBe("boolean");
      expect(json.directApkUrl).toBe("/api/apk/download");
      expect(json.markets).toBeDefined();
      expect(json.markets.cafeBazaarUrl).toBeDefined();
      expect(json.markets.myketUrl).toBeDefined();
      expect(json.markets.sibAppUrl).toBeDefined();
      expect(json.serverTime).toBeDefined();
    });
  });

  describe("5. GET /api/apk/download Endpoint (Direct APK Binary Serving)", () => {
    it("should serve APK binary with valid attachment headers", async () => {
      const res = await getApkDownloadHandler();
      expect(res.status).toBe(200);

      const contentType = res.headers.get("content-type");
      expect(contentType).toBe("application/vnd.android.package-archive");

      const disposition = res.headers.get("content-disposition");
      expect(disposition).toContain("attachment;");
      expect(disposition).toContain(".apk");

      const blob = await res.blob();
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe("6. Native Android Project Structure Verification", () => {
    it("should have AndroidManifest.xml configured with ir.dongchi.app and permissions", () => {
      const manifestPath = path.join(process.cwd(), "android/app/src/main/AndroidManifest.xml");
      expect(fs.existsSync(manifestPath)).toBe(true);

      const content = fs.readFileSync(manifestPath, "utf-8");
      expect(content).toContain("ir.dongchi.app");
      expect(content).toContain("android.permission.INTERNET");
      expect(content).toContain("android:supportsRtl=\"true\"");
    });

    it("should have Android build.gradle configured with proper SDK and versioning", () => {
      const gradlePath = path.join(process.cwd(), "android/app/build.gradle");
      expect(fs.existsSync(gradlePath)).toBe(true);

      const content = fs.readFileSync(gradlePath, "utf-8");
      expect(content).toContain("applicationId \"ir.dongchi.app\"");
      expect(content).toContain("versionCode 25");
      expect(content).toContain("versionName \"2.5.0\"");
    });
  });
});
