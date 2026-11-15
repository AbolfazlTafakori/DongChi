import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { serializeBigInt } from "@/lib/serialize";
import {
  calculateCategoryBudgets,
  calculateSpendingInsights,
} from "@/lib/accounting/analytics-engine";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const { groupId } = params;

    // Verify membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "شما عضو این گروه نیستید." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cycleQuery = searchParams.get("cycleId");

    // Fetch all cycles for this group
    const cycles = await prisma.billingCycle.findMany({
      where: { groupId },
      orderBy: { startDate: "desc" },
    });

    let selectedCycle: (typeof cycles)[0] | null = null;

    if (cycleQuery && cycleQuery !== "ALL") {
      selectedCycle = cycles.find((c) => c.id === cycleQuery) || null;
    } else if (!cycleQuery) {
      // Default to active open cycle, or most recent cycle
      selectedCycle = cycles.find((c) => !c.isClosed) || cycles[0] || null;
    }

    // Build expense filter
    const expenseWhere: any = { groupId };
    if (selectedCycle) {
      expenseWhere.cycleId = selectedCycle.id;
    }

    // Fetch expenses for current selection
    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
      include: {
        category: true,
        paidByUser: { select: { id: true, name: true } },
        fund: { select: { id: true, title: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { expenseDate: "desc" },
    });

    // Fetch previous cycle total for MoM comparison
    let previousPeriodTotal = 0n;
    if (selectedCycle) {
      const prevCycle = cycles.find(
        (c) => new Date(c.startDate) < new Date(selectedCycle!.startDate)
      );
      if (prevCycle) {
        const prevExpenses = await prisma.expense.findMany({
          where: { groupId, cycleId: prevCycle.id },
          select: { totalAmount: true },
        });
        previousPeriodTotal = prevExpenses.reduce(
          (sum, e) => sum + e.totalAmount,
          0n
        );
      }
    }

    // Fetch categories and budgets
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ isSystem: true }, { groupId }],
      },
      orderBy: { name: "asc" },
    });

    const budgets = await prisma.budget.findMany({
      where: { groupId },
    });

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true, phone: true } },
      },
    });

    // Calculate days elapsed and total days in cycle
    let elapsedDays = 30;
    let totalDays = 30;

    if (selectedCycle) {
      const startMs = new Date(selectedCycle.startDate).getTime();
      const endMs = new Date(selectedCycle.endDate).getTime();
      const nowMs = Date.now();

      totalDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
      const effectiveEnd = selectedCycle.isClosed
        ? selectedCycle.closedAt
          ? new Date(selectedCycle.closedAt).getTime()
          : endMs
        : Math.min(nowMs, endMs);

      elapsedDays = Math.max(
        1,
        Math.ceil((effectiveEnd - startMs) / (1000 * 60 * 60 * 24))
      );
    }

    // Run Analytics Engine
    const categoryBudgets = calculateCategoryBudgets({
      categories,
      budgets,
      expenses,
      elapsedDays,
      totalDays,
    });

    const memberIds = members.map((m) => m.userId);

    const spendingInsights = calculateSpendingInsights({
      currentExpenses: expenses,
      previousPeriodTotal,
      memberIds,
      elapsedDays,
    });

    // Fill category name for topCategory
    if (spendingInsights.topCategory) {
      const cat = categories.find(
        (c) => c.id === spendingInsights.topCategory!.id
      );
      if (cat) {
        spendingInsights.topCategory.name = cat.name;
      }
    }

    return NextResponse.json(
      serializeBigInt({
        cycles,
        selectedCycle,
        categoryBudgets,
        spendingInsights,
        members: members.map((m) => ({
          userId: m.userId,
          name: m.user.name,
          phone: m.user.phone,
          role: m.role,
        })),
        expensesCount: expenses.length,
      })
    );
  } catch (error) {
    console.error("GET /api/groups/[groupId]/reports error:", error);
    return NextResponse.json(
      { error: "خطا در پردازش و تهیه گزارش‌های مالی." },
      { status: 500 }
    );
  }
}
