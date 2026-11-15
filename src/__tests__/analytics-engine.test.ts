import { describe, it, expect } from "vitest";
import {
  calculateCategoryBudgets,
  calculateSpendingInsights,
  generateCsvReport,
} from "../lib/accounting/analytics-engine";

describe("Phase 4: Smart Accountant Analytics Engine", () => {
  const mockCategories = [
    { id: "cat_food", name: "خوراک و سوپرمارکت", color: "#059669", icon: "🛒" },
    { id: "cat_utilities", name: "قبوض و شارژ", color: "#3B82F6", icon: "⚡" },
    { id: "cat_rent", name: "اجاره خانه", color: "#F59E0B", icon: "🏠" },
    { id: "cat_fun", name: "تفریح و سرگرمی", color: "#EC4899", icon: "☕" },
  ];

  describe("calculateCategoryBudgets", () => {
    it("should classify budget as SAFE when usage is below alert threshold", () => {
      const budgets = [
        {
          id: "b1",
          categoryId: "cat_food",
          monthlyLimit: 10000000n, // 10 Million Tomans
          alertThreshold: 80,
        },
      ];

      const expenses = [
        { categoryId: "cat_food", totalAmount: 5000000n }, // 50%
      ];

      const results = calculateCategoryBudgets({
        categories: mockCategories,
        budgets,
        expenses,
        elapsedDays: 15,
        totalDays: 30,
      });

      const foodBudget = results.find((r) => r.categoryId === "cat_food");
      expect(foodBudget).toBeDefined();
      expect(foodBudget?.status).toBe("SAFE");
      expect(foodBudget?.usagePercent).toBe(50);
      expect(foodBudget?.remainingAmount).toBe(5000000n);
      expect(foodBudget?.isPaceWarning).toBe(false);
    });

    it("should classify budget as WARNING when usage is between threshold and 100%", () => {
      const budgets = [
        {
          id: "b1",
          categoryId: "cat_food",
          monthlyLimit: 10000000n,
          alertThreshold: 80,
        },
      ];

      const expenses = [
        { categoryId: "cat_food", totalAmount: 8500000n }, // 85%
      ];

      const results = calculateCategoryBudgets({
        categories: mockCategories,
        budgets,
        expenses,
        elapsedDays: 28,
        totalDays: 30,
      });

      const foodBudget = results.find((r) => r.categoryId === "cat_food");
      expect(foodBudget?.status).toBe("WARNING");
      expect(foodBudget?.usagePercent).toBe(85);
      expect(foodBudget?.remainingAmount).toBe(1500000n);
    });

    it("should classify budget as EXCEEDED when usage reaches or exceeds 100%", () => {
      const budgets = [
        {
          id: "b2",
          categoryId: "cat_utilities",
          monthlyLimit: 2000000n,
          alertThreshold: 80,
        },
      ];

      const expenses = [
        { categoryId: "cat_utilities", totalAmount: 2200000n }, // 110%
      ];

      const results = calculateCategoryBudgets({
        categories: mockCategories,
        budgets,
        expenses,
        elapsedDays: 10,
        totalDays: 30,
      });

      const utilBudget = results.find((r) => r.categoryId === "cat_utilities");
      expect(utilBudget?.status).toBe("EXCEEDED");
      expect(utilBudget?.usagePercent).toBe(110);
      expect(utilBudget?.remainingAmount).toBe(-200000n);
    });

    it("should trigger burn-rate pace warning when spending speed projects an overrun", () => {
      // Limit: 1,000,000 Tomans.
      // Day 5 of 30: spent 600,000 Tomans (60% spent in 16.7% of the month).
      // Usage is 60% (below 80% threshold, so status is SAFE).
      // But projected spend = 600,000 * 30 / 5 = 3,600,000 > 1,000,000!
      const budgets = [
        {
          id: "b1",
          categoryId: "cat_food",
          monthlyLimit: 1000000n,
          alertThreshold: 80,
        },
      ];

      const expenses = [
        { categoryId: "cat_food", totalAmount: 600000n },
      ];

      const results = calculateCategoryBudgets({
        categories: mockCategories,
        budgets,
        expenses,
        elapsedDays: 5,
        totalDays: 30,
      });

      const foodBudget = results.find((r) => r.categoryId === "cat_food");
      expect(foodBudget?.status).toBe("SAFE");
      expect(foodBudget?.projectedSpend).toBe(3600000n);
      expect(foodBudget?.isPaceWarning).toBe(true);
    });

    it("should include unbudgeted categories that had spending", () => {
      const budgets: any[] = [];
      const expenses = [
        { categoryId: "cat_fun", totalAmount: 450000n },
      ];

      const results = calculateCategoryBudgets({
        categories: mockCategories,
        budgets,
        expenses,
        elapsedDays: 10,
        totalDays: 30,
      });

      const fun = results.find((r) => r.categoryId === "cat_fun");
      expect(fun).toBeDefined();
      expect(fun?.status).toBe("UNBUDGETED");
      expect(fun?.spentAmount).toBe(450000n);
      expect(fun?.monthlyLimit).toBeNull();
    });

    it("should sort budgets placing EXCEEDED first, then WARNING, then SAFE", () => {
      const budgets = [
        { id: "b1", categoryId: "cat_food", monthlyLimit: 10000000n, alertThreshold: 80 },
        { id: "b2", categoryId: "cat_utilities", monthlyLimit: 2000000n, alertThreshold: 80 },
        { id: "b3", categoryId: "cat_rent", monthlyLimit: 15000000n, alertThreshold: 80 },
      ];

      const expenses = [
        { categoryId: "cat_food", totalAmount: 8500000n }, // WARNING (85%)
        { categoryId: "cat_utilities", totalAmount: 2500000n }, // EXCEEDED (125%)
        { categoryId: "cat_rent", totalAmount: 5000000n }, // SAFE (33%)
      ];

      const results = calculateCategoryBudgets({
        categories: mockCategories,
        budgets,
        expenses,
        elapsedDays: 15,
        totalDays: 30,
      });

      expect(results[0].categoryId).toBe("cat_utilities"); // EXCEEDED
      expect(results[1].categoryId).toBe("cat_food"); // WARNING
      expect(results[2].categoryId).toBe("cat_rent"); // SAFE
    });
  });

  describe("calculateSpendingInsights", () => {
    it("should compute accurate totalSpent, dailyAverage, and memberConsumption", () => {
      const expenses = [
        {
          totalAmount: 600000n,
          categoryId: "cat_food",
          expenseDate: new Date("2026-11-01T12:00:00Z"),
          splits: [
            { userId: "user_a", owedAmount: 300000n },
            { userId: "user_b", owedAmount: 300000n },
          ],
        },
        {
          totalAmount: 400000n,
          categoryId: "cat_utilities",
          expenseDate: new Date("2026-11-02T15:00:00Z"),
          splits: [
            { userId: "user_a", owedAmount: 100000n },
            { userId: "user_b", owedAmount: 300000n },
          ],
        },
      ];

      const insights = calculateSpendingInsights({
        currentExpenses: expenses,
        previousPeriodTotal: 800000n,
        memberIds: ["user_a", "user_b", "user_c"],
        elapsedDays: 5,
      });

      // Total spent = 600,000 + 400,000 = 1,000,000
      expect(insights.totalSpent).toBe(1000000n);

      // Daily average = 1,000,000 / 5 = 200,000
      expect(insights.dailyAverage).toBe(200000n);

      // Member consumption
      expect(insights.memberConsumption["user_a"]).toBe(400000n);
      expect(insights.memberConsumption["user_b"]).toBe(600000n);
      expect(insights.memberConsumption["user_c"]).toBe(0n);

      // Top category
      expect(insights.topCategory?.id).toBe("cat_food");
      expect(insights.topCategory?.amount).toBe(600000n);
      expect(insights.topCategory?.percent).toBe(60);

      // MoM Change = (1,000,000 - 800,000) / 800,000 * 100 = +25.0%
      expect(insights.monthOverMonthChangePercent).toBe(25);

      // Daily Series has 2 dates
      expect(insights.dailySeries).toHaveLength(2);
      expect(insights.dailySeries[0].date).toBe("2026-11-01");
      expect(insights.dailySeries[0].amount).toBe(600000n);
      expect(insights.dailySeries[1].date).toBe("2026-11-02");
      expect(insights.dailySeries[1].amount).toBe(400000n);
    });

    it("should handle empty expenses gracefully", () => {
      const insights = calculateSpendingInsights({
        currentExpenses: [],
        previousPeriodTotal: 0n,
        memberIds: ["user_1"],
        elapsedDays: 10,
      });

      expect(insights.totalSpent).toBe(0n);
      expect(insights.dailyAverage).toBe(0n);
      expect(insights.monthOverMonthChangePercent).toBeNull();
      expect(insights.topCategory).toBeNull();
      expect(insights.dailySeries).toHaveLength(0);
      expect(insights.memberConsumption["user_1"]).toBe(0n);
    });
  });

  describe("generateCsvReport", () => {
    it("should prefix CSV with UTF-8 BOM and include valid Persian headers and rows", () => {
      const rows = [
        {
          expenseDate: new Date("2026-11-14T10:00:00Z"),
          title: "خرید مواد شوینده و ضدعفونی",
          categoryName: "لوازم خانه",
          totalAmount: 185000n,
          paymentSource: "FUND" as const,
          payerOrFundName: "صندوق مشترک خانه",
          splitType: "EQUAL",
          memberSplitsDetail: "علی: ۹۲,۵۰۰ تومان | مریم: ۹۲,۵۰۰ تومان",
        },
        {
          expenseDate: new Date("2026-11-13T18:00:00Z"),
          title: "پیتزا و فست‌فود, با مخلفات",
          categoryName: "خوراک",
          totalAmount: 420000n,
          paymentSource: "PERSONAL" as const,
          payerOrFundName: "رضا",
          splitType: "PERCENT",
          memberSplitsDetail: "رضا: ۲۱۰,۰۰۰ تومان | علی: ۲۱۰,۰۰۰ تومان",
        },
      ];

      const csv = generateCsvReport(rows);

      // Verify UTF-8 BOM
      expect(csv.startsWith("\uFEFF")).toBe(true);

      // Verify Persian Header line
      expect(csv).toContain("تاریخ");
      expect(csv).toContain("عنوان هزینه");
      expect(csv).toContain("دسته‌بندی");
      expect(csv).toContain("مبلغ کل (تومان)");
      expect(csv).toContain("منبع پرداخت");

      // Verify row content and escaping
      expect(csv).toContain("خرید مواد شوینده و ضدعفونی");
      expect(csv).toContain("صندوق مشترک خانه");
      expect(csv).toContain("185000");

      // Verify field with comma is wrapped in quotes
      expect(csv).toContain('"پیتزا و فست‌فود, با مخلفات"');
    });
  });
});
