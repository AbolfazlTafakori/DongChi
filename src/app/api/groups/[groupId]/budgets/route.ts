import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { serializeBigInt } from "@/lib/serialize";
import { parseToman } from "@/lib/money";
import { AuditAction } from "@prisma/client";

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

    const budgets = await prisma.budget.findMany({
      where: { groupId },
      include: {
        category: true,
      },
      orderBy: { monthlyLimit: "desc" },
    });

    return NextResponse.json(serializeBigInt({ budgets }));
  } catch (error) {
    console.error("GET /api/groups/[groupId]/budgets error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت بودجه‌های گروه." },
      { status: 500 }
    );
  }
}

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
    if (!body || !body.categoryId) {
      return NextResponse.json(
        { error: "انتخاب دسته‌بندی برای بودجه الزامی است." },
        { status: 400 }
      );
    }

    const categoryId = String(body.categoryId).trim();

    // Verify category exists
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ isSystem: true }, { groupId }],
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "دسته‌بندی مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    const monthlyLimit = parseToman(String(body.monthlyLimit ?? ""));
    if (monthlyLimit <= 0n) {
      return NextResponse.json(
        { error: "سقف بودجه ماهانه باید بزرگتر از صفر باشد." },
        { status: 400 }
      );
    }

    let alertThreshold = Number(body.alertThreshold ?? 80);
    if (isNaN(alertThreshold) || alertThreshold < 1 || alertThreshold > 100) {
      alertThreshold = 80;
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.budget.findUnique({
        where: {
          groupId_categoryId: {
            groupId,
            categoryId,
          },
        },
      });

      const budget = await tx.budget.upsert({
        where: {
          groupId_categoryId: {
            groupId,
            categoryId,
          },
        },
        update: {
          monthlyLimit,
          alertThreshold,
        },
        create: {
          groupId,
          categoryId,
          monthlyLimit,
          alertThreshold,
        },
        include: {
          category: true,
        },
      });

      await tx.auditLog.create({
        data: {
          groupId,
          changedByUserId: session.userId,
          action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
          oldData: existing
            ? {
                monthlyLimit: existing.monthlyLimit.toString(),
                alertThreshold: existing.alertThreshold,
              }
            : undefined,
          newData: {
            action: "SET_BUDGET",
            categoryName: category.name,
            monthlyLimit: monthlyLimit.toString(),
            alertThreshold,
          },
        },
      });

      return budget;
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: "بودجه دسته‌بندی با موفقیت تنظیم شد.",
        budget: result,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/groups/[groupId]/budgets error:", error);
    return NextResponse.json(
      { error: "خطا در تنظیم بودجه." },
      { status: 500 }
    );
  }
}
