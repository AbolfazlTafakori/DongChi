import { NextResponse } from 'next/server';
import { getPublicFaqs } from '@/lib/faq-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const faqs = getPublicFaqs();
    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('GET /api/faqs error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست سوالات متداول.' },
      { status: 500 }
    );
  }
}
