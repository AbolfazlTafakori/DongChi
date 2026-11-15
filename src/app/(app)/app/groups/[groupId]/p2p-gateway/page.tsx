'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  Zap,
  Building2,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { toPersianDigits, formatSheba } from '@/lib/money';
import { useToast } from '@/components/ui/Toast';

export default function P2pGatewayPage({
  params,
}: {
  params: { groupId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authority = searchParams?.get('authority') || '';
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [intent, setIntent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authority) {
      setError('شناسه تراکنش نامعتبر است.');
      setLoading(false);
      return;
    }

    fetch(`/api/groups/${params.groupId}/settlements/p2p-verify?authority=${encodeURIComponent(authority)}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'تراکنش یافت نشد.');
        }
        return res.json();
      })
      .then((data) => {
        setIntent(data.intent);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'خطا در بارگذاری اطلاعات درگاه');
        setLoading(false);
      });
  }, [authority, params.groupId]);

  const handlePay = async () => {
    if (!authority || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/groups/${params.groupId}/settlements/p2p-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authority, status: 'OK' }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در تکمیل پرداخت');
      }

      toast.success(`پرداخت با موفقیت انجام شد! کد پیگیری شاپرک: ${toPersianDigits(data.refId)}`);
      window.dispatchEvent(new CustomEvent('dongchi:data-synced'));

      // Redirect back to group page
      router.push(`/app/groups/${params.groupId}`);
    } catch (err: any) {
      toast.error(err.message || 'خطا در انجام پرداخت');
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (authority) {
      fetch(`/api/groups/${params.groupId}/settlements/p2p-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authority, status: 'NOK' }),
      }).catch(() => {});
    }
    router.push(`/app/groups/${params.groupId}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-sm font-bold text-slate-600">
          در حال اتصال به درگاه پرداخت هوشمند دنگ‌چی (شاپرک)...
        </span>
      </div>
    );
  }

  if (error || !intent) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-3xl bg-white border border-rose-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-extrabold text-slate-900">خطا در فرآیند پرداخت</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{error || 'تراکنش نامعتبر است.'}</p>
        <Link
          href={`/app/groups/${params.groupId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به گروه</span>
        </Link>
      </div>
    );
  }

  const amountToman = toPersianDigits(Number(intent.amount).toLocaleString('en-US'));
  const commissionToman = toPersianDigits(Number(intent.commissionAmount || '0').toLocaleString('en-US'));
  const totalToman = toPersianDigits(Number(intent.totalPayable || intent.amount).toLocaleString('en-US'));

  return (
    <div className="max-w-lg mx-auto py-6 px-4 space-y-6" dir="rtl">
      {/* Header Security Badge */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>درگاه پرداخت مستقیم شاپرک • تسویه آنی P2P دنگ‌چی</span>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-emerald-700">
          <Lock className="w-3 h-3" />
          امن و رمزنگاری‌شده
        </span>
      </div>

      {/* Main Payment Checkout Card */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Card Header */}
        <div className="p-6 bg-gradient-to-l from-slate-900 via-slate-850 to-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              تسویه مستقیم طلبکار (فاز ۲ فین‌تک)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono text-[10px]">
              {intent.authority.slice(0, 16)}...
            </span>
          </div>

          <div className="pt-2">
            <span className="text-xs text-slate-300 block">مبلغ قابل پرداخت:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight">
                {totalToman}
              </span>
              <span className="text-sm font-bold text-emerald-400">تومان</span>
            </div>
          </div>
        </div>

        {/* Breakdown Items */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-slate-500 font-bold">دریافت‌کننده (طلبکار):</span>
            <span className="font-extrabold text-slate-900">{intent.creditorName}</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-slate-500 font-bold">حساب مقصد:</span>
            <span className="font-mono font-bold text-slate-800" dir="ltr">
              {intent.creditorSheba
                ? formatSheba(intent.creditorSheba)
                : 'IR•• •••• •••• •••• •••• •••• ••'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-slate-500 font-bold">اصل بدهی محاسبه‌شده:</span>
            <span className="font-extrabold text-slate-900 tabular-nums">
              {amountToman} تومان
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-slate-500 font-bold">کارمزد زیرساخت شاپرک:</span>
            <span className="font-bold text-slate-600 tabular-nums">
              {Number(intent.commissionAmount) > 0 ? `${commissionToman} تومان` : 'رایگان (۰ تومان)'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>تسویه خودکار پس از پرداخت:</span>
            </div>
            <p>
              به محض تکمیل تراکنش، این مبلغ مستقیماً به تراز حسابداری گروه منتقل شده و بدهی شما به{' '}
              {intent.creditorName} فوراً صفر می‌شود.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-50/60 border-t border-slate-100 space-y-3">
          <button
            type="button"
            onClick={handlePay}
            disabled={submitting}
            className="w-full h-12 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال ثبت تسویه در شاپرک...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ تکمیل پرداخت و تسویه آنی بدهی</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="w-full h-11 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
          >
            ✕ انصراف و بازگشت به گروه
          </button>
        </div>
      </div>
    </div>
  );
}
