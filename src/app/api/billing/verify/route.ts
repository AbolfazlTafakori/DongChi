import { NextRequest, NextResponse } from "next/server";
import { processPaymentCallback } from "@/lib/payment/gateway";
import { serializeBigInt } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.authority) {
      return NextResponse.json(
        { error: "شناسه پرداخت (Authority) الزامی است." },
        { status: 400 }
      );
    }

    const authority = String(body.authority).trim();
    const status = body.status ? String(body.status).trim() : "NOK";

    const result = await processPaymentCallback({
      authority,
      status,
    });

    return NextResponse.json(serializeBigInt(result));
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "تراکنش مورد نظر در سامانه یافت نشد." },
        { status: 404 }
      );
    }
    console.error("POST /api/billing/verify error:", error);
    return NextResponse.json(
      { error: error.message || "خطا در پردازش نتیجه تراکنش." },
      { status: 500 }
    );
  }
}
