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

export async function GET(
  _request: NextRequest,
  { params }: { params: { groupId: string; expenseId: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const { groupId, expenseId } = params;

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

    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, groupId },
      include: {
        category: true,
        paidByUser: { select: { id: true, name: true, phone: true } },
        fund: true,
        splits: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        auditLogs: {
          include: {
            changedByUser: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "هزینه مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeBigInt({ expense }));
  } catch (error) {
    console.error("GET /api/groups/[groupId]/expenses/[expenseId] error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت مشخصات هزینه." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { groupId: string; expenseId: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const { groupId, expenseId } = params;

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
    const paymentSource: PaymentSource =
      body.paymentSource === "FUND" ? PaymentSource.FUND : PaymentSource.PERSONAL;

    let paidByUserId: string | null = null;
    let fundId: string | null = null;

    if (paymentSource === PaymentSource.PERSONAL) {
      paidByUserId = body.paidByUserId ? String(body.paidByUserId).trim() : session.userId;
    } else {
      fundId = body.fundId ? String(body.fundId).trim() : null;
      if (!fundId) {
        return NextResponse.json(
          { error: "انتخاب صندوق مشترک الزامی است." },
          { status: 400 }
        );
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

    const participantUserIds: string[] = participants.map((p: any) =>
      typeof p === "string" ? p : p.userId
    );

    // Calculate updated splits
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

    // Atomic execution with financial reversal and re-application
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.expense.findFirst({
        where: { id: expenseId, groupId },
        include: {
          splits: true,
          cycle: true,
        },
      });

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      if (existing.cycle?.isClosed) {
        throw new Error("CYCLE_CLOSED");
      }

      // 1. Reverse old financial impact on shared fund
      if (existing.paymentSource === PaymentSource.FUND && existing.fundId) {
        await tx.fund.update({
          where: { id: existing.fundId },
          data: {
            currentBalance: {
              increment: existing.totalAmount,
            },
          },
        });
      }

      // 2. Delete old splits
      await tx.expenseSplit.deleteMany({
        where: { expenseId },
      });

      // 3. Update expense and create new splits
      const exp = await tx.expense.update({
        where: { id: expenseId },
        data: {
          title,
          totalAmount,
          categoryId,
          paymentSource,
          paidByUserId,
          fundId,
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
              user: { select: { id: true, name: true } },
            },
          },
          category: true,
          fund: true,
        },
      });

      // 4. Apply new financial impact on shared fund
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

      // 5. Write AuditLog snapshot
      await tx.auditLog.create({
        data: {
          groupId,
          expenseId,
          changedByUserId: session.userId,
          action: AuditAction.UPDATE,
          oldData: {
            title: existing.title,
            totalAmount: existing.totalAmount.toString(),
            paymentSource: existing.paymentSource,
            paidByUserId: existing.paidByUserId,
            fundId: existing.fundId,
            splits: existing.splits.map((s) => ({
              userId: s.userId,
              owedAmount: s.owedAmount.toString(),
            })),
          },
          newData: {
            title,
            totalAmount: totalAmount.toString(),
            paymentSource,
            paidByUserId,
            fundId,
            splits: calculatedSplits.map((s) => ({
              userId: s.userId,
              owedAmount: s.owedAmount.toString(),
            })),
          },
        },
      });

      return exp;
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: "هزینه با موفقیت به‌روزرسانی شد.",
        expense: updated,
      })
    );
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "هزینه مورد نظر یافت نشد." },
        { status: 404 }
      );
    }
    if (error.message === "CYCLE_CLOSED") {
      return NextResponse.json(
        { error: "این دوره مالی بسته شده است و امکان تغییر اسناد آن وجود ندارد." },
        { status: 403 }
      );
    }
    console.error("PATCH /api/groups/[groupId]/expenses/[expenseId] error:", error);
    return NextResponse.json(
      { error: "خطا در ویرایش هزینه." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { groupId: string; expenseId: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const { groupId, expenseId } = params;

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

    await prisma.$transaction(async (tx) => {
      const existing = await tx.expense.findFirst({
        where: { id: expenseId, groupId },
        include: {
          splits: true,
          cycle: true,
        },
      });

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      if (existing.cycle?.isClosed) {
        throw new Error("CYCLE_CLOSED");
      }

      // 1. If paid by FUND, restore balance to the fund
      if (existing.paymentSource === PaymentSource.FUND && existing.fundId) {
        await tx.fund.update({
          where: { id: existing.fundId },
          data: {
            currentBalance: {
              increment: existing.totalAmount,
            },
          },
        });
      }

      // 2. Write AuditLog with expenseId: null so log persists after deletion
      await tx.auditLog.create({
        data: {
          groupId,
          expenseId: null,
          changedByUserId: session.userId,
          action: AuditAction.DELETE,
          oldData: {
            deletedExpenseId: existing.id,
            title: existing.title,
            totalAmount: existing.totalAmount.toString(),
            paymentSource: existing.paymentSource,
            paidByUserId: existing.paidByUserId,
            fundId: existing.fundId,
            splits: existing.splits.map((s) => ({
              userId: s.userId,
              owedAmount: s.owedAmount.toString(),
            })),
          },
        },
      });

      // 3. Delete splits and expense
      await tx.expenseSplit.deleteMany({
        where: { expenseId },
      });

      await tx.expense.delete({
        where: { id: expenseId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "هزینه با موفقیت حذف شد و حساب‌ها به‌روزرسانی شدند.",
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "هزینه مورد نظر یافت نشد." },
        { status: 404 }
      );
    }
    if (error.message === "CYCLE_CLOSED") {
      return NextResponse.json(
        { error: "این دوره مالی بسته شده است و امکان تغییر اسناد آن وجود ندارد." },
        { status: 403 }
      );
    }
    console.error("DELETE /api/groups/[groupId]/expenses/[expenseId] error:", error);
    return NextResponse.json(
      { error: "خطا در حذف هزینه." },
      { status: 500 }
    );
  }
}
