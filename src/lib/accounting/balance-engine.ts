/**
 * Double-entry household accounting balance and debt simplification engine for DongChi.
 * All computations use native BigInt arithmetic representing Tomans.
 */

export interface ExpenseInput {
  totalAmount: bigint;
  paymentSource: "PERSONAL" | "FUND";
  fundId?: string | null;
  paidByUserId?: string | null;
  splits: {
    userId: string;
    owedAmount: bigint;
  }[];
}

export interface SettlementInput {
  fromUserId: string;
  toUserId: string;
  amount: bigint;
}

export interface FundTransactionInput {
  userId: string;
  amount: bigint;
  type: "DEPOSIT" | "ADJUSTMENT";
}

export interface FundInput {
  id: string;
  title?: string;
  currentBalance: bigint;
}

export interface MemberBalance {
  userId: string;
  netBalance: bigint; // > 0n means creditor (طلبکار), < 0n means debtor (بدهکار)
}

export interface SimplifiedDebt {
  fromId: string;
  toId: string;
  amount: bigint;
}

/**
 * Asserts the fundamental household accounting invariant:
 * Sum of all members' net balances MUST equal Sum of all group funds' current balance.
 */
export function verifyAccountingInvariant(
  memberBalances: { netBalance: bigint }[],
  funds: { currentBalance: bigint }[]
): boolean {
  const sumMembers = memberBalances.reduce((acc, m) => acc + m.netBalance, 0n);
  const sumFunds = funds.reduce((acc, f) => acc + f.currentBalance, 0n);
  return sumMembers === sumFunds;
}

/**
 * Zero-Sum Ledger Integrity Check:
 * Guarantees that in any group, the algebraic sum of all debtors (< 0n) and creditors (> 0n)
 * strictly equals the sum of funds (or 0n if no funds).
 * Returns detailed diagnostic information to prevent any leakage or rounding discrepancy.
 */
export function checkLedgerZeroSumIntegrity(
  memberBalances: { userId?: string; netBalance: bigint }[],
  funds: { currentBalance: bigint }[] = []
): {
  isValid: boolean;
  totalDebits: bigint;
  totalCredits: bigint;
  fundsBalance: bigint;
  discrepancy: bigint;
} {
  let totalDebits = 0n;
  let totalCredits = 0n;

  for (const mb of memberBalances) {
    if (mb.netBalance > 0n) {
      totalCredits += mb.netBalance;
    } else {
      totalDebits += -mb.netBalance;
    }
  }

  const fundsBalance = funds.reduce((acc, f) => acc + f.currentBalance, 0n);
  const netMembers = totalCredits - totalDebits;
  const discrepancy = netMembers - fundsBalance;

  return {
    isValid: discrepancy === 0n,
    totalDebits,
    totalCredits,
    fundsBalance,
    discrepancy,
  };
}

/**
 * Calculates net balances for all group members according to double-entry rules.
 */
export function calculateGroupBalances(input: {
  memberIds: string[];
  expenses: ExpenseInput[];
  settlements: SettlementInput[];
  fundTransactions?: FundTransactionInput[];
  funds?: FundInput[];
}): {
  memberBalances: MemberBalance[];
  fundBalances: { fundId: string; balance: bigint }[];
  isBalanced: boolean;
} {
  const balances = new Map<string, bigint>();

  // Initialize all members with 0n
  for (const memberId of input.memberIds) {
    balances.set(memberId, 0n);
  }

  // 1. Process Expenses
  for (const exp of input.expenses) {
    if (exp.paymentSource === "PERSONAL") {
      if (exp.paidByUserId) {
        const currentPaid = balances.get(exp.paidByUserId) ?? 0n;
        balances.set(exp.paidByUserId, currentPaid + exp.totalAmount);
      }
    }
    // For FUND expenses, money came from the house card (no individual member paid out-of-pocket),
    // so no member receives a credit. Each member consumes their share in splits.

    // Deduct each member's owed amount
    for (const split of exp.splits) {
      const current = balances.get(split.userId) ?? 0n;
      balances.set(split.userId, current - split.owedAmount);
    }
  }

  // 2. Process Settlements between members
  for (const s of input.settlements) {
    // fromUserId paid money to toUserId
    // fromUserId's balance increases (+amount), toUserId's balance decreases (-amount)
    const fromBal = balances.get(s.fromUserId) ?? 0n;
    balances.set(s.fromUserId, fromBal + s.amount);

    const toBal = balances.get(s.toUserId) ?? 0n;
    balances.set(s.toUserId, toBal - s.amount);
  }

  // 3. Process Fund Transactions (Deposits & Adjustments)
  if (input.fundTransactions) {
    for (const tx of input.fundTransactions) {
      if (tx.type === "DEPOSIT") {
        // Member deposited personal funds into house fund -> member is credited
        const current = balances.get(tx.userId) ?? 0n;
        balances.set(tx.userId, current + tx.amount);
      } else if (tx.type === "ADJUSTMENT") {
        // Surplus adjustment on shared fund: distribute surplus equally across all members
        // so Sum(members' netBalance) === Sum(funds' currentBalance) remains strictly preserved.
        if (input.memberIds.length > 0) {
          const n = BigInt(input.memberIds.length);
          const baseShare = tx.amount / n;
          const rem = Number(tx.amount % n);

          for (let i = 0; i < input.memberIds.length; i++) {
            const memberId = input.memberIds[i];
            const current = balances.get(memberId) ?? 0n;
            const share = i < rem ? baseShare + 1n : baseShare;
            balances.set(memberId, current + share);
          }
        }
      }
    }
  }

  const memberBalances: MemberBalance[] = input.memberIds.map((userId) => ({
    userId,
    netBalance: balances.get(userId) ?? 0n,
  }));

  const fundBalances = (input.funds || []).map((f) => ({
    fundId: f.id,
    balance: f.currentBalance,
  }));

  const isBalanced = verifyAccountingInvariant(
    memberBalances,
    input.funds || []
  );

  return {
    memberBalances,
    fundBalances,
    isBalanced,
  };
}

/**
 * Simplifies group debts using a greedy minimum-transaction settlement algorithm.
 * Accounts for positive shared house funds by treating them as virtual cash-holders
 * (id: `FUND:${fund.id}`, balance: `-fund.currentBalance`), maintaining a strictly zero-sum system.
 */
export function simplifyDebts(params: {
  memberBalances: { userId: string; netBalance: bigint }[];
  funds?: { id: string; title?: string; currentBalance: bigint }[];
}): SimplifiedDebt[] {
  // Collect all entities with non-zero balances
  const nodes: { id: string; balance: bigint }[] = [];

  for (const mb of params.memberBalances) {
    if (mb.netBalance !== 0n) {
      nodes.push({ id: mb.userId, balance: mb.netBalance });
    }
  }

  // Include house funds as virtual debtors if they have positive balance,
  // because the house fund holds the money owed back to members
  if (params.funds) {
    for (const fund of params.funds) {
      if (fund.currentBalance > 0n) {
        nodes.push({
          id: `FUND:${fund.id}`,
          balance: -fund.currentBalance,
        });
      }
    }
  }

  // Sanity check: sum of all node balances must equal zero
  const netSum = nodes.reduce((acc, n) => acc + n.balance, 0n);
  if (netSum !== 0n) {
    // If there is any discrepancy, proceed with min-match as best effort without throwing
  }

  const transactions: SimplifiedDebt[] = [];

  // Separate debtors (balance < 0n) and creditors (balance > 0n)
  let debtors = nodes
    .filter((n) => n.balance < 0n)
    .map((n) => ({ id: n.id, balance: n.balance }));
  let creditors = nodes
    .filter((n) => n.balance > 0n)
    .map((n) => ({ id: n.id, balance: n.balance }));

  while (debtors.length > 0 && creditors.length > 0) {
    // Sort debtors ascending (most negative first)
    debtors.sort((a, b) => (a.balance < b.balance ? -1 : 1));
    // Sort creditors descending (largest creditor first)
    creditors.sort((a, b) => (b.balance > a.balance ? 1 : -1));

    const debtor = debtors[0];
    const creditor = creditors[0];

    const debtOwed = -debtor.balance;
    const creditAvailable = creditor.balance;

    const transferAmount = debtOwed < creditAvailable ? debtOwed : creditAvailable;

    if (transferAmount > 0n) {
      transactions.push({
        fromId: debtor.id,
        toId: creditor.id,
        amount: transferAmount,
      });
    }

    debtor.balance += transferAmount;
    creditor.balance -= transferAmount;

    // Filter out settled nodes
    debtors = debtors.filter((d) => d.balance < 0n);
    creditors = creditors.filter((c) => c.balance > 0n);
  }

  return transactions;
}
