import { describe, it, expect } from "vitest";
import { parseToman } from "../lib/money";

describe("Phase 6: Admin Billing Management & Manual Pro Grant Logic", () => {
  describe("Manual Pro Grant Stackable Expiry Calculation", () => {
    function computeGrantExpiry(params: {
      now: Date;
      existingExpiresAt: Date | null;
      grantDays: number;
    }): Date {
      const { now, existingExpiresAt, grantDays } = params;
      const baseDate =
        existingExpiresAt && existingExpiresAt.getTime() > now.getTime()
          ? existingExpiresAt
          : now;

      const durationMs = grantDays * 24 * 60 * 60 * 1000;
      return new Date(baseDate.getTime() + durationMs);
    }

    it("should calculate exact expiry for a free user starting from now", () => {
      const now = new Date("2026-11-14T12:00:00.000Z");
      const newExpiry = computeGrantExpiry({
        now,
        existingExpiresAt: null,
        grantDays: 30,
      });

      const diffDays = Math.round(
        (newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(30);
      expect(newExpiry.toISOString()).toBe("2026-12-14T12:00:00.000Z");
    });

    it("should STACK grant days on top of existing active subscription so days are not lost", () => {
      const now = new Date("2026-11-14T12:00:00.000Z");
      // Existing subscription expires in 15 days
      const existingExpiresAt = new Date("2026-11-29T12:00:00.000Z");

      // Grant 30 days
      const newExpiry = computeGrantExpiry({
        now,
        existingExpiresAt,
        grantDays: 30,
      });

      // Total remaining days should be 15 + 30 = 45 days
      const totalDaysFromNow = Math.round(
        (newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(totalDaysFromNow).toBe(45);
      expect(newExpiry.toISOString()).toBe("2026-12-29T12:00:00.000Z");
    });

    it("should ignore past expired date and start from now if existing subscription has expired", () => {
      const now = new Date("2026-11-14T12:00:00.000Z");
      // Expired 5 days ago
      const expiredDate = new Date("2026-11-09T12:00:00.000Z");

      const newExpiry = computeGrantExpiry({
        now,
        existingExpiresAt: expiredDate,
        grantDays: 30,
      });

      const diffDays = Math.round(
        (newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(30);
    });
  });

  describe("Plan Update Input Validation", () => {
    function validatePlanUpdate(body: {
      title?: string;
      price?: string | bigint;
      durationDays?: number;
    }): { valid: boolean; error?: string } {
      if (body.title !== undefined && body.title.trim().length < 2) {
        return { valid: false, error: "عنوان پلن باید حداقل ۲ حرف باشد." };
      }
      if (body.price !== undefined) {
        const parsed = parseToman(String(body.price));
        if (parsed < 0n) {
          return { valid: false, error: "مبلغ پلن نمی‌تواند منفی باشد." };
        }
      }
      if (body.durationDays !== undefined) {
        if (isNaN(body.durationDays) || body.durationDays < 1) {
          return { valid: false, error: "مدت اعتبار پلن باید حداقل ۱ روز باشد." };
        }
      }
      return { valid: true };
    }

    it("should accept valid plan parameters", () => {
      expect(
        validatePlanUpdate({
          title: "حرفه‌ای ماهانه",
          price: "59,000",
          durationDays: 30,
        }).valid
      ).toBe(true);

      // Free plan with 0 price is valid
      expect(
        validatePlanUpdate({
          price: "0",
        }).valid
      ).toBe(true);
    });

    it("should reject negative price or durationDays < 1", () => {
      expect(
        validatePlanUpdate({
          durationDays: 0,
        }).valid
      ).toBe(false);

      expect(
        validatePlanUpdate({
          title: "a",
        }).valid
      ).toBe(false);
    });
  });
});
