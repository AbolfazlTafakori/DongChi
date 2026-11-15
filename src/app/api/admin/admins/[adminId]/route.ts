import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import {
  updateAdminAccount,
  deleteAdminAccount,
  findAdminById,
  findAdminByPhone,
  sanitizeAdmin,
  AdminRole,
} from "@/lib/admin-db";
import { syncAdminShadowUser } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { adminId: string } }
) {
  try {
    const authResult = await requireAdmin();
    if (authResult.error || !authResult.admin) {
      return NextResponse.json(
        { error: authResult.error || "دسترسی غیرمجاز" },
        { status: authResult.status || 403 }
      );
    }

    const { adminId } = params;
    const existing = await findAdminById(adminId);
    if (!existing) {
      return NextResponse.json({ error: "حساب کاربری مدیر یافت نشد." }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "اطلاعات ارسالی نامعتبر است." }, { status: 400 });
    }

    // Safety checks if actor is modifying their own account
    const actorAdmin = await findAdminByPhone(authResult.admin.phone);
    if (actorAdmin && actorAdmin.id === adminId) {
      if (body.isActive === false) {
        return NextResponse.json(
          { error: "امکان غیرفعال‌سازی حساب کاربری خودتان وجود ندارد." },
          { status: 400 }
        );
      }
      if (body.role && body.role !== "SUPER_ADMIN" && actorAdmin.role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "امکان تنزل رتبه سطح دسترسی حساب مدیریت خود وجود ندارد." },
          { status: 400 }
        );
      }
    }

    const updates: {
      fullName?: string;
      phone?: string;
      role?: AdminRole;
      isActive?: boolean;
      password?: string;
    } = {};

    if (body.fullName !== undefined) updates.fullName = String(body.fullName).trim();
    if (body.phone !== undefined) updates.phone = String(body.phone).trim();
    if (body.role !== undefined) updates.role = body.role;
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.password !== undefined && String(body.password).trim().length > 0) {
      updates.password = String(body.password).trim();
    }

    const updated = await updateAdminAccount(adminId, updates);
    await syncAdminShadowUser(adminId);

    return NextResponse.json({
      success: true,
      message: "مشخصات مدیر با موفقیت به‌روزرسانی شد.",
      admin: sanitizeAdmin(updated),
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/admins/[adminId] error:", error);
    return NextResponse.json(
      { error: error?.message || "خطا در ویرایش اطلاعات مدیر." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { adminId: string } }
) {
  try {
    const authResult = await requireAdmin();
    if (authResult.error || !authResult.admin) {
      return NextResponse.json(
        { error: authResult.error || "دسترسی غیرمجاز" },
        { status: authResult.status || 403 }
      );
    }

    const { adminId } = params;
    const existing = await findAdminById(adminId);
    if (!existing) {
      return NextResponse.json({ error: "حساب کاربری مدیر یافت نشد." }, { status: 404 });
    }

    const actorAdmin = await findAdminByPhone(authResult.admin.phone);
    const deleteResult = await deleteAdminAccount(adminId, actorAdmin?.id);

    if (!deleteResult.success) {
      return NextResponse.json({ error: deleteResult.error }, { status: 400 });
    }

    // Demote shadow user in Prisma if no other admin has this phone
    const otherAdminWithPhone = await findAdminByPhone(existing.phone);
    if (!otherAdminWithPhone) {
      await prisma.user.updateMany({
        where: { phone: existing.phone },
        data: { role: Role.USER },
      });
    }

    return NextResponse.json({
      success: true,
      message: "حساب کاربری مدیر با موفقیت حذف گردید.",
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/admins/[adminId] error:", error);
    return NextResponse.json(
      { error: error?.message || "خطا در حذف حساب مدیر." },
      { status: 500 }
    );
  }
}
