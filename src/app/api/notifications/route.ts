import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { getUserSubscriptionStatus } from '@/lib/subscription/feature-guard';
import {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/notification-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' },
        { status: 401 }
      );
    }

    const subStatus = await getUserSubscriptionStatus(session.userId);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { phone: true },
    });

    const notifications = getNotificationsForUser({
      userId: session.userId,
      userPhone: user?.phone || '',
      isPro: subStatus.isPro,
    });

    const unreadCount = notifications.filter(
      (n) => !n.readByUserIds.includes(session.userId)
    ).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json(
      { error: 'خطا در بارگذاری اعلان‌های کاربر.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { notifId } = body;

    if (notifId === 'ALL') {
      markAllNotificationsRead(session.userId);
    } else if (typeof notifId === 'string' && notifId) {
      markNotificationRead(notifId, session.userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/notifications error:', error);
    return NextResponse.json(
      { error: 'خطا در علامت‌گذاری اعلان به عنوان خوانده شده.' },
      { status: 500 }
    );
  }
}
