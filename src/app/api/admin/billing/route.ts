import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import { TxStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const statusFilter = searchParams.get("status") || "ALL";

    const [plans, transactions] = await Promise.all([
      prisma.plan.findMany({
        orderBy: { price: "asc" },
      }),
      prisma.transaction.findMany({
        where: {
          ...(statusFilter !== "ALL" && { status: statusFilter as TxStatus }),
          ...(search && {
            OR: [
              { authority: { contains: search, mode: "insensitive" } },
              { refId: { contains: search } },
              { user: { name: { contains: search, mode: "insensitive" } } },
              { user: { phone: { contains: search } } },
            ],
          }),
        },
        include: {
          user: { select: { id: true, name: true, phone: true } },
          plan: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    return NextResponse.json(
      serializeBigInt({
        plans,
        transactions,
      })
    );
  } catch (error) {
    console.error("GET /api/admin/billing error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات مالی و پلن‌ها." },
      { status: 500 }
    );
  }
}
