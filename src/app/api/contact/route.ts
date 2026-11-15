import { NextRequest, NextResponse } from 'next/server';
import { createContactMessage, ContactTopic } from '@/lib/contact-store';

export const dynamic = 'force-dynamic';

const VALID_TOPICS: ContactTopic[] = ['FEATURE', 'BUG', 'BILLING', 'PARTNERSHIP'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, contactInfo, message, topic } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'لطفاً نام و نام خانوادگی خود را وارد کنید (حداقل ۲ کاراکتر).' },
        { status: 400 }
      );
    }

    if (!contactInfo || typeof contactInfo !== 'string' || contactInfo.trim().length < 5) {
      return NextResponse.json(
        { error: 'لطفاً شماره موبایل یا ایمیل معتبر وارد کنید (حداقل ۵ کاراکتر).' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json(
        { error: 'متن پیام یا پیشنهاد باید حداقل ۱۰ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    const validTopic: ContactTopic = VALID_TOPICS.includes(topic) ? topic : 'FEATURE';

    const item = createContactMessage({
      name,
      contactInfo,
      message,
      topic: validTopic,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'پیام شما با موفقیت ثبت شد.',
        item,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/contact error:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت پیام تماس.' },
      { status: 500 }
    );
  }
}
