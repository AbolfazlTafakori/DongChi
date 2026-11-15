import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { serializeBigInt } from "@/lib/serialize";
import {
  calculateGroupBalances,
  simplifyDebts,
} from "@/lib/accounting/balance-engine";
import { getSystemAnnouncement } from "@/lib/announcement";
import { detectIranBank, formatBankCard } from "@/lib/iran-banks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, phone: true, cardNumber: true },
                },
              },
            },
            funds: true,
            expenses: {
              include: {
                category: { select: { id: true, name: true, color: true, icon: true } },
                paidByUser: { select: { id: true, name: true } },
                fund: { select: { id: true, title: true } },
                splits: true,
              },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            settlements: {
              include: {
                fromUser: { select: { id: true, name: true } },
                toUser: { select: { id: true, name: true } },
              },
              orderBy: { settledAt: "desc" },
              take: 10,
            },
            fundTransactions: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    // 1. Process Groups & Balances
    const mySuggestedSettlements: Array<{
      groupId: string;
      groupTitle: string;
      counterpartyName: string;
      counterpartyId: string;
      type: "OWE" | "OWED";
      amount: string;
      settleUrl: string;
    }> = [];

    const coMembersMap = new Map<string, {
      userId: string;
      name: string;
      phone: string;
      cardNumber: string | null;
      formattedCard: string | null;
      bankName: string | null;
      groupTitles: string[];
    }>();

    const allActivities: Array<{
      id: string;
      type: "EXPENSE" | "SETTLEMENT";
      title: string;
      amount: string;
      groupTitle: string;
      groupId: string;
      categoryName?: string;
      categoryColor?: string;
      date: string;
    }> = [];

    const groupsData = memberships.map((m) => {
      const g = m.group;
      const memberIds = g.members.map((mem) => mem.userId);

      // Collect Co-Members
      g.members.forEach((mem) => {
        if (mem.userId !== session.userId && mem.user) {
          const existing = coMembersMap.get(mem.userId);
          if (existing) {
            if (!existing.groupTitles.includes(g.title)) {
              existing.groupTitles.push(g.title);
            }
          } else {
            const rawCard = mem.user.cardNumber;
            const bank = rawCard ? detectIranBank(rawCard) : null;
            coMembersMap.set(mem.userId, {
              userId: mem.userId,
              name: mem.user.name,
              phone: mem.user.phone,
              cardNumber: rawCard,
              formattedCard: rawCard ? formatBankCard(rawCard) : null,
              bankName: bank || null,
              groupTitles: [g.title],
            });
          }
        }
      });

      // Collect Activities
      g.expenses.forEach((e) => {
        allActivities.push({
          id: e.id,
          type: "EXPENSE",
          title: e.title,
          amount: e.totalAmount.toString(),
          groupTitle: g.title,
          groupId: g.id,
          categoryName: e.category.name,
          categoryColor: e.category.color,
          date: e.expenseDate.toISOString(),
        });
      });

      g.settlements.forEach((s) => {
        allActivities.push({
          id: s.id,
          type: "SETTLEMENT",
          title: `تسویه: ${s.fromUser.name} ← ${s.toUser.name}`,
          amount: s.amount.toString(),
          groupTitle: g.title,
          groupId: g.id,
          date: s.settledAt.toISOString(),
        });
      });

      // Calculate Group Balances & Debt Simplifications
      const balanceData = calculateGroupBalances({
        memberIds,
        expenses: g.expenses.map((e) => ({
          totalAmount: e.totalAmount,
          paymentSource: e.paymentSource,
          paidByUserId: e.paidByUserId,
          splits: e.splits.map((s) => ({
            userId: s.userId,
            owedAmount: s.owedAmount,
          })),
        })),
        settlements: g.settlements.map((s) => ({
          fromUserId: s.fromUserId,
          toUserId: s.toUserId,
          amount: s.amount,
        })),
        fundTransactions: g.fundTransactions.map((ft) => ({
          userId: ft.userId,
          amount: ft.amount,
          type: ft.type,
        })),
        funds: g.funds.map((f) => ({
          id: f.id,
          currentBalance: f.currentBalance,
        })),
      });

      const userBalance =
        balanceData.memberBalances.find((mb) => mb.userId === session.userId)
          ?.netBalance ?? 0n;

      const totalFundBalance = g.funds.reduce(
        (sum, f) => sum + f.currentBalance,
        0n
      );

      const debts = simplifyDebts({
        memberBalances: balanceData.memberBalances,
        funds: g.funds.map((f) => ({
          id: f.id,
          title: f.title,
          currentBalance: f.currentBalance,
        })),
      });

      // Extract User-Relevant Simplified Debts
      debts.forEach((debt) => {
        if (debt.amount <= 0n) return;

        if (debt.fromId === session.userId) {
          // User owes debt.toId
          const toMember = g.members.find((mem) => mem.userId === debt.toId);
          const toFund = g.funds.find((f) => `FUND:${f.id}` === debt.toId);
          const counterpartyName = toMember
            ? toMember.user.name
            : toFund
            ? toFund.title
            : "صندوق";

          mySuggestedSettlements.push({
            groupId: g.id,
            groupTitle: g.title,
            counterpartyName,
            counterpartyId: debt.toId,
            type: "OWE",
            amount: debt.amount.toString(),
            settleUrl: `/app/groups/${g.id}/settle?from=${debt.fromId}&to=${debt.toId}&amount=${debt.amount}`,
          });
        } else if (debt.toId === session.userId) {
          // debt.fromId owes user
          const fromMember = g.members.find((mem) => mem.userId === debt.fromId);
          const fromFund = g.funds.find((f) => `FUND:${f.id}` === debt.fromId);
          const counterpartyName = fromMember
            ? fromMember.user.name
            : fromFund
            ? fromFund.title
            : "صندوق";

          mySuggestedSettlements.push({
            groupId: g.id,
            groupTitle: g.title,
            counterpartyName,
            counterpartyId: debt.fromId,
            type: "OWED",
            amount: debt.amount.toString(),
            settleUrl: `/app/groups/${g.id}/settle?from=${debt.fromId}&to=${debt.toId}&amount=${debt.amount}`,
          });
        }
      });

      return {
        id: g.id,
        title: g.title,
        currency: g.currency,
        inviteCode: g.inviteCode,
        createdAt: g.createdAt,
        myRole: m.role,
        memberCount: g.members.length,
        totalFundBalance,
        myNetBalance: userBalance,
      };
    });

    // Sort activities by date descending (latest first)
    allActivities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(
      serializeBigInt({
        success: true,
        currentUserId: session.userId,
        groups: groupsData,
        suggestedSettlements: mySuggestedSettlements,
        coMembersCards: Array.from(coMembersMap.values()),
        recentActivities: allActivities.slice(0, 8),
        announcement: getSystemAnnouncement(),
      })
    );
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات داشبورد." },
      { status: 500 }
    );
  }
}
