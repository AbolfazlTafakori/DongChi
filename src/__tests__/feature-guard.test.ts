import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the prisma client before importing feature-guard
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      subscription: {
        updateMany: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      groupMember: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      fund: {
        count: vi.fn(),
      },
    },
  };
});

import { prisma } from "@/lib/prisma";
import {
  getUserSubscriptionStatus,
  isGroupPro,
  canAccessFeature,
  FREE_MAX_GROUPS,
  FREE_MAX_FUNDS_PER_GROUP,
} from "../lib/subscription/feature-guard";

describe("Phase 5: Central Entitlement & Feature Guard Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserSubscriptionStatus", () => {
    it("should return isPro: false for users without subscriptions", async () => {
      (prisma.subscription.findMany as any).mockResolvedValue([]);

      const status = await getUserSubscriptionStatus("user_free_1");
      expect(status.isPro).toBe(false);
      expect(status.activeSubscription).toBeNull();
      expect(status.remainingDays).toBe(0);
      expect(prisma.subscription.updateMany).toHaveBeenCalled();
    });

    it("should return isPro: true and remainingDays for active paid subscription", async () => {
      const in20Days = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
      const mockSub = {
        id: "sub_1",
        userId: "user_pro_1",
        planId: "plan_pro",
        status: "ACTIVE",
        startsAt: new Date(),
        expiresAt: in20Days,
        plan: {
          id: "plan_pro",
          title: "حرفه‌ای ماهانه",
          price: 49000n,
          durationDays: 30,
        },
      };

      (prisma.subscription.findMany as any).mockResolvedValue([mockSub]);

      const status = await getUserSubscriptionStatus("user_pro_1");
      expect(status.isPro).toBe(true);
      expect(status.activeSubscription?.id).toBe("sub_1");
      expect(status.remainingDays).toBeGreaterThanOrEqual(19);
      expect(status.remainingDays).toBeLessThanOrEqual(21);
    });

    it("should return isPro: false for users with only free plan active subscription", async () => {
      const mockFreeSub = {
        id: "sub_free",
        userId: "user_free_2",
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
        plan: {
          id: "plan_free",
          title: "پایه رایگان",
          price: 0n,
          durationDays: 365,
        },
      };

      (prisma.subscription.findMany as any).mockResolvedValue([mockFreeSub]);

      const status = await getUserSubscriptionStatus("user_free_2");
      expect(status.isPro).toBe(false);
    });
  });

  describe("Group Halo Rule: isGroupPro", () => {
    it("should return false if group has no members or no pro members", async () => {
      (prisma.groupMember.findMany as any).mockResolvedValue([
        { userId: "u1" },
        { userId: "u2" },
      ]);
      (prisma.subscription.count as any).mockResolvedValue(0);

      const pro = await isGroupPro("group_free");
      expect(pro).toBe(false);
    });

    it("should return true if ANY member of the group holds an active Pro subscription", async () => {
      (prisma.groupMember.findMany as any).mockResolvedValue([
        { userId: "free_member_1" },
        { userId: "pro_member_2" },
      ]);
      (prisma.subscription.count as any).mockResolvedValue(1);

      const pro = await isGroupPro("group_halo");
      expect(pro).toBe(true);
    });
  });

  describe("canAccessFeature Guard", () => {
    describe("UNLIMITED_GROUPS", () => {
      it("should allow free user with 0 or 1 groups to create a new group", async () => {
        // Free user
        (prisma.subscription.findMany as any).mockResolvedValue([]);
        (prisma.groupMember.count as any).mockResolvedValue(1);

        const result = await canAccessFeature({
          userId: "user_free",
          feature: "UNLIMITED_GROUPS",
        });

        expect(result.allowed).toBe(true);
        expect(result.requiredFeature).toBe("UNLIMITED_GROUPS");
      });

      it("should block free user with 2 existing groups (FREE_MAX_GROUPS = 2)", async () => {
        // Free user
        (prisma.subscription.findMany as any).mockResolvedValue([]);
        (prisma.groupMember.count as any).mockResolvedValue(FREE_MAX_GROUPS);

        const result = await canAccessFeature({
          userId: "user_free",
          feature: "UNLIMITED_GROUPS",
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("حداکثر در ۲ گروه");
      });

      it("should allow Pro user to have unlimited groups regardless of count", async () => {
        // Pro user
        (prisma.subscription.findMany as any).mockResolvedValue([
          {
            id: "sub_pro",
            status: "ACTIVE",
            expiresAt: new Date(Date.now() + 15 * 86400000),
            plan: { price: 49000n },
          },
        ]);
        (prisma.groupMember.count as any).mockResolvedValue(10);

        const result = await canAccessFeature({
          userId: "user_pro",
          feature: "UNLIMITED_GROUPS",
        });

        expect(result.allowed).toBe(true);
      });
    });

    describe("MULTIPLE_FUNDS", () => {
      it("should allow 0 funds in a free group, but block creating a 2nd fund (limit 1)", async () => {
        // Free user
        (prisma.subscription.findMany as any).mockResolvedValue([]);
        // Group is not pro
        (prisma.groupMember.findMany as any).mockResolvedValue([{ userId: "u1" }]);
        (prisma.subscription.count as any).mockResolvedValue(0);

        // 1 fund already exists
        (prisma.fund.count as any).mockResolvedValue(FREE_MAX_FUNDS_PER_GROUP);

        const result = await canAccessFeature({
          userId: "u1",
          groupId: "group_1",
          feature: "MULTIPLE_FUNDS",
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("حداکثر می‌تواند ۱ صندوق مشترک داشته باشد");
      });

      it("should unlock multiple funds for a free user if group has a Pro member (Group Halo)", async () => {
        // Free user
        (prisma.subscription.findMany as any).mockResolvedValue([]);
        // Group has a pro member
        (prisma.groupMember.findMany as any).mockResolvedValue([
          { userId: "u_free" },
          { userId: "u_pro" },
        ]);
        (prisma.subscription.count as any).mockResolvedValue(1);

        const result = await canAccessFeature({
          userId: "u_free",
          groupId: "group_halo",
          feature: "MULTIPLE_FUNDS",
        });

        expect(result.allowed).toBe(true);
      });
    });

    describe("EXPORT_CSV", () => {
      it("should block CSV export in a free group for a free user", async () => {
        // Free user
        (prisma.subscription.findMany as any).mockResolvedValue([]);
        // Free group
        (prisma.groupMember.findMany as any).mockResolvedValue([{ userId: "u_free" }]);
        (prisma.subscription.count as any).mockResolvedValue(0);

        const result = await canAccessFeature({
          userId: "u_free",
          groupId: "group_free",
          feature: "EXPORT_CSV",
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("خروجی فایل اکسل (CSV) نیاز به اشتراک حرفه‌ای دارد");
      });

      it("should allow CSV export for a free member if another member in group has Pro (Group Halo)", async () => {
        // Free user
        (prisma.subscription.findMany as any).mockResolvedValue([]);
        // Another member is Pro
        (prisma.groupMember.findMany as any).mockResolvedValue([
          { userId: "u_free" },
          { userId: "u_pro_roommate" },
        ]);
        (prisma.subscription.count as any).mockResolvedValue(1);

        const result = await canAccessFeature({
          userId: "u_free",
          groupId: "group_shared",
          feature: "EXPORT_CSV",
        });

        expect(result.allowed).toBe(true);
      });
    });
  });
});
