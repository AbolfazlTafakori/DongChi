import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidInviteCode } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { inviteCode: string } }
) {
  try {
    const { inviteCode } = params;

    if (!isValidInviteCode(inviteCode)) {
      return NextResponse.json(
        { error: "فرمت کد دعوت نامعتبر است." },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() },
      select: {
        id: true,
        title: true,
        currency: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "گروهی با این کد دعوت یافت نشد." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      group: {
        id: group.id,
        title: group.title,
        currency: group.currency,
        memberCount: group._count.members,
        createdAt: group.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/groups/invite/[inviteCode] error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات دعوتنامه." },
      { status: 500 }
    );
  }
}
