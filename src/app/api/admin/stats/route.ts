import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import { TxStatus, SubStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      bannedUsers,
      totalGroups,
      totalExpensesCount,
      expensesAggregate,
      activeProSubscriptions,
      revenueAggregate,
      recentOtpsLast24h,
      recentTransactions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.group.count(),
      prisma.expense.count(),
      prisma.expense.aggregate({
        _sum: { totalAmount: true },
      }),
      prisma.subscription.count({
        where: {
          status: SubStatus.ACTIVE,
          expiresAt: { gt: now },
          plan: { price: { gt: 0n } },
        },
      }),
      prisma.transaction.aggregate({
        where: { status: TxStatus.SUCCESS },
        _sum: { amount: true },
      }),
      prisma.otpCode.count({
        where: { createdAt: { gte: last24h } },
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, phone: true } },
          plan: { select: { title: true, slug: true } },
        },
      }),
    ]);

    const totalExpensesVolume = expensesAggregate._sum.totalAmount || 0n;
    const totalSuccessfulRevenue = revenueAggregate._sum.amount || 0n;
    const smsMode = process.env.SMS_API_KEY ? "LIVE" : "DEV_SANDBOX";

    return NextResponse.json(
      serializeBigInt({
        totalUsers,
        bannedUsers,
        totalGroups,
        totalExpensesCount,
        totalExpensesVolume,
        activeProSubscriptions,
        totalSuccessfulRevenue,
        smsMode,
        recentOtpsLast24h,
        recentTransactions,
      })
    );
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت آمار سیستم." },
      { status: 500 }
    );
  }
}
