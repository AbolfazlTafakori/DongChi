import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { serializeBigInt } from "@/lib/serialize";
import { canAccessFeature } from "@/lib/subscription/feature-guard";
import { AuditAction } from "@prisma/client";

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

    // Entitlement Check: MULTIPLE_FUNDS
    const access = await canAccessFeature({
      userId: session.userId,
      groupId,
      feature: "MULTIPLE_FUNDS",
    });
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.reason,
          code: "PRO_REQUIRED",
          feature: "MULTIPLE_FUNDS",
        },
        { status: 402 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.title || typeof body.title !== "string") {
      return NextResponse.json(
        { error: "عنوان صندوق الزامی است." },
        { status: 400 }
      );
    }

    const title = body.title.trim();
    if (title.length < 2) {
      return NextResponse.json(
        { error: "عنوان صندوق باید حداقل ۲ حرف باشد." },
        { status: 400 }
      );
    }

    const cardNumber = body.cardNumber
      ? String(body.cardNumber).trim()
      : null;

    const newFund = await prisma.$transaction(async (tx) => {
      const fund = await tx.fund.create({
        data: {
          groupId,
          title,
          cardNumber,
          currentBalance: 0n,
        },
      });

      await tx.auditLog.create({
        data: {
          groupId,
          changedByUserId: session.userId,
          action: AuditAction.CREATE,
          newData: {
            fundTitle: title,
            cardNumber,
          },
        },
      });

      return fund;
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: "صندوق جدید با موفقیت ایجاد شد.",
        fund: newFund,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/groups/[groupId]/funds error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد صندوق مشترک." },
      { status: 500 }
    );
  }
}
