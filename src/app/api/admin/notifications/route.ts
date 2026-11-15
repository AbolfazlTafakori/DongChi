import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import {
  getAllAdminNotifications,
  createNotificationItem,
  NotificationTarget,
  NotificationLevel,
} from '@/lib/notification-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const notifications = getAllAdminNotifications();
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('GET /api/admin/notifications error:', error);
    return NextResponse.json(
      { error: 'خطا در بارگذاری لیست اعلان‌ها.' },
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

    const body = await request.json().catch(() => ({}));
    const {
      title,
      body: notifBody,
      level = 'INFO',
      target = 'ALL',
      targetPhone,
      actionLabel,
      actionUrl,
      isPinnedBanner = false,
    } = body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json(
        { error: 'عنوان اعلان باید حداقل ۳ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    if (!notifBody || typeof notifBody !== 'string' || notifBody.trim().length < 5) {
      return NextResponse.json(
        { error: 'متن اعلان باید حداقل ۵ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    if (target === 'USER' && (!targetPhone || targetPhone.trim().length < 10)) {
      return NextResponse.json(
        { error: 'برای ارسال به کاربر خاص، شماره موبایل ۱۱ رقمی الزامی است.' },
        { status: 400 }
      );
    }

    const item = createNotificationItem({
      title,
      body: notifBody,
      level: level as NotificationLevel,
      target: target as NotificationTarget,
      targetPhone,
      actionLabel,
      actionUrl,
      isPinnedBanner,
    });

    return NextResponse.json({
      success: true,
      message: 'اعلان با موفقیت ایجاد و ارسال شد.',
      notification: item,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/notifications error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد اعلان جدید.' },
      { status: 500 }
    );
  }
}
