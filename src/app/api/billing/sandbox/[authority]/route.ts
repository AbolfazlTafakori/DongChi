import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { authority: string } }
) {
  try {
    const { authority } = params;
    if (!authority) {
      return NextResponse.json(
        { error: "شناسه پرداخت (Authority) الزامی است." },
        { status: 400 }
      );
    }

    const tx = await prisma.transaction.findUnique({
      where: { authority },
      include: {
        plan: true,
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!tx) {
      return NextResponse.json(
        { error: "تراکنش مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      serializeBigInt({
        authority: tx.authority,
        amount: tx.amount,
        status: tx.status,
        plan: {
          title: tx.plan.title,
          durationDays: tx.plan.durationDays,
          slug: tx.plan.slug,
        },
        userName: tx.user.name,
        userPhone: tx.user.phone,
      })
    );
  } catch (error) {
    console.error("GET /api/billing/sandbox/[authority] error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات تراکنش آزمایشی." },
      { status: 500 }
    );
  }
}
