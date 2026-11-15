import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { generateCsvReport } from "@/lib/accounting/analytics-engine";
import { formatToman } from "@/lib/money";
import { canAccessFeature } from "@/lib/subscription/feature-guard";

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

    // Entitlement Check: EXPORT_CSV
    const access = await canAccessFeature({
      userId: session.userId,
      groupId,
      feature: "EXPORT_CSV",
    });
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.reason,
          code: "PRO_REQUIRED",
          feature: "EXPORT_CSV",
        },
        { status: 402 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cycleQuery = searchParams.get("cycleId");

    const where: any = { groupId };
    if (cycleQuery && cycleQuery !== "ALL") {
      where.cycleId = cycleQuery;
    }

    const expenses = await prisma.expense.findMany({
      where,
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

    const rows = expenses.map((exp) => {
      const payerOrFundName =
        exp.paymentSource === "FUND"
          ? exp.fund?.title || "صندوق مشترک خانه"
          : exp.paidByUser?.name || "ناشناس";

      const splitType = exp.splits[0]?.splitType || "EQUAL";

      const memberSplitsDetail = exp.splits
        .map((s) => `${s.user.name || "کاربر"}: ${formatToman(s.owedAmount)} تومان`)
        .join(" | ");

      return {
        expenseDate: exp.expenseDate,
        title: exp.title,
        categoryName: exp.category?.name || "سایر",
        totalAmount: exp.totalAmount,
        paymentSource: exp.paymentSource,
        payerOrFundName,
        splitType,
        memberSplitsDetail,
      };
    });

    const csvContent = generateCsvReport(rows);

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dongchi-report-${groupId}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("GET /api/groups/[groupId]/reports/export error:", error);
    return NextResponse.json(
      { error: "خطا در خروجی فایل اکسل (CSV)." },
      { status: 500 }
    );
  }
}
