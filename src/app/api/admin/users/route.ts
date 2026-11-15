import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";
import { Role, SubStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const roleFilter = searchParams.get("role") || "ALL";
    const statusFilter = searchParams.get("status") || "ALL";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    if (roleFilter !== "ALL" && (roleFilter === "USER" || roleFilter === "ADMIN")) {
      where.role = roleFilter as Role;
    }

    if (statusFilter === "ACTIVE") {
      where.isBanned = false;
    } else if (statusFilter === "BANNED") {
      where.isBanned = true;
    }

    const now = new Date();

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        _count: {
          select: {
            memberships: true,
            paidExpenses: true,
          },
        },
        subscriptions: {
          where: {
            status: SubStatus.ACTIVE,
            expiresAt: { gt: now },
            plan: { price: { gt: 0n } },
          },
          include: { plan: true },
          orderBy: { expiresAt: "desc" },
          take: 1,
        },
      },
    });

    const formattedUsers = users.map((u) => {
      const activeProSub = u.subscriptions[0] || null;
      const remainingDays = activeProSub
        ? Math.max(
            0,
            Math.ceil(
              (new Date(activeProSub.expiresAt).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 0;

      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        role: u.role,
        isBanned: u.isBanned,
        createdAt: u.createdAt,
        groupCount: u._count.memberships,
        expenseCount: u._count.paidExpenses,
        isPro: !!activeProSub,
        proPlanTitle: activeProSub?.plan.title || null,
        proExpiresAt: activeProSub?.expiresAt || null,
        remainingDays,
      };
    });

    return NextResponse.json(serializeBigInt({ users: formattedUsers }));
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست کاربران." },
      { status: 500 }
    );
  }
}
