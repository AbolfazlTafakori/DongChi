import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, validateAdminUserMutation } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.admin) {
      return NextResponse.json(
        { error: auth.error || "دسترسی غیرمجاز." },
        { status: auth.status || 403 }
      );
    }

    const { userId } = params;
    const body = await request.json().catch(() => ({}));

    const nextRole =
      body.role === "ADMIN" || body.role === "USER"
        ? (body.role as Role)
        : undefined;
    const nextIsBanned =
      typeof body.isBanned === "boolean" ? body.isBanned : undefined;

    const validation = validateAdminUserMutation({
      actorId: auth.admin.id,
      targetUserId: userId,
      nextRole,
      nextIsBanned,
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "کاربر مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    const dataToUpdate: any = {};
    if (nextRole !== undefined) dataToUpdate.role = nextRole;
    if (nextIsBanned !== undefined) dataToUpdate.isBanned = nextIsBanned;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: "مشخصات و دسترسی کاربر با موفقیت تغییر یافت.",
        user: {
          id: updated.id,
          name: updated.name,
          phone: updated.phone,
          role: updated.role,
          isBanned: updated.isBanned,
        },
      })
    );
  } catch (error) {
    console.error("PATCH /api/admin/users/[userId] error:", error);
    return NextResponse.json(
      { error: "خطا در ویرایش مشخصات کاربر." },
      { status: 500 }
    );
  }
}
