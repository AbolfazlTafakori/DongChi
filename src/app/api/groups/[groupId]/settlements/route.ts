import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { serializeBigInt } from "@/lib/serialize";
import { parseToman } from "@/lib/money";
import { AuditAction } from "@prisma/client";
import { invalidateUserSyncCache } from "@/lib/high-scale-cache";

export const dynamic = "force-dynamic";

export async function POST(
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

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "اطلاعات ارسالی نامعتبر است." },
        { status: 400 }
      );
    }

    const fromUserId = body.fromUserId ? String(body.fromUserId).trim() : "";
    const toUserId = body.toUserId ? String(body.toUserId).trim() : "";

    if (!fromUserId || !toUserId) {
      return NextResponse.json(
        { error: "انتخاب پرداخت‌کننده و دریافت‌کننده تسویه الزامی است." },
        { status: 400 }
      );
    }

    if (fromUserId === toUserId) {
      return NextResponse.json(
        { error: "پرداخت‌کننده و دریافت‌کننده نمی‌توانند یکسان باشند." },
        { status: 400 }
      );
    }

    // Verify both are members of groupId
    const members = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { in: [fromUserId, toUserId] },
      },
    });

    if (members.length !== 2) {
      return NextResponse.json(
        { error: "طرفین تسویه باید هر دو عضو این گروه باشند." },
        { status: 400 }
      );
    }

    const amount = parseToman(String(body.amount ?? ""));
    if (amount <= 0n) {
      return NextResponse.json(
        { error: "مبلغ تسویه باید بزرگتر از صفر باشد." },
        { status: 400 }
      );
    }

    // Anti-duplication / Idempotency guard for weak mobile connections
    const duplicateWindow = new Date(Date.now() - 15000);
    const existingRecentSettlement = await prisma.settlement.findFirst({
      where: {
        groupId,
        fromUserId,
        toUserId,
        amount,
        settledAt: { gte: duplicateWindow },
      },
      include: {
        fromUser: { select: { id: true, name: true, phone: true } },
        toUser: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { settledAt: "desc" },
    });

    if (existingRecentSettlement) {
      return NextResponse.json(
        serializeBigInt({
          success: true,
          message: "تسویه‌حساب قبلاً ثبت شده است (محافظت در برابر کلیک تکراری).",
          settlement: existingRecentSettlement,
        }),
        { status: 200 }
      );
    }

    const note = body.note ? String(body.note).trim() : null;
    const settledAt = body.settledAt ? new Date(body.settledAt) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const settlement = await tx.settlement.create({
        data: {
          groupId,
          fromUserId,
          toUserId,
          amount,
          note,
          settledAt,
        },
        include: {
          fromUser: { select: { id: true, name: true, phone: true } },
          toUser: { select: { id: true, name: true, phone: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          groupId,
          changedByUserId: session.userId,
          action: AuditAction.CREATE,
          newData: {
            action: "SETTLEMENT",
            fromUserId,
            fromUserName: settlement.fromUser.name,
            toUserId,
            toUserName: settlement.toUser.name,
            amount: amount.toString(),
            note,
          },
        },
      });

      return settlement;
    });

    // Invalidate sync cache so both fromUser and toUser receive updated balances immediately
    invalidateUserSyncCache(session.userId, groupId);

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: "تسویه‌حساب با موفقیت ثبت شد.",
        settlement: result,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/groups/[groupId]/settlements error:", error);
    return NextResponse.json(
      { error: "خطا در ثبت تسویه‌حساب." },
      { status: 500 }
    );
  }
}
