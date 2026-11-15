import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import { SubStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId } = params;
    const body = await request.json().catch(() => ({}));
    const days = Math.max(1, Number(body.days) || 30);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "کاربر مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    // Find a Pro plan to associate with the grant
    const proPlan = await prisma.plan.findFirst({
      where: {
        price: { gt: 0n },
        isActive: true,
      },
      orderBy: { price: "asc" },
    });

    if (!proPlan) {
      return NextResponse.json(
        { error: "پلن اشتراک حرفه‌ای در سیستم یافت نشد." },
        { status: 404 }
      );
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Find existing active subscription
      const existingActiveSub = await tx.subscription.findFirst({
        where: {
          userId,
          status: SubStatus.ACTIVE,
          expiresAt: { gt: now },
        },
        orderBy: { expiresAt: "desc" },
      });

      // Stackable Renewal Calculation
      const baseDate =
        existingActiveSub && existingActiveSub.expiresAt > now
          ? existingActiveSub.expiresAt
          : now;

      const durationMs = days * 24 * 60 * 60 * 1000;
      const newExpiresAt = new Date(baseDate.getTime() + durationMs);

      let sub;
      if (existingActiveSub) {
        sub = await tx.subscription.update({
          where: { id: existingActiveSub.id },
          data: {
            expiresAt: newExpiresAt,
            planId: proPlan.id,
          },
          include: { plan: true },
        });
      } else {
        sub = await tx.subscription.create({
          data: {
            userId,
            planId: proPlan.id,
            status: SubStatus.ACTIVE,
            startsAt: now,
            expiresAt: newExpiresAt,
          },
          include: { plan: true },
        });
      }

      return { sub, newExpiresAt };
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: `اشتراک حرفه‌ای کاربر به مدت ${days} روز تمدید/فعال گردید.`,
        subscription: result.sub,
        expiresAt: result.newExpiresAt,
      })
    );
  } catch (error) {
    console.error("POST /api/admin/users/[userId]/grant-pro error:", error);
    return NextResponse.json(
      { error: "خطا در اعطای اشتراک حرفه‌ای به کاربر." },
      { status: 500 }
    );
  }
}
