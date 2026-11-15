import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getAllContactMessages } from '@/lib/contact-store';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const messages = getAllContactMessages();
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('GET /api/admin/messages error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست پیام‌های کاربران.' },
      { status: 500 }
    );
  }
}
