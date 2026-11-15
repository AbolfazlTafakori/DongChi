import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth-guard';
import { serializeBigInt } from '@/lib/serialize';
import { AuditAction } from '@prisma/client';
import {
  getP2pPaymentIntent,
  completeP2pPaymentIntent,
  failP2pPaymentIntent,
} from '@/lib/p2p-settlement-store';

export const dynamic = 'force-dynamic';

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const authority = searchParams.get('authority');
    if (!authority) {
      return NextResponse.json(
        { error: 'شناسه authority الزامی است.' },
        { status: 400 }
      );
    }

    const intent = getP2pPaymentIntent(authority);
    if (!intent || intent.groupId !== params.groupId) {
      return NextResponse.json(
        { error: 'تراکنش تسویه یافت نشد.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ intent });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات تراکنش', details: error.message },
      { status: 500 }
    );
  }
}

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
    const body = await request.json().catch(() => null);
    if (!body || !body.authority) {
      return NextResponse.json(
        { error: 'شناسه مرجع تراکنش (authority) الزامی است.' },
        { status: 400 }
      );
    }

    const authority = String(body.authority).trim();
    const status = String(body.status || 'OK').toUpperCase();

    const intent = getP2pPaymentIntent(authority);
    if (!intent || intent.groupId !== groupId) {
      return NextResponse.json(
        { error: 'تراکنش تسویه یافت نشد یا معتبر نیست.' },
        { status: 404 }
      );
    }

    // Idempotent check: if already completed, return success
    if (intent.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        refId: intent.refId,
        message: 'این تسویه قبلاً با موفقیت تکمیل شده است.',
      });
    }

    if (status !== 'OK') {
      failP2pPaymentIntent(authority);
      return NextResponse.json(
        { success: false, error: 'پرداخت آنلاین توسط کاربر لغو شد یا ناموفق بود.' },
        { status: 400 }
      );
    }

    // Process successful settlement
    const refId = `SHP-${Date.now().toString().slice(-8)}`;
    const amountBigInt = BigInt(intent.amount);

    const settlementResult = await prisma.$transaction(async (tx) => {
      const settlement = await tx.settlement.create({
        data: {
          groupId: intent.groupId,
          fromUserId: intent.fromUserId,
          toUserId: intent.toUserId,
          amount: amountBigInt,
          note: `تسویه مستقیم آنلاین از درگاه دنگ‌چی • کد رهگیری شاپرک: ${refId}`,
          settledAt: new Date(),
        },
        include: {
          fromUser: { select: { id: true, name: true, phone: true } },
          toUser: { select: { id: true, name: true, phone: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          groupId: intent.groupId,
          changedByUserId: session.userId,
          action: AuditAction.CREATE,
          newData: {
            action: 'SETTLEMENT',
            method: 'DIRECT_GATEWAY_P2P',
            refId,
            authority,
            fromUserId: intent.fromUserId,
            toUserId: intent.toUserId,
            amount: intent.amount,
          },
        },
      });

      return settlement;
    });

    completeP2pPaymentIntent(authority, refId);

    return NextResponse.json(
      serializeBigInt({
        success: true,
        refId,
        message: 'تسویه آنلاین با موفقیت انجام و در حسابداری گروه ثبت شد.',
        settlement: settlementResult,
      })
    );
  } catch (error: any) {
    console.error('POST /api/groups/[groupId]/settlements/p2p-verify error:', error);
    return NextResponse.json(
      { error: 'خطا در تایید تسویه مستقیم P2P', details: error.message },
      { status: 500 }
    );
  }
}
