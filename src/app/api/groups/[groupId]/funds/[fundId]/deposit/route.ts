import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { serializeBigInt } from "@/lib/serialize";
import { parseToman } from "@/lib/money";
import { FundTxType, AuditAction } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string; fundId: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const { groupId, fundId } = params;

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

    // Verify fund belongs to group
    const fund = await prisma.fund.findFirst({
      where: { id: fundId, groupId },
    });

    if (!fund) {
      return NextResponse.json(
        { error: "صندوق مورد نظر در این گروه یافت نشد." },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || body.amount === undefined || body.amount === null) {
      return NextResponse.json(
        { error: "مبلغ واریزی الزامی است." },
        { status: 400 }
      );
    }

    const amount = parseToman(String(body.amount));
    if (amount <= 0n) {
      return NextResponse.json(
        { error: "مبلغ واریزی باید بزرگتر از صفر باشد." },
        { status: 400 }
      );
    }

    const note = body.note ? String(body.note).trim() : null;

    // Atomic transaction: increment balance, log transaction, record audit log
    const result = await prisma.$transaction(async (tx) => {
      const updatedFund = await tx.fund.update({
        where: { id: fundId },
        data: {
          currentBalance: {
            increment: amount,
          },
        },
      });

      const txRecord = await tx.fundTransaction.create({
        data: {
          fundId,
          groupId,
          userId: session.userId,
          amount,
          type: FundTxType.DEPOSIT,
          note,
        },
      });

      await tx.auditLog.create({
        data: {
          groupId,
          changedByUserId: session.userId,
          action: AuditAction.UPDATE,
          newData: {
            action: "FUND_DEPOSIT",
            fundId,
            fundTitle: fund.title,
            amount: amount.toString(),
            note,
          },
        },
      });

      return { fund: updatedFund, transaction: txRecord };
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: "واریز به صندوق با موفقیت ثبت شد.",
        ...result,
      })
    );
  } catch (error) {
    console.error("POST /api/groups/[groupId]/funds/[fundId]/deposit error:", error);
    return NextResponse.json(
      { error: "خطا در ثبت واریز به صندوق." },
      { status: 500 }
    );
  }
}
