import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { serializeBigInt } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
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

    let cycles = await prisma.billingCycle.findMany({
      where: { groupId },
      orderBy: { startDate: "desc" },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    // If no cycles exist for this group, auto-create the initial active cycle
    if (cycles.length === 0) {
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const initialCycle = await prisma.$transaction(async (tx) => {
        const cycle = await tx.billingCycle.create({
          data: {
            groupId,
            title: "دوره جاری خانه",
            startDate: now,
            endDate: in30Days,
            isClosed: false,
          },
        });

        // Attach existing unassigned expenses to this initial cycle
        await tx.expense.updateMany({
          where: {
            groupId,
            cycleId: null,
          },
          data: {
            cycleId: cycle.id,
          },
        });

        return cycle;
      });

      const count = await prisma.expense.count({
        where: { cycleId: initialCycle.id },
      });

      cycles = [
        {
          ...initialCycle,
          _count: { expenses: count },
        },
      ];
    }

    return NextResponse.json(serializeBigInt({ cycles }));
  } catch (error) {
    console.error("GET /api/groups/[groupId]/cycles error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت دوره‌های مالی." },
      { status: 500 }
    );
  }
}
