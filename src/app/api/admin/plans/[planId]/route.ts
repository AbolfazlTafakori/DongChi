import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import { parseToman } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { planId } = params;
    const body = await request.json().catch(() => ({}));

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "پلن مورد نظر یافت نشد." },
        { status: 404 }
      );
    }

    const dataToUpdate: any = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (title.length < 2) {
        return NextResponse.json(
          { error: "عنوان پلن باید حداقل ۲ حرف باشد." },
          { status: 400 }
        );
      }
      dataToUpdate.title = title;
    }

    if (body.price !== undefined) {
      const price = parseToman(String(body.price));
      if (price < 0n) {
        return NextResponse.json(
          { error: "مبلغ پلن نمی‌تواند منفی باشد." },
          { status: 400 }
        );
      }
      dataToUpdate.price = price;
    }

    if (body.durationDays !== undefined) {
      const durationDays = Number(body.durationDays);
      if (isNaN(durationDays) || durationDays < 1) {
        return NextResponse.json(
          { error: "مدت اعتبار پلن باید حداقل ۱ روز باشد." },
          { status: 400 }
        );
      }
      dataToUpdate.durationDays = durationDays;
    }

    if (body.isActive !== undefined) {
      dataToUpdate.isActive = Boolean(body.isActive);
    }

    const updated = await prisma.plan.update({
      where: { id: planId },
      data: dataToUpdate,
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: "پلن با موفقیت به‌روزرسانی شد.",
        plan: updated,
      })
    );
  } catch (error) {
    console.error("PATCH /api/admin/plans/[planId] error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی پلن." },
      { status: 500 }
    );
  }
}
