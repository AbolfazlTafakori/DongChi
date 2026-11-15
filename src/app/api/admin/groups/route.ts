import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { inviteCode: { contains: search, mode: "insensitive" } },
      ];
    }

    // PRIVACY-BY-DESIGN: Only query metadata and counts, strictly omitting private expenses & balances
    const groups = await prisma.group.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        currency: true,
        inviteCode: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        _count: {
          select: {
            members: true,
            expenses: true,
            funds: true,
          },
        },
      },
    });

    const formattedGroups = groups.map((g) => ({
      id: g.id,
      title: g.title,
      currency: g.currency,
      inviteCode: g.inviteCode,
      createdAt: g.createdAt,
      creatorName: g.createdBy?.name || "ناشناس",
      creatorPhone: g.createdBy?.phone || "-",
      memberCount: g._count.members,
      expenseCount: g._count.expenses,
      fundCount: g._count.funds,
    }));

    return NextResponse.json(serializeBigInt({ groups: formattedGroups }));
  } catch (error) {
    console.error("GET /api/admin/groups error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست گروه‌ها." },
      { status: 500 }
    );
  }
}
