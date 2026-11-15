import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const categories = await prisma.category.findMany({
      where: { isSystem: true },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      isSystem: c.isSystem,
      expenseCount: c._count.expenses,
    }));

    return NextResponse.json(serializeBigInt({ categories: formatted }));
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست دسته‌بندی‌های سیستمی." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.name || !body.icon || !body.color) {
      return NextResponse.json(
        { error: "نام، آیکون و رنگ دسته‌بندی الزامی هستند." },
        { status: 400 }
      );
    }

    const name = String(body.name).trim();
    const icon = String(body.icon).trim();
    const color = String(body.color).trim();

    if (name.length < 2) {
      return NextResponse.json(
        { error: "نام دسته‌بندی باید حداقل ۲ حرف باشد." },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        icon,
        color,
        isSystem: true,
      },
    });

    return NextResponse.json(
      serializeBigInt({
        success: true,
        message: "دسته‌بندی سیستمی با موفقیت ایجاد شد.",
        category,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد دسته‌بندی سیستمی." },
      { status: 500 }
    );
  }
}
