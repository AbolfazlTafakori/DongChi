/**
 * Pure, deterministic analytics, budgeting, pace forecasting, and reporting engine for DongChi.
 * All financial aggregations use native BigInt arithmetic representing Tomans.
 */

export type BudgetStatus = "SAFE" | "WARNING" | "EXCEEDED" | "UNBUDGETED";

export interface CategoryBudgetResult {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  budgetId: string | null;
  monthlyLimit: bigint | null;
  spentAmount: bigint;
  remainingAmount: bigint | null;
  usagePercent: number | null;
  alertThreshold: number;
  status: BudgetStatus;
  projectedSpend: bigint | null;
  isPaceWarning: boolean;
}

export interface SpendingInsightsResult {
  totalSpent: bigint;
  dailyAverage: bigint;
  monthOverMonthChangePercent: number | null;
  memberConsumption: Record<string, bigint>;
  topCategory: { id: string; name: string; amount: bigint; percent: number } | null;
  dailySeries: { date: string; amount: bigint }[];
}

/**
 * Checks whether a billing cycle is closed and locked against modifications.
 */
export function isCycleLocked(
  cycle: { isClosed: boolean } | null | undefined
): boolean {
  return cycle?.isClosed === true;
}

/**
 * Calculates category-level spending vs budget limits, usage percentages,
 * and burn-rate pace projections.
 */
export function calculateCategoryBudgets(params: {
  categories: { id: string; name: string; color: string; icon: string }[];
  budgets: {
    id: string;
    categoryId: string;
    monthlyLimit: bigint;
    alertThreshold: number;
  }[];
  expenses: { categoryId: string; totalAmount: bigint }[];
  elapsedDays: number;
  totalDays: number;
}): CategoryBudgetResult[] {
  const { categories, budgets, expenses } = params;
  const elapsedDays = Math.max(1, params.elapsedDays);
  const totalDays = Math.max(1, params.totalDays);

  // 1. Sum spent amount per category
  const spendMap = new Map<string, bigint>();
  for (const exp of expenses) {
    const current = spendMap.get(exp.categoryId) ?? 0n;
    spendMap.set(exp.categoryId, current + exp.totalAmount);
  }

  // 2. Map budgets by categoryId
  const budgetMap = new Map<
    string,
    { id: string; monthlyLimit: bigint; alertThreshold: number }
  >();
  for (const b of budgets) {
    budgetMap.set(b.categoryId, b);
  }

  const results: CategoryBudgetResult[] = [];

  // 3. Process categories with a budget or with spent money
  for (const cat of categories) {
    const budget = budgetMap.get(cat.id);
    const spentAmount = spendMap.get(cat.id) ?? 0n;

    if (!budget && spentAmount === 0n) {
      continue;
    }

    const monthlyLimit = budget ? budget.monthlyLimit : null;
    const alertThreshold = budget ? budget.alertThreshold : 80;

    let usagePercent: number | null = null;
    let remainingAmount: bigint | null = null;
    let status: BudgetStatus = "UNBUDGETED";
    let projectedSpend: bigint | null = null;
    let isPaceWarning = false;

    if (monthlyLimit !== null && monthlyLimit > 0n) {
      remainingAmount = monthlyLimit - spentAmount;
      // Calculate integer percentage
      usagePercent = Number((spentAmount * 100n) / monthlyLimit);

      if (usagePercent >= 100) {
        status = "EXCEEDED";
      } else if (usagePercent >= alertThreshold) {
        status = "WARNING";
      } else {
        status = "SAFE";
      }

      // Projected spend based on burn rate pace
      projectedSpend = (spentAmount * BigInt(totalDays)) / BigInt(elapsedDays);

      // Burn rate pace warning: only if not already exceeded, cycle is in progress, and pace exceeds limit
      if (
        status !== "EXCEEDED" &&
        elapsedDays < totalDays &&
        projectedSpend > monthlyLimit
      ) {
        isPaceWarning = true;
      }
    } else if (monthlyLimit !== null && monthlyLimit === 0n) {
      status = spentAmount > 0n ? "EXCEEDED" : "SAFE";
      usagePercent = spentAmount > 0n ? 100 : 0;
      remainingAmount = -spentAmount;
    }

    results.push({
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color,
      categoryIcon: cat.icon,
      budgetId: budget ? budget.id : null,
      monthlyLimit,
      spentAmount,
      remainingAmount,
      usagePercent,
      alertThreshold,
      status,
      projectedSpend,
      isPaceWarning,
    });
  }

  // Sort: EXCEEDED first, then WARNING, then by spentAmount desc
  const statusWeight: Record<BudgetStatus, number> = {
    EXCEEDED: 4,
    WARNING: 3,
    SAFE: 2,
    UNBUDGETED: 1,
  };

  results.sort((a, b) => {
    const weightDiff = statusWeight[b.status] - statusWeight[a.status];
    if (weightDiff !== 0) return weightDiff;
    if (b.isPaceWarning !== a.isPaceWarning) {
      return b.isPaceWarning ? 1 : -1;
    }
    return b.spentAmount > a.spentAmount ? 1 : -1;
  });

  return results;
}

/**
 * Calculates high-level spending analytics, MoM trends, daily average burn rate,
 * member consumption totals, and grouped daily series.
 */
export function calculateSpendingInsights(params: {
  currentExpenses: {
    totalAmount: bigint;
    categoryId: string;
    expenseDate: Date;
    splits: { userId: string; owedAmount: bigint }[];
  }[];
  previousPeriodTotal: bigint;
  memberIds: string[];
  elapsedDays: number;
}): SpendingInsightsResult {
  const { currentExpenses, previousPeriodTotal, memberIds } = params;
  const elapsedDays = Math.max(1, params.elapsedDays);

  const totalSpent = currentExpenses.reduce(
    (sum, e) => sum + e.totalAmount,
    0n
  );

  const dailyAverage = totalSpent / BigInt(elapsedDays);

  // Month-over-month change percentage
  let monthOverMonthChangePercent: number | null = null;
  if (previousPeriodTotal > 0n) {
    const delta = totalSpent - previousPeriodTotal;
    monthOverMonthChangePercent =
      Number((delta * 10000n) / previousPeriodTotal) / 100;
  }

  // Member consumption (owedAmounts)
  const memberConsumption: Record<string, bigint> = {};
  for (const mId of memberIds) {
    memberConsumption[mId] = 0n;
  }
  for (const exp of currentExpenses) {
    for (const s of exp.splits) {
      memberConsumption[s.userId] =
        (memberConsumption[s.userId] ?? 0n) + s.owedAmount;
    }
  }

  // Daily Series grouped by YYYY-MM-DD
  const dailyMap = new Map<string, bigint>();
  const categoryTotals = new Map<string, bigint>();

  for (const exp of currentExpenses) {
    const dateKey = new Date(exp.expenseDate).toISOString().split("T")[0];
    dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0n) + exp.totalAmount);

    categoryTotals.set(
      exp.categoryId,
      (categoryTotals.get(exp.categoryId) ?? 0n) + exp.totalAmount
    );
  }

  const dailySeries = Array.from(dailyMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Identify top category
  let topCategory: SpendingInsightsResult["topCategory"] = null;
  if (categoryTotals.size > 0 && totalSpent > 0n) {
    let topId = "";
    let maxSpend = -1n;
    for (const [cId, spend] of categoryTotals.entries()) {
      if (spend > maxSpend) {
        maxSpend = spend;
        topId = cId;
      }
    }
    const percent = Number((maxSpend * 100n) / totalSpent);
    topCategory = {
      id: topId,
      name: "", // Will be mapped by caller if needed
      amount: maxSpend,
      percent,
    };
  }

  return {
    totalSpent,
    dailyAverage,
    monthOverMonthChangePercent,
    memberConsumption,
    topCategory,
    dailySeries,
  };
}

/**
 * Escapes fields for CSV compliance according to RFC 4180.
 */
function escapeCsvField(val: string | number | bigint | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates an Excel-safe CSV string encoded with UTF-8 BOM (\uFEFF)
 * preventing Persian/Arabic encoding distortion in Microsoft Excel and Google Sheets.
 */
export function generateCsvReport(
  rows: Array<{
    expenseDate: Date | string;
    title: string;
    categoryName: string;
    totalAmount: bigint;
    paymentSource: "PERSONAL" | "FUND";
    payerOrFundName: string;
    splitType: string;
    memberSplitsDetail: string;
  }>
): string {
  const BOM = "\uFEFF";
  const headers = [
    "تاریخ",
    "عنوان هزینه",
    "دسته‌بندی",
    "مبلغ کل (تومان)",
    "منبع پرداخت",
    "پرداخت‌کننده یا صندوق",
    "نحوه تقسیم",
    "جزئیات سهم اعضا",
  ];

  const headerLine = headers.map(escapeCsvField).join(",");

  const dataLines = rows.map((r) => {
    const formattedDate = new Date(r.expenseDate).toLocaleDateString("fa-IR");
    const sourceLabel =
      r.paymentSource === "FUND" ? "صندوق مشترک خانه" : "جیب شخصی";

    const splitLabelMap: Record<string, string> = {
      EQUAL: "مساوی",
      EXACT: "مبلغ دقیق",
      PERCENT: "درصدی",
      SHARES: "سهمیه‌ای",
    };

    return [
      escapeCsvField(formattedDate),
      escapeCsvField(r.title),
      escapeCsvField(r.categoryName),
      escapeCsvField(r.totalAmount.toString()),
      escapeCsvField(sourceLabel),
      escapeCsvField(r.payerOrFundName),
      escapeCsvField(splitLabelMap[r.splitType] || r.splitType),
      escapeCsvField(r.memberSplitsDetail),
    ].join(",");
  });

  return BOM + [headerLine, ...dataLines].join("\r\n");
}
