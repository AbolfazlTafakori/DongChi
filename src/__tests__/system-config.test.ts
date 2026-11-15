import { describe, it, expect, beforeEach } from "vitest";
import {
  getSystemConfig,
  updateSystemConfig,
  DEFAULT_SYSTEM_CONFIG,
} from "../lib/system-config";
import {
  createNotificationItem,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  toggleNotificationActive,
  deleteNotificationItem,
} from "../lib/notification-store";

describe("Platform System Config & CMS Engine", () => {
  it("should return valid default system config with all four core modules", () => {
    const config = getSystemConfig();
    expect(config).toBeDefined();
    expect(config.payment).toBeDefined();
    expect(config.sms).toBeDefined();
    expect(config.cms).toBeDefined();
    expect(config.developer).toBeDefined();

    expect(config.payment.activeProvider).toBe("MOCK_SHAPARAK");
    expect(config.payment.sandboxMode).toBe(true);
    expect(config.sms.activeProvider).toBe("LOCAL_DEV");
    expect(config.sms.enableStaticDevOtp).toBe(true);
    expect(config.developer.freeTierMaxGroups).toBe(2);
  });

  it("should update partial system config and persist updates correctly", () => {
    const updated = updateSystemConfig({
      payment: {
        ...getSystemConfig().payment,
        activeProvider: "ZARINPAL",
        merchantId: "test-zarinpal-merchant-1234",
        vatPercent: 9,
      },
      cms: {
        ...getSystemConfig().cms,
        heroHeadline: "تیتر تستی جدید پنل ادمین",
      },
    });

    expect(updated.payment.activeProvider).toBe("ZARINPAL");
    expect(updated.payment.merchantId).toBe("test-zarinpal-merchant-1234");
    expect(updated.payment.vatPercent).toBe(9);
    expect(updated.cms.heroHeadline).toBe("تیتر تستی جدید پنل ادمین");

    // Verify it persists on subsequent getSystemConfig call
    const fresh = getSystemConfig();
    expect(fresh.payment.activeProvider).toBe("ZARINPAL");
    expect(fresh.cms.heroHeadline).toBe("تیتر تستی جدید پنل ادمین");

    // Revert back
    updateSystemConfig({
      payment: DEFAULT_SYSTEM_CONFIG.payment,
      cms: DEFAULT_SYSTEM_CONFIG.cms,
    });
  });
});

describe("User Notification Store & Targeting Engine", () => {
  it("should accurately target ALL, FREE_ONLY, PRO_ONLY, and specific USER phone", () => {
    // 1. Create notifications with different targets
    const allNotif = createNotificationItem({
      title: "اعلان عمومی",
      body: "پیام برای همه اعضا",
      level: "INFO",
      target: "ALL",
    });

    const freeNotif = createNotificationItem({
      title: "آفر ارتقا",
      body: "تخفیف ویژه کاربران رایگان",
      level: "PROMO",
      target: "FREE_ONLY",
    });

    const proNotif = createNotificationItem({
      title: "ویژه پرو",
      body: "قابلیت VIP فعال شد",
      level: "SUCCESS",
      target: "PRO_ONLY",
    });

    const specificUserNotif = createNotificationItem({
      title: "پیام خصوصی",
      body: "فاکتور شما بررسی شد",
      level: "WARNING",
      target: "USER",
      targetPhone: "09129998877",
    });

    // Test targeting for Free user with phone 09121111111
    const freeUserFeed = getNotificationsForUser({
      userId: "u-free",
      userPhone: "09121111111",
      isPro: false,
    });
    const freeIds = freeUserFeed.map((n) => n.id);
    expect(freeIds).toContain(allNotif.id);
    expect(freeIds).toContain(freeNotif.id);
    expect(freeIds).not.toContain(proNotif.id);
    expect(freeIds).not.toContain(specificUserNotif.id);

    // Test targeting for Pro user with phone 09121111111
    const proUserFeed = getNotificationsForUser({
      userId: "u-pro",
      userPhone: "09121111111",
      isPro: true,
    });
    const proIds = proUserFeed.map((n) => n.id);
    expect(proIds).toContain(allNotif.id);
    expect(proIds).not.toContain(freeNotif.id);
    expect(proIds).toContain(proNotif.id);
    expect(proIds).not.toContain(specificUserNotif.id);

    // Test targeting for specific user 09129998877
    const specificFeed = getNotificationsForUser({
      userId: "u-target",
      userPhone: "09129998877",
      isPro: false,
    });
    const specificIds = specificFeed.map((n) => n.id);
    expect(specificIds).toContain(specificUserNotif.id);

    // Clean up created items
    deleteNotificationItem(allNotif.id);
    deleteNotificationItem(freeNotif.id);
    deleteNotificationItem(proNotif.id);
    deleteNotificationItem(specificUserNotif.id);
  });

  it("should mark notifications as read and toggle active state", () => {
    const notif = createNotificationItem({
      title: "تست خوانده شدن",
      body: "متن تست خوانده شدن پیام",
      level: "INFO",
      target: "ALL",
    });

    const testUserId = "user-audit-123";
    markNotificationRead(notif.id, testUserId);

    let feed = getNotificationsForUser({
      userId: testUserId,
      userPhone: "09120000000",
      isPro: false,
    });
    const found = feed.find((n) => n.id === notif.id);
    expect(found?.readByUserIds).toContain(testUserId);

    // Test toggle active
    toggleNotificationActive(notif.id, false);
    feed = getNotificationsForUser({
      userId: testUserId,
      userPhone: "09120000000",
      isPro: false,
    });
    expect(feed.find((n) => n.id === notif.id)).toBeUndefined();

    // Clean up
    deleteNotificationItem(notif.id);
  });
});
