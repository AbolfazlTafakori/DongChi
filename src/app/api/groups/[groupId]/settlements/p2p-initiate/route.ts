import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth-guard';
import { getSystemConfig } from '@/lib/system-config';
import { parseToman } from '@/lib/money';
import { createP2pPaymentIntent } from '@/lib/p2p-settlement-store';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' },
        { status: 401 }
      );
    }

    const { groupId } = params;

    // Check Phase 2 feature flag in Admin Settings
    const config = getSystemConfig();
    if (!config.payment.enableP2pGatewaySettlement) {
      return NextResponse.json(
        {
          error:
            'تسویه آنلاین از طریق درگاه در حال حاضر غیرفعال است. لطفاً پس از کارت‌به‌کارت، از گزینه ثبت تسویه دستی استفاده کنید.',
        },
        { status: 400 }
      );
    }

    // Verify membership of current user
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'شما عضو این گروه نیستید.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'اطلاعات ارسالی نامعتبر است.' },
        { status: 400 }
      );
    }

    const toUserId = body.toUserId ? String(body.toUserId).trim() : '';
    if (!toUserId) {
      return NextResponse.json(
        { error: 'انتخاب عضو طلبکار الزامی است.' },
        { status: 400 }
      );
    }

    if (toUserId === session.userId) {
      return NextResponse.json(
        { error: 'پرداخت‌کننده و دریافت‌کننده نمی‌توانند یکسان باشند.' },
        { status: 400 }
      );
    }

    // Verify toUserId is also member
    const toMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: toUserId,
        },
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!toMember) {
      return NextResponse.json(
        { error: 'کاربر طلبکار عضو این گروه نیست.' },
        { status: 400 }
      );
    }

    const amount = parseToman(String(body.amount ?? ''));
    if (amount <= 0n) {
      return NextResponse.json(
        { error: 'مبلغ تسویه باید بزرگتر از صفر باشد.' },
        { status: 400 }
      );
    }

    // Commission computation
    const commissionPercent = config.payment.p2pCommissionPercent || 0;
    const commissionAmount =
      commissionPercent > 0
        ? (amount * BigInt(Math.round(commissionPercent * 100))) / 10000n
        : 0n;
    const totalPayable = amount + commissionAmount;

    // Create P2P Payment Intent with Idempotency Guard
    const intent = createP2pPaymentIntent({
      idempotencyKey: body.idempotencyKey,
      groupId,
      fromUserId: session.userId,
      toUserId,
      creditorName: toMember.user.name || 'عضو گروه',
      amount: amount.toString(),
      commissionAmount: commissionAmount.toString(),
      totalPayable: totalPayable.toString(),
    });

    const paymentUrl = `/app/groups/${groupId}/p2p-gateway?authority=${intent.authority}`;

    return NextResponse.json({
      success: true,
      authority: intent.authority,
      paymentUrl,
      intent,
    });
  } catch (error: any) {
    console.error('POST /api/groups/[groupId]/settlements/p2p-initiate error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد درخواست پرداخت مستقیم P2P', details: error.message },
      { status: 500 }
    );
  }
}
