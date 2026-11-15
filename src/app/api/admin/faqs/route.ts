import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import {
  getAllAdminFaqs,
  createFaqItem,
  resetDefaultFaqs,
  FaqCategory,
} from '@/lib/faq-store';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES: FaqCategory[] = [
  'ACCOUNTING',
  'FUND',
  'SUBSCRIPTION',
  'SECURITY',
];

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const faqs = getAllAdminFaqs();
    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('GET /api/admin/faqs error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت سوالات متداول ادمین.' },
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

    if (body.action === 'RESET_DEFAULTS') {
      const faqs = resetDefaultFaqs();
      return NextResponse.json({
        success: true,
        message: 'سوالات متداول با موفقیت به حالت پیش‌فرض بازنشانی شدند.',
        faqs,
      });
    }

    const { question, answer, category, badge, order, isActive } = body;

    if (!question || typeof question !== 'string' || question.trim().length < 5) {
      return NextResponse.json(
        { error: 'متن سوال باید حداقل ۵ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    if (!answer || typeof answer !== 'string' || answer.trim().length < 10) {
      return NextResponse.json(
        { error: 'متن پاسخ باید حداقل ۱۰ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    const validCategory: FaqCategory = VALID_CATEGORIES.includes(category)
      ? category
      : 'ACCOUNTING';

    const newFaq = createFaqItem({
      question,
      answer,
      category: validCategory,
      badge: typeof badge === 'string' ? badge : undefined,
      order: typeof order === 'number' ? order : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json({
      success: true,
      message: 'سوال جدید با موفقیت ایجاد شد.',
      faq: newFaq,
    });
  } catch (error) {
    console.error('POST /api/admin/faqs error:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت سوال جدید.' },
      { status: 500 }
    );
  }
}
