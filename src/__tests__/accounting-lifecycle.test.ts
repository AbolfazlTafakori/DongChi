import { describe, it, expect } from "vitest";
import {
  calculateGroupBalances,
  verifyAccountingInvariant,
  ExpenseInput,
  SettlementInput,
  FundTransactionInput,
  FundInput,
} from "../lib/accounting/balance-engine";
import { calculateEqualSplit, calculateSharesSplit } from "../lib/accounting/split-calculator";

describe("Household Accounting Lifecycle & Invariant Verification", () => {
  const members = ["memberA", "memberB", "memberC"];
  const fundId = "house-fund-1";

  it("should maintain verifyAccountingInvariant strictly at EVERY single step of a realistic lifecycle", () => {
    let expenses: ExpenseInput[] = [];
    let settlements: SettlementInput[] = [];
    let fundTransactions: FundTransactionInput[] = [];
    let fundBalance = 0n;

    const assertInvariant = (stepName: string) => {
      const result = calculateGroupBalances({
        memberIds: members,
        expenses,
        settlements,
        fundTransactions,
        funds: [{ id: fundId, currentBalance: fundBalance }],
      });

      const isInvariantPreserved = verifyAccountingInvariant(
        result.memberBalances,
        [{ currentBalance: fundBalance }]
      );

      expect(
        isInvariantPreserved,
        `Accounting invariant violated at ${stepName}`
      ).toBe(true);
      expect(result.isBalanced).toBe(true);

      const sumMembers = result.memberBalances.reduce(
        (acc, m) => acc + m.netBalance,
        0n
      );
      expect(sumMembers).toBe(fundBalance);

      return result;
    };

    // Step 0: Initial state (all 0)
    assertInvariant("Step 0: Initial state");

    // Step 1: Member A deposits 2,000,000 Tomans into Shared Fund
    const depositAmount = 2000000n;
    fundTransactions.push({
      userId: "memberA",
      amount: depositAmount,
      type: "DEPOSIT",
    });
    fundBalance += depositAmount;

    const step1 = assertInvariant("Step 1: Member A deposits 2,000,000 into Shared Fund");
    const balA1 = step1.memberBalances.find((m) => m.userId === "memberA")?.netBalance;
    const balB1 = step1.memberBalances.find((m) => m.userId === "memberB")?.netBalance;
    const balC1 = step1.memberBalances.find((m) => m.userId === "memberC")?.netBalance;

    expect(balA1).toBe(2000000n);
    expect(balB1).toBe(0n);
    expect(balC1).toBe(0n);
    expect(fundBalance).toBe(2000000n);

    // Step 2: FUND expense of 600,000 Tomans split equally across 3 members (200,000 each)
    const fundExpAmount = 600000n;
    const fundSplits = calculateEqualSplit(fundExpAmount, members);
    expenses.push({
      totalAmount: fundExpAmount,
      paymentSource: "FUND",
      fundId,
      paidByUserId: null,
      splits: fundSplits,
    });
    fundBalance -= fundExpAmount;

    const step2 = assertInvariant("Step 2: FUND expense of 600,000 split equally");
    const balA2 = step2.memberBalances.find((m) => m.userId === "memberA")?.netBalance;
    const balB2 = step2.memberBalances.find((m) => m.userId === "memberB")?.netBalance;
    const balC2 = step2.memberBalances.find((m) => m.userId === "memberC")?.netBalance;

    // A: 2,000,000 - 200,000 = 1,800,000
    // B: -200,000
    // C: -200,000
    expect(balA2).toBe(1800000n);
    expect(balB2).toBe(-200000n);
    expect(balC2).toBe(-200000n);
    expect(fundBalance).toBe(1400000n);

    // Step 3: PERSONAL expense by Member B of 300,000 Tomans split by shares (2 for A, 1 for B, 1 for C)
    // 300,000 * 2/4 = 150,000 for A
    // 300,000 * 1/4 = 75,000 for B
    // 300,000 * 1/4 = 75,000 for C
    const personalExpAmount = 300000n;
    const personalSplits = calculateSharesSplit(personalExpAmount, [
      { userId: "memberA", shares: 2 },
      { userId: "memberB", shares: 1 },
      { userId: "memberC", shares: 1 },
    ]);
    expenses.push({
      totalAmount: personalExpAmount,
      paymentSource: "PERSONAL",
      paidByUserId: "memberB",
      splits: personalSplits,
    });

    const step3 = assertInvariant("Step 3: PERSONAL expense by Member B with shares split");
    const balA3 = step3.memberBalances.find((m) => m.userId === "memberA")?.netBalance;
    const balB3 = step3.memberBalances.find((m) => m.userId === "memberB")?.netBalance;
    const balC3 = step3.memberBalances.find((m) => m.userId === "memberC")?.netBalance;

    // A: 1,800,000 - 150,000 = 1,650,000
    // B: -200,000 + 300,000 (paid) - 75,000 (share) = +25,000
    // C: -200,000 - 75,000 = -275,000
    expect(balA3).toBe(1650000n);
    expect(balB3).toBe(25000n);
    expect(balC3).toBe(-275000n);
    expect(fundBalance).toBe(1400000n);

    // Step 4A: Card Reconciliation SHORTAGE of 90,000 Tomans
    // System creates FUND expense of 90,000 split equally (30,000 each)
    const shortageAmount = 90000n;
    const shortageSplits = calculateEqualSplit(shortageAmount, members);
    expenses.push({
      totalAmount: shortageAmount,
      paymentSource: "FUND",
      fundId,
      splits: shortageSplits,
    });
    fundBalance -= shortageAmount; // Fund now 1,310,000

    const step4A = assertInvariant("Step 4A: Reconciliation shortage of 90,000");
    const balA4A = step4A.memberBalances.find((m) => m.userId === "memberA")?.netBalance;
    const balB4A = step4A.memberBalances.find((m) => m.userId === "memberB")?.netBalance;
    const balC4A = step4A.memberBalances.find((m) => m.userId === "memberC")?.netBalance;

    expect(balA4A).toBe(1620000n); // 1,650,000 - 30,000
    expect(balB4A).toBe(-5000n);   // 25,000 - 30,000
    expect(balC4A).toBe(-305000n); // -275,000 - 30,000
    expect(fundBalance).toBe(1310000n);

    // Step 4B: Card Reconciliation SURPLUS of 30,000 Tomans
    // Creates FundTransaction(ADJUSTMENT, 30,000), increasing fund to 1,340,000
    // and distributing 10,000 equally to each member
    const surplusAmount = 30000n;
    fundTransactions.push({
      userId: "memberA",
      amount: surplusAmount,
      type: "ADJUSTMENT",
    });
    fundBalance += surplusAmount; // Fund now 1,340,000

    const step4B = assertInvariant("Step 4B: Reconciliation surplus of 30,000");
    const balA4B = step4B.memberBalances.find((m) => m.userId === "memberA")?.netBalance;
    const balB4B = step4B.memberBalances.find((m) => m.userId === "memberB")?.netBalance;
    const balC4B = step4B.memberBalances.find((m) => m.userId === "memberC")?.netBalance;

    expect(balA4B).toBe(1630000n); // 1,620,000 + 10,000
    expect(balB4B).toBe(5000n);    // -5,000 + 10,000
    expect(balC4B).toBe(-295000n); // -305,000 + 10,000
    expect(fundBalance).toBe(1340000n);

    // Step 5: Peer-to-peer Settlement from Member C to Member A (100,000 Tomans)
    const settleAmount = 100000n;
    settlements.push({
      fromUserId: "memberC",
      toUserId: "memberA",
      amount: settleAmount,
    });

    const step5 = assertInvariant("Step 5: Settlement from Member C to Member A of 100,000");
    const balA5 = step5.memberBalances.find((m) => m.userId === "memberA")?.netBalance;
    const balB5 = step5.memberBalances.find((m) => m.userId === "memberB")?.netBalance;
    const balC5 = step5.memberBalances.find((m) => m.userId === "memberC")?.netBalance;

    // Member C paid 100,000: balance improves from -295,000 to -195,000 (+100,000)
    // Member A received 100,000: credit reduces from +1,630,000 to +1,530,000 (-100,000)
    expect(balA5).toBe(1530000n);
    expect(balB5).toBe(5000n);
    expect(balC5).toBe(-195000n);
    expect(fundBalance).toBe(1340000n);

    // Final total check: 1,530,000 + 5,000 - 195,000 = 1,340,000 === fundBalance
    const totalFinal = (balA5 ?? 0n) + (balB5 ?? 0n) + (balC5 ?? 0n);
    expect(totalFinal).toBe(fundBalance);
  });
});
