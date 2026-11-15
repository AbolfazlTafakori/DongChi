import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { serializeBigInt } from "@/lib/serialize";
import { parseToman } from "@/lib/money";
import { calculateEqualSplit } from "@/lib/accounting/split-calculator";
import { PaymentSource, SplitType, FundTxType, AuditAction } from "@prisma/client";

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

    // Verify fund
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
    if (!body || body.actualBalance === undefined || body.actualBalance === null) {
      return NextResponse.json(
        { error: "موجودی واقعی کارت بانکی الزامی است." },
        { status: 400 }
      );
    }

    const actualBalance = parseToman(String(body.actualBalance));
    if (actualBalance < 0n) {
      return NextResponse.json(
        { error: "موجودی کارت نمی‌تواند منفی باشد." },
        { status: 400 }
      );
    }

    const note = body.note ? String(body.note).trim() : null;

    const diff = actualBalance - fund.currentBalance;

    if (diff === 0n) {
      return NextResponse.json({
        success: true,
        message: "موجودی کارت با سیستم کاملاً تراز است و مغایرتی وجود ندارد.",
        diff: "0",
        balance: actualBalance.toString(),
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      if (diff < 0n) {
        // Shortage (کسری کارت / هزینه ثبت‌نشده)
        const shortage = -diff;

        // Find or fallback to system category
        let defaultCategory = await tx.category.findFirst({
          where: {
            OR: [
              { name: "سایر هزینه‌ها", isSystem: true },
              { isSystem: true },
            ],
          },
        });

        if (!defaultCategory) {
          defaultCategory = await tx.category.create({
            data: {
              name: "سایر هزینه‌ها",
              icon: "MoreHorizontal",
              color: "#64748B",
              isSystem: true,
            },
          });
        }

        // Fetch all group members
        const members = await tx.groupMember.findMany({
          where: { groupId },
          select: { userId: true },
          orderBy: { joinedAt: "asc" },
        });

        const memberIds = members.map((m) => m.userId);
        const splits = calculateEqualSplit(shortage, memberIds);

        // Create automatic reconciliation expense
        const expense = await tx.expense.create({
          data: {
            groupId,
            categoryId: defaultCategory.id,
            title: "مغایرت و هزینه ثبت‌نشده کارت",
            totalAmount: shortage,
            paymentSource: PaymentSource.FUND,
            fundId,
            expenseDate: new Date(),
            splits: {
              create: splits.map((s) => ({
                userId: s.userId,
                owedAmount: s.owedAmount,
                splitType: SplitType.EQUAL,
              })),
            },
          },
        });

        // Set fund balance to actualBalance
        const updatedFund = await tx.fund.update({
          where: { id: fundId },
          data: { currentBalance: actualBalance },
        });

        // Write AuditLog
        await tx.auditLog.create({
          data: {
            groupId,
            expenseId: expense.id,
            changedByUserId: session.userId,
            action: AuditAction.RECONCILE,
            oldData: {
              fundId,
              title: fund.title,
              balance: fund.currentBalance.toString(),
            },
            newData: {
              fundId,
              actualBalance: actualBalance.toString(),
              diff: diff.toString(),
              shortage: shortage.toString(),
              type: "SHORTAGE",
              note,
            },
          },
        });

        return {
          type: "SHORTAGE",
          diff: diff.toString(),
          fund: updatedFund,
          expense,
        };
      } else {
        // Surplus (مازاد کارت)
        const surplus = diff;

        const adjustmentTx = await tx.fundTransaction.create({
          data: {
            fundId,
            groupId,
            userId: session.userId,
            amount: surplus,
            type: FundTxType.ADJUSTMENT,
            note: note || "تطبیق مازاد موجودی کارت",
          },
        });

        const updatedFund = await tx.fund.update({
          where: { id: fundId },
          data: { currentBalance: actualBalance },
        });

        await tx.auditLog.create({
          data: {
            groupId,
            changedByUserId: session.userId,
            action: AuditAction.RECONCILE,
            oldData: {
              fundId,
              title: fund.title,
              balance: fund.currentBalance.toString(),
            },
            newData: {
              fundId,
              actualBalance: actualBalance.toString(),
              diff: diff.toString(),
              surplus: surplus.toString(),
              type: "SURPLUS",
              note,
            },
          },
        });

        return {
          type: "SURPLUS",
          diff: diff.toString(),
          fund: updatedFund,
          transaction: adjustmentTx,
        };
      }
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message:
          diff < 0n
            ? "کسری کارت به صورت خودکار به عنوان هزینه ثبت‌نشده بین اعضا تقسیم و تراز شد."
            : "مازاد کارت به عنوان تعدیل در سیستم ثبت و موجودی صندوق تراز شد.",
        ...result,
      })
    );
  } catch (error) {
    console.error("POST /api/groups/[groupId]/funds/[fundId]/reconcile error:", error);
    return NextResponse.json(
      { error: "خطا در تطبیق موجودی کارت." },
      { status: 500 }
    );
  }
}
