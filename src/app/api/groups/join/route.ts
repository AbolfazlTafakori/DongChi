import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { isValidInviteCode } from "@/lib/serialize";
import { GroupRole, AuditAction } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.inviteCode || typeof body.inviteCode !== "string") {
      return NextResponse.json(
        { error: "کد دعوت الزامی است." },
        { status: 400 }
      );
    }

    const code = body.inviteCode.trim().toUpperCase();
    if (!isValidInviteCode(code)) {
      return NextResponse.json(
        { error: "کد دعوت نامعتبر است (کد باید ۸ کاراکتر باشد)." },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { inviteCode: code },
    });

    if (!group) {
      return NextResponse.json(
        { error: "گروهی با این کد دعوت یافت نشد." },
        { status: 404 }
      );
    }

    // Check if already member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({
        success: true,
        message: "شما در حال حاضر عضو این گروه هستید.",
        groupId: group.id,
      });
    }

    // Join group
    await prisma.$transaction(async (tx) => {
      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: session.userId,
          role: GroupRole.MEMBER,
        },
      });

      await tx.auditLog.create({
        data: {
          groupId: group.id,
          changedByUserId: session.userId,
          action: AuditAction.CREATE,
          newData: {
            action: "JOINED_VIA_INVITE",
            userId: session.userId,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "با موفقیت به گروه پیوستید.",
      groupId: group.id,
    });
  } catch (error) {
    console.error("POST /api/groups/join error:", error);
    return NextResponse.json(
      { error: "خطا در پیوستن به گروه." },
      { status: 500 }
    );
  }
}
