"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatToman, toPersianDigits } from "@/lib/money";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Lock,
  ArrowRight,
} from "lucide-react";

function SandboxCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authority = searchParams.get("authority");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txData, setTxData] = useState<{
    authority: string;
    amount: string;
    status: string;
    plan: { title: string; durationDays: number; slug: string };
    userName: string;
    userPhone: string;
  } | null>(null);

  useEffect(() => {
    if (!authority) {
      setError("شناسه پرداخت (Authority) در آدرس یافت نشد.");
      setLoading(false);
      return;
    }

    const fetchTx = async () => {
      try {
        const res = await fetch(`/api/billing/sandbox/${authority}`);
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "خطا در دریافت اطلاعات تراکنش.");
        }
        const data = await res.json();
        setTxData(data);
      } catch (err: any) {
        setError(err.message || "خطا در برقراری ارتباط با سرور.");
      } finally {
        setLoading(false);
      }
    };

    fetchTx();
  }, [authority]);

  const handlePaySuccess = () => {
    if (!authority) return;
    router.push(`/app/payment/callback?Authority=${authority}&Status=OK`);
  };

  const handlePayCancel = () => {
    if (!authority) return;
    router.push(`/app/payment/callback?Authority=${authority}&Status=NOK`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500 font-medium">
          در حال انتقال امن به شبیه‌ساز درگاه بانکی...
        </span>
      </div>
    );
  }

  if (error || !txData) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 rounded-3xl bg-white border border-red-200 shadow-sm text-center space-y-4">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="font-black text-base text-slate-900">
          خطا در فراخوانی درگاه پرداخت
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || "اطلاعات تراکنش نامعتبر است."}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/app/billing")}
          className="text-xs"
        >
          بازگشت به صفحه اشتراک‌ها
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto my-4 space-y-4">
      {/* Sandbox Test Mode Alert */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 shadow-xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>محیط آزمایشی (Sandbox Simulator):</strong> این صفحه صرفاً جهت تست فرآیند خرید است و تراکنش بانکی واقعی انجام نمی‌شود.
        </span>
      </div>

      <Card className="shadow-lg border-slate-200 overflow-hidden rounded-3xl">
        {/* Bank Header Bar */}
        <div className="p-5 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="font-black text-sm text-white">
                درگاه پرداخت شاپرک / زرین‌پال
              </h2>
              <span className="text-[10px] text-emerald-200">
                پذیرنده: دنگ‌چی (سامانه دنگ‌بندی خانه)
              </span>
            </div>
          </div>

          <Badge variant="pro" size="sm" className="bg-white/20 text-white border-white/30 text-[10px]">
            اتصال امن SSL
          </Badge>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* Amount Display */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
            <span className="text-xs text-slate-500 font-medium">
              مبلغ قابل پرداخت
            </span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              {formatToman(BigInt(txData.amount))}{" "}
              <span className="text-xs font-normal text-slate-500">تومان</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-slate-600">
              <span>پلن درخواستی:</span>
              <span className="font-bold text-slate-900">
                {txData.plan.title} ({toPersianDigits(txData.plan.durationDays)} روزه)
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-slate-600">
              <span>خریدار:</span>
              <span className="font-bold text-slate-900">
                {txData.userName} ({toPersianDigits(txData.userPhone)})
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-slate-600">
              <span>شناسه خرید (Authority):</span>
              <span className="font-mono text-[11px] text-slate-600 select-all">
                {txData.authority}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 text-slate-600">
              <span>وضعیت تراکنش:</span>
              <Badge variant="warning" size="sm">
                در انتظار پرداخت
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 space-y-2.5">
            <Button
              variant="primary"
              size="lg"
              onClick={handlePaySuccess}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm"
              leftIcon={<CheckCircle2 className="w-5 h-5 ml-1.5" />}
            >
              پرداخت موفق و تکمیل خرید (شبیه‌سازی)
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handlePayCancel}
              className="w-full text-xs sm:text-sm text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold"
              leftIcon={<XCircle className="w-5 h-5 ml-1.5" />}
            >
              انصراف از پرداخت و بازگشت
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SandboxCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 font-medium">
            در حال بارگذاری شبیه‌ساز بانک...
          </span>
        </div>
      }
    >
      <SandboxCheckoutContent />
    </Suspense>
  );
}
