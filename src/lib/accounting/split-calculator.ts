/**
 * Pure, deterministic bill-splitting calculation engine for DongChi.
 * All monetary calculations use native BigInt arithmetic representing Tomans.
 * Guarantees zero-loss precision (sum(owedAmount) === totalAmount).
 */

export interface SplitResult {
  userId: string;
  owedAmount: bigint;
}

/**
 * Validates array of member IDs for non-emptiness and duplicates.
 */
function validateMemberIds(memberIds: string[]): void {
  if (!memberIds || memberIds.length === 0) {
    throw new Error("حداقل یک عضو برای تقسیم هزینه الزامی است.");
  }
  const unique = new Set(memberIds);
  if (unique.size !== memberIds.length) {
    throw new Error("اعضای انتخاب‌شده برای تقسیم هزینه نباید تکراری باشند.");
  }
}

/**
 * Calculates equal splits among members.
 * Indivisible Tomans are distributed 1 by 1 to the first members in array order.
 * Example: 100,000 Tomans / 3 -> 33,334, 33,333, 33,333
 */
export function calculateEqualSplit(
  totalAmount: bigint,
  memberIds: string[]
): SplitResult[] {
  if (totalAmount <= 0n) {
    throw new Error("مبلغ کل هزینه باید بزرگتر از صفر باشد.");
  }
  validateMemberIds(memberIds);

  const n = BigInt(memberIds.length);
  const baseShare = totalAmount / n;
  const remainder = Number(totalAmount % n);

  const results: SplitResult[] = memberIds.map((userId, index) => {
    // The first `remainder` members get 1 Toman extra
    const owedAmount = index < remainder ? baseShare + 1n : baseShare;
    return { userId, owedAmount };
  });

  // Verify invariant
  const sum = results.reduce((acc, curr) => acc + curr.owedAmount, 0n);
  if (sum !== totalAmount) {
    throw new Error("خطای محاسباتی: مجموع سهم‌ها با مبلغ کل برابر نیست.");
  }

  return results;
}

/**
 * Calculates exact splits with user-defined amounts.
 * Validates that each amount is non-negative and their sum strictly matches totalAmount.
 */
export function calculateExactSplit(
  totalAmount: bigint,
  splits: { userId: string; amount: bigint }[]
): SplitResult[] {
  if (totalAmount <= 0n) {
    throw new Error("مبلغ کل هزینه باید بزرگتر از صفر باشد.");
  }
  if (!splits || splits.length === 0) {
    throw new Error("حداقل یک سهم برای تقسیم دقیق الزامی است.");
  }
  validateMemberIds(splits.map((s) => s.userId));

  let currentSum = 0n;
  for (const split of splits) {
    if (split.amount < 0n) {
      throw new Error("مبلغ سهم هر عضو نمی‌تواند منفی باشد.");
    }
    currentSum += split.amount;
  }

  if (currentSum !== totalAmount) {
    throw new Error(
      `مجموع مبالغ تعیین‌شده (${currentSum.toString()} تومان) با مبلغ کل هزینه (${totalAmount.toString()} تومان) برابر نیست.`
    );
  }

  return splits.map((s) => ({
    userId: s.userId,
    owedAmount: s.amount,
  }));
}

/**
 * Calculates percentage-based splits.
 * Validates that sum of percentages is 100 (within 0.001 tolerance).
 * Converts to basis points (x100) and assigns any rounding remainder
 * to the participant with the largest percentage (tie-broken by first index).
 */
export function calculatePercentSplit(
  totalAmount: bigint,
  splits: { userId: string; percent: number }[]
): SplitResult[] {
  if (totalAmount <= 0n) {
    throw new Error("مبلغ کل هزینه باید بزرگتر از صفر باشد.");
  }
  if (!splits || splits.length === 0) {
    throw new Error("حداقل یک سهم برای تقسیم درصدی الزامی است.");
  }
  validateMemberIds(splits.map((s) => s.userId));

  for (const s of splits) {
    if (typeof s.percent !== "number" || isNaN(s.percent) || s.percent < 0) {
      throw new Error("درصد سهم هر عضو باید عددی نامنفی باشد.");
    }
  }

  const sumPercent = splits.reduce((acc, s) => acc + s.percent, 0);
  if (Math.abs(sumPercent - 100) > 0.001) {
    throw new Error(
      `مجموع درصدها باید دقیقاً ۱۰۰٪ باشد (مجموع فعلی: ${sumPercent}%).`
    );
  }

  // Calculate base share using basis points (percent * 100, out of 10,000)
  const results: SplitResult[] = [];
  let allocatedSum = 0n;
  let largestPercentIdx = 0;
  let maxPercent = -1;

  for (let i = 0; i < splits.length; i++) {
    const s = splits[i];
    if (s.percent > maxPercent) {
      maxPercent = s.percent;
      largestPercentIdx = i;
    }
    // Basis points = percent * 100
    const bps = BigInt(Math.round(s.percent * 100));
    const owed = (totalAmount * bps) / 10000n;
    results.push({ userId: s.userId, owedAmount: owed });
    allocatedSum += owed;
  }

  // Assign any remainder to participant with largest percentage
  const remainder = totalAmount - allocatedSum;
  if (remainder !== 0n) {
    results[largestPercentIdx].owedAmount += remainder;
  }

  // Final invariant check
  const finalSum = results.reduce((acc, curr) => acc + curr.owedAmount, 0n);
  if (finalSum !== totalAmount) {
    throw new Error("خطای محاسباتی در تقسیم درصدی: مجموع سهم‌ها تطابق ندارد.");
  }

  return results;
}

/**
 * Calculates share/coefficient based splits (e.g. 2 shares, 1 share).
 * Distributes fractional remainders 1 by 1 to members with largest fractional remainders.
 */
export function calculateSharesSplit(
  totalAmount: bigint,
  splits: { userId: string; shares: number }[]
): SplitResult[] {
  if (totalAmount <= 0n) {
    throw new Error("مبلغ کل هزینه باید بزرگتر از صفر باشد.");
  }
  if (!splits || splits.length === 0) {
    throw new Error("حداقل یک عضو برای تقسیم سهمی الزامی است.");
  }
  validateMemberIds(splits.map((s) => s.userId));

  let totalShares = 0;
  for (const s of splits) {
    if (!Number.isInteger(s.shares) || s.shares < 1) {
      throw new Error("تعداد سهم هر عضو باید عدد صحیح مثبت (حداقل ۱) باشد.");
    }
    totalShares += s.shares;
  }

  if (totalShares <= 0) {
    throw new Error("مجموع سهم‌ها باید بزرگتر از صفر باشد.");
  }

  const bigTotalShares = BigInt(totalShares);
  const tempShares: {
    userId: string;
    owed: bigint;
    remainder: bigint;
    index: number;
  }[] = [];
  let allocatedSum = 0n;

  for (let i = 0; i < splits.length; i++) {
    const s = splits[i];
    const bigShare = BigInt(s.shares);
    const owed = (totalAmount * bigShare) / bigTotalShares;
    const remainder = (totalAmount * bigShare) % bigTotalShares;

    tempShares.push({
      userId: s.userId,
      owed,
      remainder,
      index: i,
    });
    allocatedSum += owed;
  }

  // Sort by fractional remainder descending, breaking ties by initial index ascending
  tempShares.sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder > a.remainder ? 1 : -1;
    }
    return a.index - b.index;
  });

  const leftover = Number(totalAmount - allocatedSum);
  for (let i = 0; i < leftover; i++) {
    tempShares[i].owed += 1n;
  }

  // Restore original ordering
  tempShares.sort((a, b) => a.index - b.index);

  const results: SplitResult[] = tempShares.map((t) => ({
    userId: t.userId,
    owedAmount: t.owed,
  }));

  // Final invariant check
  const finalSum = results.reduce((acc, curr) => acc + curr.owedAmount, 0n);
  if (finalSum !== totalAmount) {
    throw new Error("خطای محاسباتی در تقسیم سهمی: مجموع سهم‌ها تطابق ندارد.");
  }

  return results;
}
