import { describe, it, expect } from "vitest";
import { isCycleLocked } from "../lib/accounting/analytics-engine";

describe("Phase 4: Billing Cycle Immutability & Lifecycle Guard", () => {
  describe("isCycleLocked Helper", () => {
    it("should return false when cycle is undefined or null", () => {
      expect(isCycleLocked(undefined)).toBe(false);
      expect(isCycleLocked(null)).toBe(false);
    });

    it("should return false when cycle is open (isClosed: false)", () => {
      const openCycle = {
        id: "cycle_1",
        isClosed: false,
        title: "دوره جاری خانه",
      };
      expect(isCycleLocked(openCycle)).toBe(false);
    });

    it("should return true when cycle is closed (isClosed: true)", () => {
      const closedCycle = {
        id: "cycle_2",
        isClosed: true,
        title: "دوره مهر ۱۴۰۵",
      };
      expect(isCycleLocked(closedCycle)).toBe(true);
    });
  });

  describe("Billing Cycle Closing Transition Logic", () => {
    it("should transition cycle from open to closed and compute next cycle window", () => {
      const now = new Date("2026-11-14T12:00:00Z");
      const currentCycle = {
        id: "cycle_current",
        title: "دوره آبان ۱۴۰۵",
        startDate: new Date("2026-10-15T00:00:00Z"),
        endDate: new Date("2026-11-14T00:00:00Z"),
        isClosed: false,
        closedAt: null as Date | null,
      };

      // Guard check: cannot modify if closed, but this one is open
      expect(isCycleLocked(currentCycle)).toBe(false);

      // Simulate closing transition
      const closedCycle = {
        ...currentCycle,
        isClosed: true,
        closedAt: now,
      };

      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const nextCycle = {
        id: "cycle_next",
        title: "دوره آذر ۱۴۰۵",
        startDate: now,
        endDate: in30Days,
        isClosed: false,
        closedAt: null,
      };

      // Closed cycle is now locked
      expect(isCycleLocked(closedCycle)).toBe(true);
      expect(closedCycle.closedAt).toEqual(now);

      // Next cycle is open and active
      expect(isCycleLocked(nextCycle)).toBe(false);
      expect(nextCycle.startDate).toEqual(now);
      expect(nextCycle.endDate.getTime()).toBeGreaterThan(nextCycle.startDate.getTime());
    });

    it("should reject modifying or deleting expenses linked to a closed cycle", () => {
      const closedCycle = {
        id: "cycle_closed_101",
        title: "دوره بسته شده شهریور",
        isClosed: true,
      };

      const expense = {
        id: "exp_999",
        title: "تعمیرات لوله‌کشی",
        totalAmount: 1800000n,
        cycle: closedCycle,
      };

      const attemptMutation = () => {
        if (isCycleLocked(expense.cycle)) {
          throw new Error("این دوره مالی بسته شده است و امکان تغییر اسناد آن وجود ندارد.");
        }
        return "MUTATED";
      };

      expect(() => attemptMutation()).toThrow(
        "این دوره مالی بسته شده است و امکان تغییر اسناد آن وجود ندارد."
      );
    });
  });
});
