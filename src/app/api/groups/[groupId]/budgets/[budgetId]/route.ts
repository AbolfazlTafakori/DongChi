import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { AuditAction } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { groupId: string; budgetId: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const { groupId, budgetId } = params;

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

    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        groupId,
      },
      include: {
        category: true,
      },
    });

    if (!budget) {
      return NextResponse.json(
        { error: "بودجه مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          groupId,
          changedByUserId: session.userId,
          action: AuditAction.DELETE,
          oldData: {
            action: "DELETE_BUDGET",
            budgetId: budget.id,
            categoryName: budget.category.name,
            monthlyLimit: budget.monthlyLimit.toString(),
          },
        },
      });

      await tx.budget.delete({
        where: { id: budgetId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "سقف بودجه با موفقیت حذف شد.",
    });
  } catch (error) {
    console.error("DELETE /api/groups/[groupId]/budgets/[budgetId] error:", error);
    return NextResponse.json(
      { error: "خطا در حذف بودجه." },
      { status: 500 }
    );
  }
}
