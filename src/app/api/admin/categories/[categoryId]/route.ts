import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { categoryId } = params;
    const body = await request.json().catch(() => ({}));

    const dataToUpdate: any = {};
    if (body.name) dataToUpdate.name = String(body.name).trim();
    if (body.icon) dataToUpdate.icon = String(body.icon).trim();
    if (body.color) dataToUpdate.color = String(body.color).trim();

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: dataToUpdate,
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: "دسته‌بندی با موفقیت ویرایش شد.",
        category: updated,
      })
    );
  } catch (error) {
    console.error("PATCH /api/admin/categories/[categoryId] error:", error);
    return NextResponse.json(
      { error: "خطا در ویرایش دسته‌بندی." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { categoryId } = params;

    const expenseCount = await prisma.expense.count({
      where: { categoryId },
    });

    if (expenseCount > 0) {
      return NextResponse.json(
        { error: "این دسته‌بندی دارای هزینه ثبت‌شده است و قابل حذف نیست." },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      success: true,
      message: "دسته‌بندی با موفقیت حذف گردید.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/categories/[categoryId] error:", error);
    return NextResponse.json(
      { error: "خطا در حذف دسته‌بندی." },
      { status: 500 }
    );
  }
}
