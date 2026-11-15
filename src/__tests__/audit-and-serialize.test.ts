import { describe, it, expect } from "vitest";
import { serializeBigInt } from "../lib/serialize";

describe("Audit Logging & Reconciliation Discrepancy Logic", () => {
  describe("BigInt-Safe AuditLog Snapshot Serialization", () => {
    it("should serialize complex expense audit snapshot without TypeError", () => {
      const expenseAuditSnapshot = {
        title: "خرید گوشت و مرغ",
        totalAmount: 1450000n,
        paymentSource: "PERSONAL",
        paidByUserId: "user_1",
        fundId: null,
        splitType: "PERCENT",
        splits: [
          { userId: "user_1", owedAmount: 725000n, percent: 50 },
          { userId: "user_2", owedAmount: 725000n, percent: 50 },
        ],
        createdAt: new Date("2026-11-14T20:00:00.000Z"),
      };

      const serialized = serializeBigInt(expenseAuditSnapshot);

      // Verify that JSON.stringify does NOT throw BigInt TypeError
      expect(() => JSON.stringify(serialized)).not.toThrow();

      const jsonStr = JSON.stringify(serialized);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.totalAmount).toBe("1450000");
      expect(parsed.splits[0].owedAmount).toBe("725000");
      expect(parsed.splits[1].owedAmount).toBe("725000");
      expect(parsed.paymentSource).toBe("PERSONAL");
    });

    it("should safely handle delete and update audit snapshots", () => {
      const oldSnapshot = {
        deletedExpenseId: "exp_123",
        title: "قبض گاز",
        totalAmount: 320000n,
        paymentSource: "FUND",
        fundId: "fund_abc",
        splits: [
          { userId: "u1", owedAmount: 160000n },
          { userId: "u2", owedAmount: 160000n },
        ],
      };

      const newSnapshot = {
        title: "قبض گاز بازنگری‌شده",
        totalAmount: 340000n,
        paymentSource: "FUND",
        fundId: "fund_abc",
        splits: [
          { userId: "u1", owedAmount: 170000n },
          { userId: "u2", owedAmount: 170000n },
        ],
      };

      const serializedOld = serializeBigInt(oldSnapshot);
      const serializedNew = serializeBigInt(newSnapshot);

      expect(serializedOld.totalAmount).toBe("320000");
      expect(serializedNew.totalAmount).toBe("340000");
    });
  });

  describe("Reconciliation Discrepancy Calculations", () => {
    function computeDiscrepancy(actualBalance: bigint, currentBalance: bigint) {
      const diff = actualBalance - currentBalance;
      if (diff === 0n) {
        return { type: "BALANCED", diff: 0n };
      }
      if (diff < 0n) {
        return { type: "SHORTAGE", diff, shortage: -diff };
      }
      return { type: "SURPLUS", diff, surplus: diff };
    }

    it("should detect exact match (0 diff)", () => {
      const result = computeDiscrepancy(1500000n, 1500000n);
      expect(result.type).toBe("BALANCED");
      expect(result.diff).toBe(0n);
    });

    it("should detect shortage when bank card has less money than system", () => {
      // System thinks 1,000,000; bank card actually has 850,000 -> 150,000 shortage
      const result = computeDiscrepancy(850000n, 1000000n);
      expect(result.type).toBe("SHORTAGE");
      expect(result.diff).toBe(-150000n);
      expect(result.shortage).toBe(150000n);
    });

    it("should detect surplus when bank card has more money than system", () => {
      // System thinks 1,000,000; bank card actually has 1,200,000 -> 200,000 surplus
      const result = computeDiscrepancy(1200000n, 1000000n);
      expect(result.type).toBe("SURPLUS");
      expect(result.diff).toBe(200000n);
      expect(result.surplus).toBe(200000n);
    });
  });
});
