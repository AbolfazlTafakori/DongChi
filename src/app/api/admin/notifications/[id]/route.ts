import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import {
  toggleNotificationActive,
  deleteNotificationItem,
} from '@/lib/notification-store';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { isActive } = body;

    const updated = toggleNotificationActive(id, Boolean(isActive));
    if (!updated) {
      return NextResponse.json({ error: 'اعلان مورد نظر یافت نشد.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'وضعیت اعلان با موفقیت تغییر کرد.',
      notification: updated,
    });
  } catch (error) {
    console.error('PATCH /api/admin/notifications/[id] error:', error);
    return NextResponse.json(
      { error: 'خطا در تغییر وضعیت اعلان.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    const deleted = deleteNotificationItem(id);
    if (!deleted) {
      return NextResponse.json({ error: 'اعلان مورد نظر یافت نشد.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'اعلان با موفقیت حذف گردید.',
    });
  } catch (error) {
    console.error('DELETE /api/admin/notifications/[id] error:', error);
    return NextResponse.json(
      { error: 'خطا در حذف اعلان.' },
      { status: 500 }
    );
  }
}
