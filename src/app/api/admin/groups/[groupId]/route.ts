import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { groupId } = params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { error: "گروه مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    await prisma.group.delete({
      where: { id: groupId },
    });

    return NextResponse.json({
      success: true,
      message: "گروه مورد نظر با موفقیت حذف گردید.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/groups/[groupId] error:", error);
    return NextResponse.json(
      { error: "خطا در حذف گروه." },
      { status: 500 }
    );
  }
}
