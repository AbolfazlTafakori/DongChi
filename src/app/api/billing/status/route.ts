import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { getUserSubscriptionStatus } from "@/lib/subscription/feature-guard";
import { ensureStandardPlans } from "@/lib/subscription/ensure-plans";
import { serializeBigInt } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    await ensureStandardPlans();

    const [subscriptionStatus, plans, transactions] = await Promise.all([
      getUserSubscriptionStatus(session.userId),
      prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { price: "asc" },
      }),
      prisma.transaction.findMany({
        where: { userId: session.userId },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    return NextResponse.json(
      serializeBigInt({
        subscriptionStatus,
        plans,
        transactions,
      })
    );
  } catch (error) {
    console.error("GET /api/billing/status error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت وضعیت اشتراک و پلن‌ها." },
      { status: 500 }
    );
  }
}
