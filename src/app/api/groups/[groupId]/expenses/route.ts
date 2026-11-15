import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { serializeBigInt } from "@/lib/serialize";
import { parseToman } from "@/lib/money";
import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentSplit,
  calculateSharesSplit,
  SplitResult,
} from "@/lib/accounting/split-calculator";
import { PaymentSource, SplitType, AuditAction } from "@prisma/client";

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

    // Verify group membership
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

    const title = body.title ? String(body.title).trim() : "";
    if (title.length < 2) {
      return NextResponse.json(
        { error: "عنوان هزینه باید حداقل ۲ حرف باشد." },
        { status: 400 }
      );
    }

    const totalAmount = parseToman(String(body.totalAmount ?? ""));
    if (totalAmount <= 0n) {
      return NextResponse.json(
        { error: "مبلغ کل هزینه باید بزرگتر از صفر باشد." },
        { status: 400 }
      );
    }

    const categoryId = body.categoryId ? String(body.categoryId).trim() : "";
    if (!categoryId) {
      return NextResponse.json(
        { error: "انتخاب دسته‌بندی هزینه الزامی است." },
        { status: 400 }
      );
    }

    // Verify category exists and belongs to system or group
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ isSystem: true }, { groupId }],
      },
    });
    if (!category) {
      return NextResponse.json(
        { error: "دسته‌بندی انتخاب‌شده نامعتبر است." },
        { status: 400 }
      );
    }

    const paymentSource: PaymentSource =
      body.paymentSource === "FUND" ? PaymentSource.FUND : PaymentSource.PERSONAL;

    let paidByUserId: string | null = null;
    let fundId: string | null = null;

    if (paymentSource === PaymentSource.PERSONAL) {
      paidByUserId = body.paidByUserId ? String(body.paidByUserId).trim() : session.userId;
      // Verify payer is member of group
      const payerMember = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: paidByUserId,
          },
        },
      });
      if (!payerMember) {
        return NextResponse.json(
          { error: "پرداخت‌کننده انتخاب‌شده عضو این گروه نیست." },
          { status: 400 }
        );
      }
    } else {
      fundId = body.fundId ? String(body.fundId).trim() : null;
      if (!fundId) {
        return NextResponse.json(
          { error: "انتخاب صندوق مشترک خانه الزامی است." },
          { status: 400 }
        );
      }
      const fund = await prisma.fund.findFirst({
        where: { id: fundId, groupId },
      });
      if (!fund) {
        return NextResponse.json(
          { error: "صندوق مشترک انتخاب‌شده در این گروه یافت نشد." },
          { status: 400 }
        );
      }
    }

    // Check billing cycle closed status if cycleId provided, or auto-attach active cycle
    let cycleId = body.cycleId ? String(body.cycleId).trim() : null;
    if (cycleId) {
      const cycle = await prisma.billingCycle.findFirst({
        where: { id: cycleId, groupId },
      });
      if (cycle?.isClosed) {
        return NextResponse.json(
          { error: "این دوره مالی بسته شده است و امکان تغییر اسناد آن وجود ندارد." },
          { status: 403 }
        );
      }
    } else {
      // Auto-assign to current open cycle if available
      const activeCycle = await prisma.billingCycle.findFirst({
        where: { groupId, isClosed: false },
        orderBy: { startDate: "desc" },
      });
      if (activeCycle) {
        cycleId = activeCycle.id;
      }
    }

    const splitType: SplitType = (["EQUAL", "EXACT", "PERCENT", "SHARES"].includes(
      body.splitType
    )
      ? body.splitType
      : "EQUAL") as SplitType;

    const participants = Array.isArray(body.participants) ? body.participants : [];
    if (participants.length === 0) {
      return NextResponse.json(
        { error: "حداقل یک عضو برای تقسیم هزینه الزامی است." },
        { status: 400 }
      );
    }

    // Verify all participants are members of the group
    const participantUserIds: string[] = participants.map((p: any) =>
      typeof p === "string" ? p : p.userId
    );

    const groupMembers = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { in: participantUserIds },
      },
      select: { userId: true },
    });

    const validMemberIdSet = new Set(groupMembers.map((m) => m.userId));
    for (const uid of participantUserIds) {
      if (!validMemberIdSet.has(uid)) {
        return NextResponse.json(
          { error: `کاربر با شناسه ${uid} عضو این گروه نیست.` },
          { status: 400 }
        );
      }
    }

    // Calculate splits using accounting engine
    let calculatedSplits: SplitResult[] = [];
    try {
      if (splitType === "EQUAL") {
        calculatedSplits = calculateEqualSplit(totalAmount, participantUserIds);
      } else if (splitType === "EXACT") {
        calculatedSplits = calculateExactSplit(
          totalAmount,
          participants.map((p: any) => ({
            userId: p.userId,
            amount: parseToman(String(p.amount ?? "0")),
          }))
        );
      } else if (splitType === "PERCENT") {
        calculatedSplits = calculatePercentSplit(
          totalAmount,
          participants.map((p: any) => ({
            userId: p.userId,
            percent: Number(p.percent ?? 0),
          }))
        );
      } else if (splitType === "SHARES") {
        calculatedSplits = calculateSharesSplit(
          totalAmount,
          participants.map((p: any) => ({
            userId: p.userId,
            shares: Number(p.shares ?? 1),
          }))
        );
      }
    } catch (calcError: any) {
      return NextResponse.json(
        { error: calcError.message || "خطا در محاسبه دنگ‌ها." },
        { status: 400 }
      );
    }

    const expenseDate = body.expenseDate ? new Date(body.expenseDate) : new Date();
    const receiptUrl = body.receiptUrl ? String(body.receiptUrl).trim() : null;

    // Atomic Execution in prisma.$transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Expense and Splits
      const newExpense = await tx.expense.create({
        data: {
          groupId,
          categoryId,
          cycleId,
          title,
          totalAmount,
          paymentSource,
          paidByUserId,
          fundId,
          receiptUrl,
          expenseDate,
          splits: {
            create: calculatedSplits.map((s, idx) => ({
              userId: s.userId,
              owedAmount: s.owedAmount,
              splitType,
              shareValue:
                splitType === "SHARES"
                  ? Number(participants[idx]?.shares ?? 1)
                  : splitType === "PERCENT"
                  ? Math.round(Number(participants[idx]?.percent ?? 0))
                  : null,
            })),
          },
        },
        include: {
          splits: {
            include: {
              user: { select: { id: true, name: true, phone: true } },
            },
          },
          category: true,
          paidByUser: { select: { id: true, name: true } },
          fund: true,
        },
      });

      // 2. If paid by FUND, atomically decrement fund balance
      if (paymentSource === PaymentSource.FUND && fundId) {
        await tx.fund.update({
          where: { id: fundId },
          data: {
            currentBalance: {
              decrement: totalAmount,
            },
          },
        });
      }

      // 3. Write Immutable AuditLog
      await tx.auditLog.create({
        data: {
          groupId,
          expenseId: newExpense.id,
          changedByUserId: session.userId,
          action: AuditAction.CREATE,
          newData: {
            title,
            totalAmount: totalAmount.toString(),
            paymentSource,
            paidByUserId,
            fundId,
            splitType,
            splits: calculatedSplits.map((s) => ({
              userId: s.userId,
              owedAmount: s.owedAmount.toString(),
            })),
          },
        },
      });

      return newExpense;
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: "هزینه جدید با موفقیت ثبت شد.",
        expense: result,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/groups/[groupId]/expenses error:", error);
    return NextResponse.json(
      { error: "خطا در ثبت هزینه جدید." },
      { status: 500 }
    );
  }
}
