import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidIranianPhone, normalizePhone, isValidOtp } from "@/lib/validation";
import {
  signSession,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from "@/lib/session";
import {
  secureCompareOtp,
  recordFailedAttempt,
  getFailedAttempts,
  resetFailedAttempts,
  MAX_OTP_ATTEMPTS,
} from "@/lib/auth-security";
import { getSystemConfig } from "@/lib/system-config";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.phone || !body.code) {
      return NextResponse.json(
        { error: "شماره موبایل و کد تأیید الزامی هستند." },
        { status: 400 }
      );
    }

    const phone = normalizePhone(body.phone);
    const code = normalizePhone(body.code);
    const name = body.name ? String(body.name).trim() : undefined;

    if (!isValidIranianPhone(phone)) {
      return NextResponse.json(
        { error: "شماره موبایل وارد شده معتبر نیست." },
        { status: 400 }
      );
    }

    if (!isValidOtp(code)) {
      return NextResponse.json(
        { error: "کد تأیید باید یک عدد ۵ رقمی باشد." },
        { status: 400 }
      );
    }

    // Brute-force lockout check: if already 5 or more failed attempts
    const failedCount = getFailedAttempts(phone);
    if (failedCount >= MAX_OTP_ATTEMPTS) {
      // Invalidate/burn any remaining active codes for this phone
      await prisma.otpCode.updateMany({
        where: { phone, used: false },
        data: { used: true },
      });
      return NextResponse.json(
        {
          error:
            "تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدیدی دریافت کنید.",
        },
        { status: 429 }
      );
    }

    // Retrieve the active, unexpired, unused OTP record from DB
    const activeOtp = await prisma.otpCode.findFirst({
      where: {
        phone,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    const sysConfig = getSystemConfig();
    const devStaticOtp = (sysConfig.sms.enableStaticDevOtp ? sysConfig.sms.staticDevOtpCode : "") || process.env.DEV_STATIC_OTP?.trim();

    // Constant-time comparison against DB record or dev static OTP
    const isDbMatch = activeOtp
      ? secureCompareOtp(code, activeOtp.code)
      : false;
    const isStaticMatch = devStaticOtp
      ? secureCompareOtp(code, devStaticOtp)
      : false;

    const isValid = isDbMatch || isStaticMatch;

    if (!isValid) {
      const attempts = recordFailedAttempt(phone);
      if (attempts >= MAX_OTP_ATTEMPTS) {
        // Burn all active codes
        await prisma.otpCode.updateMany({
          where: { phone, used: false },
          data: { used: true },
        });
        return NextResponse.json(
          {
            error:
              "تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدیدی دریافت کنید.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "کد تأیید نادرست است یا منقضی شده است." },
        { status: 400 }
      );
    }

    // Successful match -> Reset failed attempts immediately
    resetFailedAttempts(phone);

    // Burn all active OTP codes for this phone to prevent replay attacks
    await prisma.otpCode.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });

    // Check if user exists or create new user
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user && !sysConfig.developer.allowNewRegistrations) {
      return NextResponse.json(
        { error: "ثبت‌نام کاربران جدید در حال حاضر غیرفعال است." },
        { status: 403 }
      );
    }

    if (user) {
      if (user.isBanned) {
        return NextResponse.json(
          { error: "حساب کاربری شما مسدود شده است." },
          { status: 403 }
        );
      }
      if (name && (!user.name || user.name === "کاربر دنگ‌چی")) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          phone,
          name: name || "کاربر دنگ‌چی",
          role: Role.USER,
        },
      });
    }

    // Sign session JWT
    const token = await signSession({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });

    // Set hardened session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      ...getSessionCookieOptions(),
    });

    return response;
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { error: "خطای سرور در بررسی کد تأیید." },
      { status: 500 }
    );
  }
}
