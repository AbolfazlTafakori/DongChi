import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { generateInviteCode, serializeBigInt } from "@/lib/serialize";
import {
  calculateGroupBalances,
  simplifyDebts,
} from "@/lib/accounting/balance-engine";
import { GroupRole, AuditAction } from "@prisma/client";

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
        { error: "شما عضو این گروه نیستید یا گروه یافت نشد." },
        { status: 403 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                cardNumber: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        funds: {
          include: {
            transactions: {
              include: {
                user: { select: { id: true, name: true } },
              },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        },
        expenses: {
          include: {
            splits: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
            category: true,
            paidByUser: { select: { id: true, name: true } },
            fund: true,
          },
          orderBy: { expenseDate: "desc" },
          take: 50,
        },
        settlements: {
          include: {
            fromUser: { select: { id: true, name: true } },
            toUser: { select: { id: true, name: true } },
          },
          orderBy: { settledAt: "desc" },
          take: 20,
        },
        fundTransactions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        auditLogs: {
          include: {
            changedByUser: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 15,
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "گروه مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    const memberIds = group.members.map((m) => m.userId);

    // Calculate exact double-entry balances
    const balanceResult = calculateGroupBalances({
      memberIds,
      expenses: group.expenses.map((e) => ({
        totalAmount: e.totalAmount,
        paymentSource: e.paymentSource,
        paidByUserId: e.paidByUserId,
        splits: e.splits.map((s) => ({
          userId: s.userId,
          owedAmount: s.owedAmount,
        })),
      })),
      settlements: group.settlements.map((s) => ({
        fromUserId: s.fromUserId,
        toUserId: s.toUserId,
        amount: s.amount,
      })),
      fundTransactions: group.fundTransactions.map((ft) => ({
        userId: ft.userId,
        amount: ft.amount,
        type: ft.type,
      })),
      funds: group.funds.map((f) => ({
        id: f.id,
        title: f.title,
        currentBalance: f.currentBalance,
      })),
    });

    // Simplify debts between members & funds
    const debts = simplifyDebts({
      memberBalances: balanceResult.memberBalances,
      funds: group.funds.map((f) => ({
        id: f.id,
        title: f.title,
        currentBalance: f.currentBalance,
      })),
    });

    // Build member balance map with user profile
    const memberBalancesWithDetails = group.members.map((m) => {
      const net =
        balanceResult.memberBalances.find((mb) => mb.userId === m.userId)
          ?.netBalance ?? 0n;

      return {
        memberId: m.id,
        userId: m.userId,
        name: m.user.name,
        phone: m.user.phone,
        cardNumber: m.user.cardNumber,
        role: m.role,
        joinedAt: m.joinedAt,
        netBalance: net,
      };
    });

    const totalFundBalance = group.funds.reduce(
      (acc, f) => acc + f.currentBalance,
      0n
    );

    return NextResponse.json(
      serializeBigInt({
        group: {
          id: group.id,
          title: group.title,
          currency: group.currency,
          inviteCode: group.inviteCode,
          createdAt: group.createdAt,
          myRole: membership.role,
          totalFundBalance,
          funds: group.funds,
          members: memberBalancesWithDetails,
          simplifiedDebts: debts,
          recentExpenses: group.expenses,
          recentSettlements: group.settlements,
          auditLogs: group.auditLogs,
          isBalanced: balanceResult.isBalanced,
        },
      })
    );
  } catch (error) {
    console.error("GET /api/groups/[groupId] error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات گروه." },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Verify OWNER role
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.userId,
        },
      },
    });

    if (!membership || membership.role !== GroupRole.OWNER) {
      return NextResponse.json(
        { error: "تنها مدیر گروه مجاز به اعمال تغییرات است." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "داده‌های ارسالی نامعتبر است." },
        { status: 400 }
      );
    }

    const updateData: { title?: string; inviteCode?: string } = {};

    if (body.title && typeof body.title === "string") {
      const trimmed = body.title.trim();
      if (trimmed.length < 2) {
        return NextResponse.json(
          { error: "نام گروه باید حداقل ۲ حرف باشد." },
          { status: 400 }
        );
      }
      updateData.title = trimmed;
    }

    if (body.regenerateInviteCode === true) {
      let newCode = generateInviteCode();
      while (await prisma.group.findUnique({ where: { inviteCode: newCode } })) {
        newCode = generateInviteCode();
      }
      updateData.inviteCode = newCode;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "هیچ فیلدی برای تغییر ارسال نشده است." },
        { status: 400 }
      );
    }

    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId },
    });

    const updated = await prisma.$transaction(async (tx) => {
      const g = await tx.group.update({
        where: { id: groupId },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          groupId,
          changedByUserId: session.userId,
          action: AuditAction.UPDATE,
          oldData: {
            title: existingGroup?.title,
            inviteCode: existingGroup?.inviteCode,
          },
          newData: updateData,
        },
      });

      return g;
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: "اطلاعات گروه با موفقیت به‌روزرسانی شد.",
        group: updated,
      })
    );
  } catch (error) {
    console.error("PATCH /api/groups/[groupId] error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی گروه." },
      { status: 500 }
    );
  }
}
