import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { generateInviteCode, serializeBigInt } from "@/lib/serialize";
import { calculateGroupBalances } from "@/lib/accounting/balance-engine";
import { canAccessFeature } from "@/lib/subscription/feature-guard";
import { GroupRole, AuditAction } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, phone: true },
                },
              },
            },
            funds: true,
            expenses: {
              include: { splits: true },
            },
            settlements: true,
            fundTransactions: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const groupsData = memberships.map((m) => {
      const g = m.group;
      const memberIds = g.members.map((mem) => mem.userId);

      const balanceData = calculateGroupBalances({
        memberIds,
        expenses: g.expenses.map((e) => ({
          totalAmount: e.totalAmount,
          paymentSource: e.paymentSource,
          paidByUserId: e.paidByUserId,
          splits: e.splits.map((s) => ({
            userId: s.userId,
            owedAmount: s.owedAmount,
          })),
        })),
        settlements: g.settlements.map((s) => ({
          fromUserId: s.fromUserId,
          toUserId: s.toUserId,
          amount: s.amount,
        })),
        fundTransactions: g.fundTransactions.map((ft) => ({
          userId: ft.userId,
          amount: ft.amount,
          type: ft.type,
        })),
        funds: g.funds.map((f) => ({
          id: f.id,
          currentBalance: f.currentBalance,
        })),
      });

      const userBalance =
        balanceData.memberBalances.find((mb) => mb.userId === session.userId)
          ?.netBalance ?? 0n;

      const totalFundBalance = g.funds.reduce(
        (sum, f) => sum + f.currentBalance,
        0n
      );

      return {
        id: g.id,
        title: g.title,
        currency: g.currency,
        inviteCode: g.inviteCode,
        createdAt: g.createdAt,
        myRole: m.role,
        memberCount: g.members.length,
        totalFundBalance,
        myNetBalance: userBalance,
      };
    });

    return NextResponse.json(serializeBigInt({ groups: groupsData }));
  } catch (error) {
    console.error("GET /api/groups error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست گروه‌ها." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    // Entitlement Check: UNLIMITED_GROUPS
    const access = await canAccessFeature({
      userId: session.userId,
      feature: "UNLIMITED_GROUPS",
    });
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.reason,
          code: "PRO_REQUIRED",
          feature: "UNLIMITED_GROUPS",
        },
        { status: 402 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.title || typeof body.title !== "string") {
      return NextResponse.json(
        { error: "نام گروه الزامی است." },
        { status: 400 }
      );
    }

    const title = body.title.trim();
    if (title.length < 2) {
      return NextResponse.json(
        { error: "نام گروه باید حداقل ۲ حرف باشد." },
        { status: 400 }
      );
    }

    const initialFundTitle = body.initialFundTitle
      ? String(body.initialFundTitle).trim()
      : null;
    const currency = body.currency ? String(body.currency).trim() : "تومان";

    // Generate unique 8-character invite code
    let inviteCode = generateInviteCode();
    while (await prisma.group.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
    }

    // Execute atomic creation in transaction
    const newGroup = await prisma.$transaction(async (tx) => {
      const created = await tx.group.create({
        data: {
          title,
          currency,
          inviteCode,
          createdById: session.userId,
          members: {
            create: {
              userId: session.userId,
              role: GroupRole.OWNER,
            },
          },
        },
        include: {
          members: true,
          funds: true,
        },
      });

      if (initialFundTitle) {
        await tx.fund.create({
          data: {
            groupId: created.id,
            title: initialFundTitle,
            currentBalance: 0n,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          groupId: created.id,
          changedByUserId: session.userId,
          action: AuditAction.CREATE,
          newData: {
            title,
            inviteCode,
            initialFund: initialFundTitle,
          },
        },
      });

      return created;
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: "گروه با موفقیت ایجاد شد.",
        group: newGroup,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/groups error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد گروه جدید." },
      { status: 500 }
    );
  }
}
