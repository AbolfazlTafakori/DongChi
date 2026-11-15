import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidIranianPhone, normalizePhone } from "@/lib/validation";
import {
  generateOtpCode,
  isOtpRateLimited,
  resetFailedAttempts,
} from "@/lib/auth-security";
import { getSystemConfig } from "@/lib/system-config";

export async function POST(request: NextRequest) {
  try {
    const config = getSystemConfig();
    const body = await request.json().catch(() => null);
    if (!body || !body.phone) {
      return NextResponse.json(
        { error: "شماره موبایل الزامی است." },
        { status: 400 }
      );
    }

    const phone = normalizePhone(body.phone);

    if (!isValidIranianPhone(phone)) {
      return NextResponse.json(
        {
          error:
            "شماره موبایل وارد شده معتبر نیست. لطفاً شماره ۱۱ رقمی با فرمت ۰۹ وارد کنید.",
        },
        { status: 400 }
      );
    }

    // Rate Limiting: Check if an unused OTP was created for this phone within the last 30 seconds
    const latestOtp = await prisma.otpCode.findFirst({
      where: { phone, used: false },
      orderBy: { createdAt: "desc" },
    });

    const isDevStatic = config.sms.enableStaticDevOtp || Boolean(process.env.DEV_STATIC_OTP?.trim());
    if (!isDevStatic && isOtpRateLimited(latestOtp?.createdAt, 30)) {
      return NextResponse.json(
        { error: "لطفاً پیش از درخواست مجدد کمی صبر کنید." },
        { status: 429 }
      );
    }

    // Invalidate any older unused codes for this phone
    await prisma.otpCode.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });

    // Reset failed verification attempts counter on new OTP generation
    resetFailedAttempts(phone);

    // Generate code (uses DEV_STATIC_OTP from .env or config if present, otherwise crypto.randomInt)
    const code = generateOtpCode();
    const expirySeconds = config.sms.otpExpirySeconds || 120;
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);

    // Save to database
    await prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt,
        used: false,
      },
    });

    // Server-only terminal log (Never leak code into response)
    console.log(`\n========================================`);
    console.log(`[SECURE AUTH]: OTP generated for ${phone}`);
    if (isDevStatic) {
      console.log(`[DEV_STATIC_OTP Active in .env]: ${code}`);
    }
    console.log(`========================================\n`);

    // Strictly return only success message and expiration time - ZERO code leakage
    return NextResponse.json({
      success: true,
      message: "کد تأیید با موفقیت ارسال شد.",
      expiresInSeconds: expirySeconds,
    });
  } catch (error) {
    console.error("send-otp error:", error);
    return NextResponse.json(
      { error: "خطای سرور در ارسال کد تأیید." },
      { status: 500 }
    );
  }
}
