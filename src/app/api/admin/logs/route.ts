import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import {
  getSystemAnnouncement,
  setSystemAnnouncement,
} from "@/lib/announcement";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [recentOtps, recentAudits, recentFundTxs] = await Promise.all([
      // Recent OTP requests (latest 20, masked code for security)
      prisma.otpCode.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          phone: true,
          used: true,
          createdAt: true,
          expiresAt: true,
        },
      }),

      // Recent System Audit Logs (latest 20)
      prisma.auditLog.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          group: { select: { id: true, title: true } },
          changedByUser: { select: { id: true, name: true, phone: true } },
        },
      }),

      // Recent Fund Reconciliations / Deposits (latest 15)
      prisma.fundTransaction.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: {
          fund: { select: { id: true, title: true } },
          group: { select: { id: true, title: true } },
          user: { select: { id: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      logs: {
        recentOtps: recentOtps.map((o) => ({
          ...o,
          maskedPhone: o.phone.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2"),
        })),
        recentAudits: recentAudits.map((a) => ({
          id: a.id,
          action: a.action,
          groupTitle: a.group.title,
          groupId: a.group.id,
          userName: a.changedByUser.name,
          createdAt: a.createdAt,
        })),
        recentFundTxs: recentFundTxs.map((f) => ({
          id: f.id,
          type: f.type,
          amount: f.amount.toString(),
          fundTitle: f.fund.title,
          groupTitle: f.group.title,
          userName: f.user.name,
          note: f.note,
          createdAt: f.createdAt,
        })),
      },
      announcement: getSystemAnnouncement(),
    });
  } catch (error: any) {
    console.error("admin logs fetch error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لاگ‌های امنیتی." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "متن اطلاعیه الزامی است." },
        { status: 400 }
      );
    }

    const updated = setSystemAnnouncement({
      message: body.message,
      type: body.type,
      isActive: body.isActive,
    });

    return NextResponse.json({
      success: true,
      announcement: updated,
    });
  } catch (error: any) {
    console.error("admin announcement update error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی اطلاعیه سیستم." },
      { status: 500 }
    );
  }
}
