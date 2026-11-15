import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getUserSubscriptionStatus } from "@/lib/subscription/feature-guard";
import {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notification-store";
import { calculateEqualSplit, SplitResult } from "@/lib/accounting/split-calculator";
import { parseToman } from "@/lib/money";
import { PaymentSource, SplitType } from "@prisma/client";
import {
  getSyncCache,
  setSyncCache,
  invalidateUserSyncCache,
} from "@/lib/high-scale-cache";

export const dynamic = "force-dynamic";

/**
 * GET /api/sync
 * Returns the current user's state fingerprint, unread notifications,
 * and a deterministic syncHash to detect real-time changes across devices.
 */
export async function GET() {
  try {
    const session = await getSession();
    const serverTime = new Date().toISOString();

    if (!session || !session.userId) {
      return NextResponse.json({
        authenticated: false,
        serverTime,
      });
    }

    // Zero-DB-Hit Sync Stamp Cache Check:
    const cached = getSyncCache(session.userId);
    if (cached) {
      return NextResponse.json(
        {
          ...cached,
          serverTime,
        },
        {
          headers: {
            "X-Sync-Cache": "HIT",
            "Cache-Control": "private, no-cache, no-store",
          },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        cardNumber: true,
        role: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        serverTime,
      });
    }

    // 1. Pro Subscription check
    const { isPro } = await getUserSubscriptionStatus(session.userId);

    // 2. Count of groups the user belongs to
    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.userId },
      select: {
        groupId: true,
        joinedAt: true,
        group: { select: { createdAt: true } },
      },
    });
    const groupsCount = memberships.length;
    const groupIds = memberships.map((m) => m.groupId);

    // 3. Find the most recent activity timestamp across user's groups, expenses, settlements
    let latestActivityTime = user.updatedAt.getTime();

    for (const m of memberships) {
      if (m.joinedAt) {
        latestActivityTime = Math.max(latestActivityTime, m.joinedAt.getTime());
      }
      if (m.group?.createdAt) {
        latestActivityTime = Math.max(latestActivityTime, m.group.createdAt.getTime());
      }
    }

    // Check latest expense in user's groups
    if (groupIds.length > 0) {
      const latestExpense = await prisma.expense.findFirst({
        where: { groupId: { in: groupIds } },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      });
      if (latestExpense?.updatedAt) {
        latestActivityTime = Math.max(latestActivityTime, latestExpense.updatedAt.getTime());
      }

      // Check latest settlement in user's groups (settledAt)
      const latestSettlement = await prisma.settlement.findFirst({
        where: { groupId: { in: groupIds } },
        orderBy: { settledAt: "desc" },
        select: { settledAt: true },
      });
      if (latestSettlement?.settledAt) {
        latestActivityTime = Math.max(latestActivityTime, latestSettlement.settledAt.getTime());
      }
    }

    // 4. Notifications
    const userNotifs = getNotificationsForUser({
      userId: session.userId,
      userPhone: user.phone,
      isPro,
    });
    const unreadNotifications = userNotifs.filter(
      (n) => !n.readByUserIds.includes(session.userId)
    ).length;

    if (userNotifs.length > 0 && userNotifs[0].createdAt) {
      latestActivityTime = Math.max(
        latestActivityTime,
        new Date(userNotifs[0].createdAt).getTime()
      );
    }

    const latestActivityAt = new Date(latestActivityTime).toISOString();

    // 5. Deterministic Sync Hash
    const rawFingerprint = `${groupsCount}:${latestActivityAt}:${unreadNotifications}:${
      isPro ? 1 : 0
    }:${user.cardNumber || ""}:${user.updatedAt.toISOString()}`;
    const syncHash = crypto.createHash("md5").update(rawFingerprint).digest("hex");

    const payload = {
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        cardNumber: user.cardNumber,
        role: user.role,
      },
      isPro,
      groupsCount,
      latestActivityAt,
      unreadNotifications,
      syncHash,
      serverTime,
    };

    // Cache computed payload in RAM to eliminate subsequent DB hits
    setSyncCache(session.userId, payload);

    return NextResponse.json(payload, {
      headers: {
        "X-Sync-Cache": "MISS",
        "Cache-Control": "private, no-cache, no-store",
      },
    });
  } catch (error: any) {
    console.error("GET /api/sync error:", error);
    return NextResponse.json(
      { error: "خطا در بررسی وضعیت همگام‌سازی", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync
 * Batch processor for actions queued while the mobile device was offline.
 * Accepts { pendingActions: Array<{ id: string; type: 'QUICK_EXPENSE' | 'MARK_NOTIF_READ'; payload: any }> }
 * Returns { syncedIds: string[], syncHash: string, serverTime: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "برای همگام‌سازی ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const pendingActions: Array<{
      id: string;
      type: "QUICK_EXPENSE" | "MARK_NOTIF_READ";
      payload: any;
    }> = Array.isArray(body?.pendingActions) ? body.pendingActions : [];

    const syncedIds: string[] = [];

    for (const action of pendingActions) {
      try {
        if (action.type === "MARK_NOTIF_READ") {
          if (action.payload?.all) {
            markAllNotificationsRead(session.userId);
          } else if (action.payload?.notifId) {
            markNotificationRead(action.payload.notifId, session.userId);
          }
          syncedIds.push(action.id);
        } else if (action.type === "QUICK_EXPENSE") {
          const { groupId, title, totalAmount: rawAmount, categoryId, paymentSource, fundId } =
            action.payload || {};

          if (!groupId || !title || !rawAmount) {
            continue;
          }

          // Verify group membership
          const membership = await prisma.groupMember.findUnique({
            where: {
              groupId_userId: {
                groupId,
                userId: session.userId,
              },
            },
          });

          if (!membership) {
            continue;
          }

          // Parse amount
          const totalAmount = parseToman(String(rawAmount));
          if (totalAmount <= 0n) {
            continue;
          }

          // Resolve category
          let validCategoryId = categoryId;
          if (!validCategoryId) {
            const defaultCat = await prisma.category.findFirst({
              where: { isSystem: true },
            });
            validCategoryId = defaultCat?.id;
          }

          if (!validCategoryId) {
            continue;
          }

          // Resolve equal splits for all members
          const members = await prisma.groupMember.findMany({
            where: { groupId },
            select: { userId: true },
          });

          if (members.length === 0) {
            continue;
          }

          const splitResults: SplitResult[] = calculateEqualSplit(
            totalAmount,
            members.map((m) => m.userId)
          );

          const isFundPayment = paymentSource === "FUND" && fundId;

          await prisma.expense.create({
            data: {
              groupId,
              title: String(title).trim(),
              totalAmount,
              categoryId: validCategoryId,
              paidByUserId: isFundPayment ? null : session.userId,
              fundId: isFundPayment ? String(fundId).trim() : null,
              paymentSource: isFundPayment ? PaymentSource.FUND : PaymentSource.PERSONAL,
              expenseDate: new Date(),
              splits: {
                create: splitResults.map((s) => ({
                  userId: s.userId,
                  owedAmount: s.owedAmount,
                  splitType: SplitType.EQUAL,
                })),
              },
            },
          });

          syncedIds.push(action.id);
        }
      } catch (err) {
        console.error(`Error processing queued action ${action.id}:`, err);
      }
    }

    // Generate updated syncHash after batch processing
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { phone: true, cardNumber: true, updatedAt: true },
    });
    const { isPro } = await getUserSubscriptionStatus(session.userId);
    const groupsCount = await prisma.groupMember.count({
      where: { userId: session.userId },
    });

    const userNotifs = getNotificationsForUser({
      userId: session.userId,
      userPhone: user?.phone || "",
      isPro,
    });
    const unreadNotifications = userNotifs.filter(
      (n) => !n.readByUserIds.includes(session.userId)
    ).length;

    const serverTime = new Date().toISOString();
    const rawFingerprint = `${groupsCount}:${serverTime}:${unreadNotifications}:${
      isPro ? 1 : 0
    }:${user?.cardNumber || ""}`;
    const syncHash = crypto.createHash("md5").update(rawFingerprint).digest("hex");

    // Invalidate user sync cache so the next GET sync serves freshly updated state
    invalidateUserSyncCache(session.userId);

    return NextResponse.json({
      syncedIds,
      syncHash,
      serverTime,
    });
  } catch (error: any) {
    console.error("POST /api/sync error:", error);
    return NextResponse.json(
      { error: "خطا در پردازش صف آفلاین", details: error.message },
      { status: 500 }
    );
  }
}
