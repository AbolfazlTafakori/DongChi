import { describe, it, expect } from "vitest";
import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentSplit,
  calculateSharesSplit,
} from "../lib/accounting/split-calculator";

describe("Split Calculator Engine (BigInt Precision)", () => {
  describe("calculateEqualSplit", () => {
    it("should divide evenly divisible amounts with 0 remainder", () => {
      const result = calculateEqualSplit(90000n, ["user1", "user2", "user3"]);
      expect(result).toEqual([
        { userId: "user1", owedAmount: 30000n },
        { userId: "user2", owedAmount: 30000n },
        { userId: "user3", owedAmount: 30000n },
      ]);
      const sum = result.reduce((acc, curr) => acc + curr.owedAmount, 0n);
      expect(sum).toBe(90000n);
    });

    it("should divide indivisible amounts without losing any single Toman (100,000 / 3)", () => {
      // 100,000 / 3 = 33,333 with remainder 1
      // First member gets 33,334; others get 33,333
      const result = calculateEqualSplit(100000n, ["user1", "user2", "user3"]);
      expect(result).toEqual([
        { userId: "user1", owedAmount: 33334n },
        { userId: "user2", owedAmount: 33333n },
        { userId: "user3", owedAmount: 33333n },
      ]);
      const sum = result.reduce((acc, curr) => acc + curr.owedAmount, 0n);
      expect(sum).toBe(100000n);
    });

    it("should distribute multiple remainder Tomans in array order (100,000 / 7)", () => {
      // 100,000 / 7 = 14,285 with remainder 5
      // First 5 members get 14,286, last 2 get 14,285
      const members = ["u1", "u2", "u3", "u4", "u5", "u6", "u7"];
      const result = calculateEqualSplit(100000n, members);
      const sum = result.reduce((acc, curr) => acc + curr.owedAmount, 0n);
      expect(sum).toBe(100000n);

      for (let i = 0; i < 5; i++) {
        expect(result[i].owedAmount).toBe(14286n);
      }
      expect(result[5].owedAmount).toBe(14285n);
      expect(result[6].owedAmount).toBe(14285n);
    });

    it("should throw on invalid inputs (0 or negative amount, empty or duplicate members)", () => {
      expect(() => calculateEqualSplit(0n, ["u1"])).toThrow();
      expect(() => calculateEqualSplit(-500n, ["u1"])).toThrow();
      expect(() => calculateEqualSplit(1000n, [])).toThrow();
      expect(() => calculateEqualSplit(1000n, ["u1", "u1"])).toThrow();
    });
  });

  describe("calculateExactSplit", () => {
    it("should accept exact split when sum matches totalAmount", () => {
      const result = calculateExactSplit(75000n, [
        { userId: "u1", amount: 25000n },
        { userId: "u2", amount: 50000n },
      ]);
      expect(result).toEqual([
        { userId: "u1", owedAmount: 25000n },
        { userId: "u2", owedAmount: 50000n },
      ]);
    });

    it("should throw error when sum does not match totalAmount", () => {
      expect(() =>
        calculateExactSplit(100000n, [
          { userId: "u1", amount: 40000n },
          { userId: "u2", amount: 50000n },
        ])
      ).toThrow(/برابر نیست/);
    });

    it("should throw when individual amount is negative", () => {
      expect(() =>
        calculateExactSplit(100000n, [
          { userId: "u1", amount: -10000n },
          { userId: "u2", amount: 110000n },
        ])
      ).toThrow();
    });
  });

  describe("calculatePercentSplit", () => {
    it("should compute percent splits with 100% sum and distribute remainder to largest percent", () => {
      // 33.33% + 33.33% + 33.34% = 100% on 100,001 Tomans
      const result = calculatePercentSplit(100001n, [
        { userId: "u1", percent: 33.33 },
        { userId: "u2", percent: 33.33 },
        { userId: "u3", percent: 33.34 },
      ]);

      const sum = result.reduce((acc, curr) => acc + curr.owedAmount, 0n);
      expect(sum).toBe(100001n);
    });

    it("should throw if sum of percents does not equal 100", () => {
      expect(() =>
        calculatePercentSplit(50000n, [
          { userId: "u1", percent: 50 },
          { userId: "u2", percent: 45 },
        ])
      ).toThrow(/۱۰۰٪/);
    });

    it("should throw if any percent is negative", () => {
      expect(() =>
        calculatePercentSplit(50000n, [
          { userId: "u1", percent: -10 },
          { userId: "u2", percent: 110 },
        ])
      ).toThrow();
    });
  });

  describe("calculateSharesSplit", () => {
    it("should split by coefficients/shares and strictly maintain totalAmount (2, 1, 1 on 100003n)", () => {
      // 2 + 1 + 1 = 4 shares on 100,003
      // 100,003 * 2 / 4 = 50,001 remainder 2
      // 100,003 * 1 / 4 = 25,000 remainder 3
      // 100,003 * 1 / 4 = 25,000 remainder 3
      const result = calculateSharesSplit(100003n, [
        { userId: "u1", shares: 2 },
        { userId: "u2", shares: 1 },
        { userId: "u3", shares: 1 },
      ]);

      const sum = result.reduce((acc, curr) => acc + curr.owedAmount, 0n);
      expect(sum).toBe(100003n);
      expect(result[0].owedAmount).toBe(50001n);
      expect(result[1].owedAmount).toBe(25001n);
      expect(result[2].owedAmount).toBe(25001n);
    });

    it("should throw if any share is less than 1 or not an integer", () => {
      expect(() =>
        calculateSharesSplit(10000n, [
          { userId: "u1", shares: 0 },
          { userId: "u2", shares: 2 },
        ])
      ).toThrow();

      expect(() =>
        calculateSharesSplit(10000n, [
          { userId: "u1", shares: 1.5 },
          { userId: "u2", shares: 2 },
        ])
      ).toThrow();
    });
  });
});
