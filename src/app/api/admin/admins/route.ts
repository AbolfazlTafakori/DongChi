import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import {
  getAdminAccounts,
  createAdminAccount,
  sanitizeAdmin,
  AdminRole,
} from "@/lib/admin-db";
import { syncAdminShadowUser } from "@/lib/auth-bridge";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const accounts = await getAdminAccounts();

    const counts = {
      total: accounts.length,
      superAdmin: accounts.filter((a) => a.role === "SUPER_ADMIN").length,
      financeAdmin: accounts.filter((a) => a.role === "FINANCE_ADMIN").length,
      supportAdmin: accounts.filter((a) => a.role === "SUPPORT_ADMIN").length,
      active: accounts.filter((a) => a.isActive).length,
      inactive: accounts.filter((a) => !a.isActive).length,
    };

    return NextResponse.json({
      admins: accounts.map(sanitizeAdmin),
      counts,
    });
  } catch (error) {
    console.error("GET /api/admin/admins error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست مدیران سامانه." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "اطلاعات ارسالی نامعتبر است." }, { status: 400 });
    }

    const { username, password, fullName, phone, role } = body;

    if (!username || !password || !fullName || !phone) {
      return NextResponse.json(
        { error: "نام کاربری، رمز عبور، نام و شماره موبایل برای ایجاد مدیر الزامی هستند." },
        { status: 400 }
      );
    }

    const validRoles: AdminRole[] = ["SUPER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN"];
    const targetRole: AdminRole = validRoles.includes(role) ? role : "SUPPORT_ADMIN";

    const newAdmin = await createAdminAccount({
      username: String(username).trim(),
      password: String(password).trim(),
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      role: targetRole,
    });

    // Synchronize shadow user in PostgreSQL
    await syncAdminShadowUser(newAdmin.id);

    return NextResponse.json({
      success: true,
      message: "حساب کاربری مدیر با موفقیت ایجاد گردید.",
      admin: sanitizeAdmin(newAdmin),
    });
  } catch (error: any) {
    console.error("POST /api/admin/admins error:", error);
    return NextResponse.json(
      { error: error?.message || "خطا در ایجاد مدیر جدید." },
      { status: 400 }
    );
  }
}
