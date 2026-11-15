"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toPersianDigits } from "@/lib/money";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Receipt,
  Calendar,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const authority = searchParams.get("Authority");
  const status = searchParams.get("Status");

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    alreadyVerified: boolean;
    refId?: string;
    expiresAt?: string;
    message?: string;
    subscription?: any;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    if (!authority) {
      setError("شناسه پرداخت (Authority) در درخواست بازگشتی یافت نشد.");
      setLoading(false);
      return;
    }

    const verifyTx = async () => {
      try {
        const res = await fetch("/api/billing/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authority,
            status: status || "NOK",
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "خطا در تأیید تراکنش.");
        }

        setResult(data);
      } catch (err: any) {
        setError(err.message || "خطا در ارتباط با سرور جهت تأیید تراکنش.");
      } finally {
        setLoading(false);
      }
    };

    verifyTx();
  }, [authority, status]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-slate-700">
          در حال استعلام و ثبت قطعی تراکنش بانکی...
        </span>
        <span className="text-xs text-slate-400">
          لطفاً چند لحظه صبر کنید و صفحه را نبندید.
        </span>
      </div>
    );
  }

  // Failure State
  if (error || (result && !result.success)) {
    return (
      <div className="max-w-md mx-auto my-12">
        <Card className="shadow-lg border-red-200 overflow-hidden rounded-3xl">
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <XCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">
                پرداخت ناموفق بود
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {result?.message || error || "تراکنش لغو شد یا با خطا مواجه گردید."}
              </p>
            </div>

            {authority && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono">
                شناسه پیگیری: {authority}
              </div>
            )}

            <div className="pt-2">
              <Link href="/app/billing" className="block w-full">
                <Button variant="primary" size="md" className="w-full text-xs font-bold">
                  بازگشت به صفحه اشتراک‌ها و تلاش مجدد
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Success State
  return (
    <div className="max-w-md mx-auto my-12">
      <Card className="shadow-xl border-emerald-200 overflow-hidden rounded-3xl">
        <div className="p-6 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900">
              پرداخت با موفقیت تأیید شد!
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              اشتراک حرفه‌ای دنگ‌چی با موفقیت برای شما فعال گردید.
            </p>
          </div>

          {result?.alreadyVerified && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                این تراکنش قبلاً تأیید و ثبت شده است (سیستم ضدتکرار فعال).
              </span>
            </div>
          )}

          {/* Receipt Info Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2.5">
            {result?.refId && (
              <div className="flex items-center justify-between text-slate-600">
                <span>کد رهگیری بانکی (RefID):</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {toPersianDigits(result.refId)}
                </span>
              </div>
            )}

            {result?.expiresAt && (
              <div className="flex items-center justify-between text-slate-600">
                <span>تاریخ انقضای جدید اشتراک:</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {new Date(result.expiresAt).toLocaleDateString("fa-IR")}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-600">
              <span>وضعیت دسترسی:</span>
              <Badge variant="credit" size="sm">
                حرفه‌ای (دنگ‌چی Pro)
              </Badge>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 text-right">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              قانون طلایی خانه فعال شد: اکنون تمام هم‌خانه‌های شما نیز به امکانات پیشرفته دسترسی دارند!
            </span>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link href="/app" className="w-full">
              <Button
                variant="primary"
                size="lg"
                className="w-full text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                ورود به سامانه و شروع کار
              </Button>
            </Link>

            <Link href="/app/billing" className="w-full">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-slate-600"
              >
                مشاهده جزئیات اشتراک
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-700">
            در حال بارگذاری اطلاعات درگاه...
          </span>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
