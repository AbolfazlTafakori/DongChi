import fs from 'fs';
import path from 'path';

export type NotificationTarget = 'ALL' | 'FREE_ONLY' | 'PRO_ONLY' | 'USER';
export type NotificationLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'PROMO';

export interface AppNotificationItem {
  id: string;
  title: string;
  body: string;
  level: NotificationLevel;
  target: NotificationTarget;
  targetPhone?: string;
  actionLabel?: string;
  actionUrl?: string;
  isPinnedBanner: boolean;
  isActive: boolean;
  readByUserIds: string[];
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTIF_FILE = path.join(DATA_DIR, 'notifications.json');

// In-Memory RAM Cache for high-frequency notification reads
let cachedNotifs: AppNotificationItem[] | null = null;

const DEFAULT_NOTIFICATIONS: AppNotificationItem[] = [
  {
    id: 'notif-welcome-1',
    title: 'به نسخه ۲.۴ دنگ‌چی خوش آمدید 🎉',
    body: 'موتور دنگ‌بندی ۴ حالته، صندوق مشترک خانه و پلن‌های پرو طلایی و مکس VIP فعال شدند. برای دریافت تسویه سریع از هم‌خانه‌ها، شماره کارت خود را در پروفایل ثبت کنید.',
    level: 'SUCCESS',
    target: 'ALL',
    actionLabel: 'ثبت شماره کارت در پروفایل',
    actionUrl: '/app/profile',
    isPinnedBanner: true,
    isActive: true,
    readByUserIds: [],
    createdAt: new Date().toISOString(),
  },
];

function ensureNotifStore(): AppNotificationItem[] {
  if (cachedNotifs !== null) {
    return cachedNotifs;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(NOTIF_FILE)) {
      fs.writeFileSync(NOTIF_FILE, JSON.stringify(DEFAULT_NOTIFICATIONS, null, 2), 'utf-8');
      cachedNotifs = [...DEFAULT_NOTIFICATIONS];
      return cachedNotifs;
    }
    const raw = fs.readFileSync(NOTIF_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    cachedNotifs = Array.isArray(parsed) ? parsed : [...DEFAULT_NOTIFICATIONS];
    return cachedNotifs;
  } catch {
    cachedNotifs = [...DEFAULT_NOTIFICATIONS];
    return cachedNotifs;
  }
}

function saveNotifStore(items: AppNotificationItem[]): void {
  cachedNotifs = items;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.promises.writeFile(NOTIF_FILE, JSON.stringify(items, null, 2), 'utf-8').catch((err) => {
      console.error('Failed to save notifications asynchronously:', err);
    });
  } catch (err) {
    console.error('Failed to save notifications:', err);
  }
}

export function getAllAdminNotifications(): AppNotificationItem[] {
  return ensureNotifStore();
}

export function getNotificationsForUser(params: {
  userId: string;
  userPhone: string;
  isPro: boolean;
}): AppNotificationItem[] {
  const all = ensureNotifStore().filter((n) => n.isActive);
  return all.filter((n) => {
    if (n.target === 'ALL') return true;
    if (n.target === 'PRO_ONLY') return params.isPro;
    if (n.target === 'FREE_ONLY') return !params.isPro;
    if (n.target === 'USER') {
      const normalizedTarget = n.targetPhone?.replace(/[^0-9]/g, '');
      const normalizedUser = params.userPhone?.replace(/[^0-9]/g, '');
      return normalizedTarget && normalizedUser && normalizedTarget === normalizedUser;
    }
    return true;
  });
}

export function createNotificationItem(input: {
  title: string;
  body: string;
  level: NotificationLevel;
  target: NotificationTarget;
  targetPhone?: string;
  actionLabel?: string;
  actionUrl?: string;
  isPinnedBanner?: boolean;
}): AppNotificationItem {
  const items = ensureNotifStore();
  const newItem: AppNotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: input.title.trim(),
    body: input.body.trim(),
    level: input.level,
    target: input.target,
    targetPhone: input.target === 'USER' ? input.targetPhone?.trim() : undefined,
    actionLabel: input.actionLabel?.trim() || undefined,
    actionUrl: input.actionUrl?.trim() || undefined,
    isPinnedBanner: Boolean(input.isPinnedBanner),
    isActive: true,
    readByUserIds: [],
    createdAt: new Date().toISOString(),
  };
  items.unshift(newItem);
  saveNotifStore(items);
  return newItem;
}

export function markNotificationRead(notifId: string, userId: string): void {
  const items = ensureNotifStore();
  const idx = items.findIndex((i) => i.id === notifId);
  if (idx === -1) return;
  if (!items[idx].readByUserIds.includes(userId)) {
    items[idx].readByUserIds.push(userId);
    saveNotifStore(items);
  }
}

export function markAllNotificationsRead(userId: string): void {
  const items = ensureNotifStore();
  let changed = false;
  for (const item of items) {
    if (!item.readByUserIds.includes(userId)) {
      item.readByUserIds.push(userId);
      changed = true;
    }
  }
  if (changed) saveNotifStore(items);
}

export function toggleNotificationActive(notifId: string, isActive: boolean): AppNotificationItem | null {
  const items = ensureNotifStore();
  const idx = items.findIndex((i) => i.id === notifId);
  if (idx === -1) return null;
  items[idx].isActive = isActive;
  saveNotifStore(items);
  return items[idx];
}

export function deleteNotificationItem(notifId: string): boolean {
  const items = ensureNotifStore();
  const filtered = items.filter((i) => i.id !== notifId);
  if (filtered.length === items.length) return false;
  saveNotifStore(filtered);
  return true;
}
