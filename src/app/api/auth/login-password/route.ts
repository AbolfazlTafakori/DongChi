import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidIranianPhone, normalizePhone } from "@/lib/validation";
import {
  signSession,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import {
  findAdminByUsername,
  findAdminByPhone,
  updateAdminAccount,
} from "@/lib/admin-db";
import {
  getUserCredential,
  setUserPassword,
} from "@/lib/user-credentials";
import { bridgeAdminToMainSiteUser } from "@/lib/auth-bridge";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "اطلاعات ارسالی نامعتبر است." },
        { status: 400 }
      );
    }

    const mode = body.mode === "REGISTER" ? "REGISTER" : "LOGIN";
    const password = String(body.password || "").trim();

    if (!password) {
      return NextResponse.json(
        { error: "وارد کردن رمز عبور الزامی است." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "رمز عبور باید حداقل ۶ نویسه باشد." },
        { status: 400 }
      );
    }

    // ==========================================
    // 1. REGISTER MODE
    // ==========================================
    if (mode === "REGISTER") {
      const rawPhone = String(body.phone || body.identifier || "").trim();
      const phone = normalizePhone(rawPhone);

      if (!isValidIranianPhone(phone)) {
        return NextResponse.json(
          { error: "شماره موبایل وارد شده نامعتبر است (فرمت صحیح: ۰۹۱۲۰۰۰۰۰۰۰)." },
          { status: 400 }
        );
      }

      // Check if phone belongs to an admin
      const adminExists = await findAdminByPhone(phone);
      if (adminExists) {
        return NextResponse.json(
          { error: "این شماره موبایل متعلق به مدیر سیستم است. لطفاً از فرم ورود مدیران وارد شوید." },
          { status: 400 }
        );
      }

      const name = body.name ? String(body.name).trim() : "کاربر دنگ‌چی";

      // Look up or create user in PostgreSQL
      let user = await prisma.user.findUnique({
        where: { phone },
      });

      if (user) {
        if (user.isBanned) {
          return NextResponse.json(
            { error: "حساب کاربری شما مسدود شده است." },
            { status: 403 }
          );
        }
        if (name && (user.name === "کاربر دنگ‌چی" || !user.name)) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { name },
          });
        }
      } else {
        user = await prisma.user.create({
          data: {
            phone,
            name,
            role: Role.USER,
          },
        });
      }

      // Store user password hash
      await setUserPassword(user.id, phone, password);

      // Sign JWT session
      const token = await signSession({
        userId: user.id,
        phone: user.phone,
        role: user.role,
      });

      const response = NextResponse.json({
        success: true,
        message: "حساب کاربری با موفقیت ساخته شد و رمز عبور ثبت گردید.",
        redirectUrl: "/app",
        role: user.role,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        ...getSessionCookieOptions(),
      });

      return response;
    }

    // ==========================================
    // 2. LOGIN MODE
    // ==========================================
    const identifier = String(body.identifier || body.phone || "").trim();
    if (!identifier) {
      return NextResponse.json(
        { error: "لطفاً شماره موبایل یا نام کاربری را وارد کنید." },
        { status: 400 }
      );
    }

    // STEP A: First check Isolated Admin Database
    const adminByUsername = await findAdminByUsername(identifier);
    const adminByPhone = !adminByUsername ? await findAdminByPhone(identifier) : null;
    const adminAccount = adminByUsername || adminByPhone;

    if (adminAccount) {
      if (!adminAccount.isActive) {
        return NextResponse.json(
          { error: "حساب کاربری مدیریت غیرفعال شده است. لطفاً با مدیر ارشد تماس بگیرید." },
          { status: 403 }
        );
      }

      const isPasswordValid = verifyPassword(password, adminAccount.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "شناسه کاربری یا رمز عبور اشتباه است." },
          { status: 401 }
        );
      }

      // Admin authenticated! Bridge admin to main site user in PostgreSQL
      const { user: bridgedUser, token } = await bridgeAdminToMainSiteUser(adminAccount);

      // Update admin last login
      await updateAdminAccount(adminAccount.id, {
        lastLoginAt: new Date().toISOString(),
      });

      const response = NextResponse.json({
        success: true,
        message: `خوش آمدید ${adminAccount.fullName} (دسترسی مدیریت ${adminAccount.role})`,
        redirectUrl: "/admin",
        role: "ADMIN",
        adminRole: adminAccount.role,
        user: {
          id: bridgedUser.id,
          name: adminAccount.fullName,
          phone: adminAccount.phone,
          role: "ADMIN",
        },
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        ...getSessionCookieOptions(),
      });

      return response;
    }

    // STEP B: Regular User Authentication
    const cleanPhone = normalizePhone(identifier);
    if (!isValidIranianPhone(cleanPhone)) {
      return NextResponse.json(
        { error: "شناسه کاربری یا شماره موبایل وارد شده نامعتبر است." },
        { status: 400 }
      );
    }

    const credential = await getUserCredential(cleanPhone);
    if (!credential) {
      // Check if user exists in database without a password
      const userExistsInDb = await prisma.user.findUnique({
        where: { phone: cleanPhone },
      });

      if (userExistsInDb) {
        return NextResponse.json(
          {
            error:
              "برای این حساب هنوز رمز عبور ثبت نشده است. لطفاً از طریق تب «کد یک‌بارمصرف (OTP)» وارد شوید و سپس در بخش پروفایل رمز عبور خود را تعیین کنید.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error:
            "کاربری با این شماره موبایل یافت نشد. لطفاً از تب «ثبت‌نام جدید» اقدام به ثبت‌نام نمایید یا با کد پیامکی وارد شوید.",
        },
        { status: 404 }
      );
    }

    const isUserPasswordValid = verifyPassword(password, credential.passwordHash);
    if (!isUserPasswordValid) {
      return NextResponse.json(
        { error: "شماره موبایل یا رمز عبور اشتباه است." },
        { status: 401 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          name: "کاربر دنگ‌چی",
          role: Role.USER,
        },
      });
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: "حساب کاربری شما مسدود شده است." },
        { status: 403 }
      );
    }

    const token = await signSession({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    const targetRedirect = user.role === Role.ADMIN ? "/admin" : "/app";

    const response = NextResponse.json({
      success: true,
      message: "ورود با موفقیت انجام شد.",
      redirectUrl: targetRedirect,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      ...getSessionCookieOptions(),
    });

    return response;
  } catch (error) {
    console.error("login-password error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور در پردازش درخواست ورود." },
      { status: 500 }
    );
  }
}
