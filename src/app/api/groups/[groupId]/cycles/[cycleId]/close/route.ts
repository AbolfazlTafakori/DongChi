import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { serializeBigInt } from "@/lib/serialize";
import { GroupRole, AuditAction } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string; cycleId: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const { groupId, cycleId } = params;

    // Verify membership and OWNER permission
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

    if (membership.role !== GroupRole.OWNER) {
      return NextResponse.json(
        { error: "تنها مدیر گروه مجاز به بستن دوره مالی است." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const nextCycleTitle = body.nextCycleTitle
      ? String(body.nextCycleTitle).trim()
      : "دوره مالی جدید";

    const result = await prisma.$transaction(async (tx) => {
      const cycle = await tx.billingCycle.findFirst({
        where: { id: cycleId, groupId },
      });

      if (!cycle) {
        throw new Error("NOT_FOUND");
      }

      if (cycle.isClosed) {
        throw new Error("ALREADY_CLOSED");
      }

      // Attach any remaining unassigned expenses of this group to this cycle before closing
      await tx.expense.updateMany({
        where: {
          groupId,
          cycleId: null,
        },
        data: {
          cycleId: cycle.id,
        },
      });

      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // 1. Mark existing cycle closed
      const closedCycle = await tx.billingCycle.update({
        where: { id: cycleId },
        data: {
          isClosed: true,
          closedAt: now,
        },
      });

      // 2. Open new next cycle
      const newCycle = await tx.billingCycle.create({
        data: {
          groupId,
          title: nextCycleTitle,
          startDate: now,
          endDate: in30Days,
          isClosed: false,
        },
      });

      // 3. Record AuditLog
      await tx.auditLog.create({
        data: {
          groupId,
          changedByUserId: session.userId,
          action: AuditAction.UPDATE,
          newData: {
            action: "CLOSE_BILLING_CYCLE",
            closedCycleId: closedCycle.id,
            closedCycleTitle: closedCycle.title,
            closedAt: now.toISOString(),
            newCycleId: newCycle.id,
            newCycleTitle: newCycle.title,
          },
        },
      });

      return { closedCycle, newCycle };
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: "دوره مالی با موفقیت بسته شد و دوره جدید آغاز گردید.",
        ...result,
      })
    );
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "دوره مالی مورد نظر یافت نشد." },
        { status: 404 }
      );
    }
    if (error.message === "ALREADY_CLOSED") {
      return NextResponse.json(
        { error: "این دوره مالی قبلاً بسته شده است." },
        { status: 400 }
      );
    }
    console.error("POST /api/groups/[groupId]/cycles/[cycleId]/close error:", error);
    return NextResponse.json(
      { error: "خطا در بستن دوره مالی." },
      { status: 500 }
    );
  }
}
