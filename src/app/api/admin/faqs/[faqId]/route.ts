import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { updateFaqItem, deleteFaqItem, FaqCategory } from '@/lib/faq-store';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES: FaqCategory[] = [
  'ACCOUNTING',
  'FUND',
  'SUBSCRIPTION',
  'SECURITY',
];

interface RouteParams {
  params: {
    faqId: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { faqId } = params;
    const body = await request.json().catch(() => ({}));

    if (body.question !== undefined && (typeof body.question !== 'string' || body.question.trim().length < 5)) {
      return NextResponse.json(
        { error: 'متن سوال باید حداقل ۵ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    if (body.answer !== undefined && (typeof body.answer !== 'string' || body.answer.trim().length < 10)) {
      return NextResponse.json(
        { error: 'متن پاسخ باید حداقل ۱۰ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    const updates: Parameters<typeof updateFaqItem>[1] = {};

    if (body.category !== undefined && VALID_CATEGORIES.includes(body.category)) {
      updates.category = body.category;
    }
    if (body.question !== undefined) {
      updates.question = body.question;
    }
    if (body.answer !== undefined) {
      updates.answer = body.answer;
    }
    if (body.badge !== undefined) {
      updates.badge = body.badge;
    }
    if (body.order !== undefined) {
      updates.order = Number(body.order);
    }
    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
    }

    const updated = updateFaqItem(faqId, updates);
    if (!updated) {
      return NextResponse.json(
        { error: 'سوال مورد نظر یافت نشد.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'سوال متداول با موفقیت ویرایش شد.',
      faq: updated,
    });
  } catch (error) {
    console.error('PATCH /api/admin/faqs/[faqId] error:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش سوال متداول.' },
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

    const { faqId } = params;
    const success = deleteFaqItem(faqId);
    if (!success) {
      return NextResponse.json(
        { error: 'سوال مورد نظر یافت نشد یا قبلاً حذف شده است.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'سوال متداول با موفقیت حذف شد.',
    });
  } catch (error) {
    console.error('DELETE /api/admin/faqs/[faqId] error:', error);
    return NextResponse.json(
      { error: 'خطا در حذف سوال متداول.' },
      { status: 500 }
    );
  }
}
