import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth-guard";
import { requestPayment } from "@/lib/payment/gateway";
import { TxStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.planId) {
      return NextResponse.json(
        { error: "شناسه پلن انتخابی الزامی است." },
        { status: 400 }
      );
    }

    const planId = String(body.planId).trim();
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "پلن انتخابی نامعتبر یا غیرفعال است." },
        { status: 404 }
      );
    }

    if (plan.price <= 0n) {
      return NextResponse.json(
        { error: "این پلن رایگان است و نیازی به پرداخت ندارد." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { phone: true, name: true },
    });

    // Derive public origin for callback
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "localhost:3000";
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const origin = `${proto}://${host}`;
    const callbackUrl = `${origin}/app/payment/callback`;

    // Request payment authority from Gateway / Sandbox
    const paymentRequest = await requestPayment({
      amountToman: plan.price,
      description: `خرید اشتراک ${plan.title} دنگ‌چی`,
      callbackUrl,
      mobile: user?.phone,
    });

    // Create pending transaction in database
    await prisma.transaction.create({
      data: {
        userId: session.userId,
        planId: plan.id,
        amount: plan.price,
        authority: paymentRequest.authority,
        status: TxStatus.PENDING,
      },
    });

    return NextResponse.json(
      {
        success: true,
        paymentUrl: paymentRequest.paymentUrl,
        authority: paymentRequest.authority,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/billing/checkout error:", error);
    return NextResponse.json(
      { error: error.message || "خطا در ایجاد تراکنش پرداخت." },
      { status: 500 }
    );
  }
}
