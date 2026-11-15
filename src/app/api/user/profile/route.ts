import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { normalizeDigits } from "@/lib/money";
import {
  hasUserPassword,
  setUserPassword,
  verifyUserPassword,
} from "@/lib/user-credentials";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        cardNumber: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "کاربر یافت نشد." },
        { status: 404 }
      );
    }

    const hasPassword = await hasUserPassword(user.phone);

    return NextResponse.json({
      user: {
        ...user,
        hasPassword,
      },
    });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات کاربری." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "اطلاعات ارسالی نامعتبر است." },
        { status: 400 }
      );
    }

    const updateData: { name?: string; cardNumber?: string | null } = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2) {
        return NextResponse.json(
          { error: "نام باید حداقل ۲ حرف باشد." },
          { status: 400 }
        );
      }
      updateData.name = name;
    }

    if (body.cardNumber !== undefined) {
      if (!body.cardNumber || String(body.cardNumber).trim() === "") {
        updateData.cardNumber = null;
      } else {
        const cleanCard = normalizeDigits(String(body.cardNumber)).replace(
          /[^\d]/g,
          ""
        );
        if (cleanCard.length !== 16) {
          return NextResponse.json(
            { error: "شماره کارت بانکی باید ۱۶ رقم باشد." },
            { status: 400 }
          );
        }
        updateData.cardNumber = cleanCard;
      }
    }

    // Handle Password Set or Change
    if (body.newPassword !== undefined) {
      const newPassword = String(body.newPassword).trim();
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "رمز عبور جدید باید حداقل ۶ نویسه باشد." },
          { status: 400 }
        );
      }

      const alreadyHasPassword = await hasUserPassword(session.phone);
      if (alreadyHasPassword) {
        const currentPassword = String(body.currentPassword || "");
        if (!currentPassword) {
          return NextResponse.json(
            { error: "لطفاً رمز عبور فعلی خود را وارد نمایید." },
            { status: 400 }
          );
        }

        const isCurrentValid = await verifyUserPassword(session.phone, currentPassword);
        if (!isCurrentValid) {
          return NextResponse.json(
            { error: "رمز عبور فعلی وارد شده نادرست است." },
            { status: 401 }
          );
        }
      }

      await setUserPassword(session.userId, session.phone, newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        cardNumber: true,
        role: true,
      },
    });

    const hasPassword = await hasUserPassword(updated.phone);

    return NextResponse.json({
      success: true,
      message: body.newPassword ? "اطلاعات و رمز عبور با موفقیت به‌روزرسانی شدند." : "پروفایل با موفقیت به‌روزرسانی شد.",
      user: {
        ...updated,
        hasPassword,
      },
    });
  } catch (error) {
    console.error("PATCH /api/user/profile error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی اطلاعات کاربری." },
      { status: 500 }
    );
  }
}
