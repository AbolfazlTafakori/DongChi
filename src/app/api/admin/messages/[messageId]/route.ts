import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { updateContactMessageStatus, deleteContactMessage, ContactStatus } from '@/lib/contact-store';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    messageId: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { messageId } = params;
    const body = await request.json().catch(() => ({}));
    const { status } = body;

    if (status !== 'NEW' && status !== 'RESOLVED') {
      return NextResponse.json(
        { error: 'وضعیت پیام نامعتبر است.' },
        { status: 400 }
      );
    }

    const updated = updateContactMessageStatus(messageId, status as ContactStatus);
    if (!updated) {
      return NextResponse.json(
        { error: 'پیام مورد نظر یافت نشد.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'وضعیت پیام با موفقیت به‌روزرسانی شد.',
      item: updated,
    });
  } catch (error) {
    console.error('PATCH /api/admin/messages/[messageId] error:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی وضعیت پیام.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { messageId } = params;
    const success = deleteContactMessage(messageId);
    if (!success) {
      return NextResponse.json(
        { error: 'پیام مورد نظر یافت نشد یا قبلاً حذف شده است.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'پیام با موفقیت حذف شد.',
    });
  } catch (error) {
    console.error('DELETE /api/admin/messages/[messageId] error:', error);
    return NextResponse.json(
      { error: 'خطا در حذف پیام.' },
      { status: 500 }
    );
  }
}
