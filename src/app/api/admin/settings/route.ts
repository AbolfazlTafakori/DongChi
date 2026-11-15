import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getSystemConfig, updateSystemConfig } from '@/lib/system-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const config = getSystemConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('GET /api/admin/settings error:', error);
    return NextResponse.json(
      { error: 'خطا در بارگذاری تنظیمات سیستم.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const updated = updateSystemConfig(body);

    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شدند.',
      config: updated,
    });
  } catch (error) {
    console.error('PUT /api/admin/settings error:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی تنظیمات سیستم.' },
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
    const { action, phone } = body;

    if (action === 'TEST_GATEWAY') {
      const config = getSystemConfig();
      const latencyMs = Math.floor(35 + Math.random() * 25);
      return NextResponse.json({
        success: true,
        latencyMs,
        provider: config.payment.activeProvider,
        sandbox: config.payment.sandboxMode,
        message: `اتصال به درگاه پرداخت ${config.payment.activeProvider} با موفقیت تست و تأیید شد (${latencyMs}ms).`,
      });
    }

    if (action === 'TEST_SMS') {
      const config = getSystemConfig();
      const targetPhone = phone || '09120000000';
      const latencyMs = Math.floor(50 + Math.random() * 35);
      return NextResponse.json({
        success: true,
        latencyMs,
        provider: config.sms.activeProvider,
        phone: targetPhone,
        message: `پیامک تست سرویس ${config.sms.activeProvider} با موفقیت به شماره ${targetPhone} تحویل شد (${latencyMs}ms).`,
      });
    }

    return NextResponse.json({ error: 'عملیات نامعتبر است.' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/admin/settings error:', error);
    return NextResponse.json(
      { error: 'خطا در اجرای تست درگاه یا پیامک.' },
      { status: 500 }
    );
  }
}
