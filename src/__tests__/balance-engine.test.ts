import { describe, it, expect } from "vitest";
import {
  calculateGroupBalances,
  verifyAccountingInvariant,
  simplifyDebts,
} from "../lib/accounting/balance-engine";

describe("Accounting Balance Engine & Debt Simplifier", () => {
  describe("Pure PERSONAL Expenses & Settlements", () => {
    it("should balance to exactly 0n for personal expenses and settlements", () => {
      // User A paid 120,000 for A, B, C (40,000 each)
      // User B settled 20,000 to User A
      const result = calculateGroupBalances({
        memberIds: ["userA", "userB", "userC"],
        expenses: [
          {
            totalAmount: 120000n,
            paymentSource: "PERSONAL",
            paidByUserId: "userA",
            splits: [
              { userId: "userA", owedAmount: 40000n },
              { userId: "userB", owedAmount: 40000n },
              { userId: "userC", owedAmount: 40000n },
            ],
          },
        ],
        settlements: [
          {
            fromUserId: "userB",
            toUserId: "userA",
            amount: 20000n,
          },
        ],
      });

      // User A: +120,000 - 40,000 (expense) - 20,000 (settlement received) = +60,000
      // User B: -40,000 (expense) + 20,000 (settlement paid) = -20,000
      // User C: -40,000 (expense) = -40,000
      const balA = result.memberBalances.find((m) => m.userId === "userA")?.netBalance;
      const balB = result.memberBalances.find((m) => m.userId === "userB")?.netBalance;
      const balC = result.memberBalances.find((m) => m.userId === "userC")?.netBalance;

      expect(balA).toBe(60000n);
      expect(balB).toBe(-20000n);
      expect(balC).toBe(-40000n);

      const totalMemberBalances = result.memberBalances.reduce(
        (acc, m) => acc + m.netBalance,
        0n
      );
      expect(totalMemberBalances).toBe(0n);
      expect(result.isBalanced).toBe(true);
    });
  });

  describe("Shared House Funds & Accounting Invariant", () => {
    it("should strictly maintain Sum(memberBalances) === Sum(fundBalances)", () => {
      // 1. User A deposits 1,000,000 into Fund 1
      // 2. Fund 1 pays 400,000 for groceries split equally between User A and User B (200,000 each)
      // 3. User B pays 100,000 personal expense split equally (50,000 each)
      // Resulting fund balance: 1,000,000 - 400,000 = 600,000
      const currentFundBalance = 600000n;

      const result = calculateGroupBalances({
        memberIds: ["userA", "userB"],
        expenses: [
          // Fund expense
          {
            totalAmount: 400000n,
            paymentSource: "FUND",
            paidByUserId: null,
            splits: [
              { userId: "userA", owedAmount: 200000n },
              { userId: "userB", owedAmount: 200000n },
            ],
          },
          // Personal expense
          {
            totalAmount: 100000n,
            paymentSource: "PERSONAL",
            paidByUserId: "userB",
            splits: [
              { userId: "userA", owedAmount: 50000n },
              { userId: "userB", owedAmount: 50000n },
            ],
          },
        ],
        settlements: [],
        fundTransactions: [
          {
            userId: "userA",
            amount: 1000000n,
            type: "DEPOSIT",
          },
        ],
        funds: [
          {
            id: "fund-1",
            currentBalance: currentFundBalance,
          },
        ],
      });

      // User A:
      // +1,000,000 (deposit) - 200,000 (fund exp) - 50,000 (personal exp) = +750,000
      // User B:
      // -200,000 (fund exp) + 100,000 (paid personal) - 50,000 (personal exp) = -150,000
      const balA = result.memberBalances.find((m) => m.userId === "userA")?.netBalance;
      const balB = result.memberBalances.find((m) => m.userId === "userB")?.netBalance;

      expect(balA).toBe(750000n);
      expect(balB).toBe(-150000n);

      const sumMembers = (balA ?? 0n) + (balB ?? 0n);
      expect(sumMembers).toBe(600000n);
      expect(sumMembers).toBe(currentFundBalance);
      expect(result.isBalanced).toBe(true);
      expect(
        verifyAccountingInvariant(result.memberBalances, [{ currentBalance: currentFundBalance }])
      ).toBe(true);
    });
  });

  describe("simplifyDebts (Greedy Min-Transaction)", () => {
    it("should simplify a 3-person transitive debt chain into a single transaction", () => {
      // User A owes 500,000 (netBalance = -500,000)
      // User B is net 0 (netBalance = 0)
      // User C is owed 500,000 (netBalance = +500,000)
      const debts = simplifyDebts({
        memberBalances: [
          { userId: "userA", netBalance: -500000n },
          { userId: "userB", netBalance: 0n },
          { userId: "userC", netBalance: 50000n },
        ],
      });

      // User A should directly pay User C
      expect(debts.length).toBe(1);
      expect(debts[0]).toEqual({
        fromId: "userA",
        toId: "userC",
        amount: 50000n,
      });
    });

    it("should include house funds as virtual cash-holders to balance positive funds", () => {
      // Member A has +800,000 (is creditor)
      // Member B has -200,000 (is debtor)
      // House fund has +600,000 cash
      const debts = simplifyDebts({
        memberBalances: [
          { userId: "userA", netBalance: 800000n },
          { userId: "userB", netBalance: -200000n },
        ],
        funds: [
          { id: "house-fund", currentBalance: 600000n },
        ],
      });

      // Total settled to userA must equal 800,000n
      const receivedByA = debts
        .filter((d) => d.toId === "userA")
        .reduce((sum, d) => sum + d.amount, 0n);
      expect(receivedByA).toBe(800000n);

      // Member B pays 200,000 to userA
      const fromB = debts.find((d) => d.fromId === "userB");
      expect(fromB?.amount).toBe(200000n);
      expect(fromB?.toId).toBe("userA");

      // Fund pays 600,000 to userA
      const fromFund = debts.find((d) => d.fromId === "FUND:house-fund");
      expect(fromFund?.amount).toBe(600000n);
      expect(fromFund?.toId).toBe("userA");
    });
  });
});
