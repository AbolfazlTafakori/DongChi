"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { formatToman, toPersianDigits } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  Crown,
  Sparkles,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Users,
  Check,
  Zap,
  Receipt,
  Wallet,
  Gem,
  ArrowLeft,
} from "lucide-react";

interface Plan {
  id: string;
  title: string;
  slug: string;
  price: string;
  durationDays: number;
  features: string[];
  isActive: boolean;
}

interface Transaction {
  id: string;
  amount: string;
  authority: string;
  refId: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
  plan: {
    title: string;
    slug: string;
  };
}

interface SubscriptionStatus {
  isPro: boolean;
  activeSubscription: {
    id: string;
    startsAt: string;
    expiresAt: string;
    plan: {
      id: string;
      title: string;
      slug: string;
      price: string;
      durationDays: number;
    };
  } | null;
  remainingDays: number;
}

function formatCleanToman(num: number): string {
  return toPersianDigits(Math.round(num).toLocaleString("en-US"));
}

function roundToNearest500(num: number): number {
  return Math.max(500, Math.round(num / 500) * 500);
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const targetPlanId = searchParams?.get("plan");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [billingCycle, setBillingCycle] = useState<"ANNUAL" | "MONTHLY">("ANNUAL");

  const fetchBillingStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/billing/status");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "خطا در دریافت وضعیت اشتراک.");
      }

      const data = await res.json();
      setStatus(data.subscriptionStatus);
      setPlans(data.plans || []);
      setTransactions(data.transactions || []);
    } catch (err: any) {
      setError(err.message || "خطای ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  useEffect(() => {
    if (!targetPlanId || plans.length === 0) return;
    const found = plans.find((p) => p.id === targetPlanId);
    if (found) {
      if (found.durationDays <= 35) {
        setBillingCycle("MONTHLY");
      } else {
        setBillingCycle("ANNUAL");
      }
    }
  }, [targetPlanId, plans]);

  const handleCheckout = async (planId: string) => {
    try {
      setPurchasingPlanId(planId);
      setCheckoutError(null);

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در برقراری ارتباط با درگاه پرداخت.");
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (err: any) {
      setCheckoutError(err.message || "خطا در خرید اشتراک.");
      setPurchasingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // Identify Golden Pro and VIP Max plans
  const proMonthly = plans.find((p) => p.title.includes("پرو") && p.durationDays <= 35) || {
    id: "pro-monthly",
    title: "پرو طلایی (ماهانه)",
    slug: "pro-monthly",
    price: "49000",
    durationDays: 30,
    features: [],
    isActive: true,
  };
  const proAnnual = plans.find((p) => p.title.includes("پرو") && p.durationDays >= 300) || {
    id: "pro-annual",
    title: "پرو طلایی (سالانه)",
    slug: "pro-yearly",
    price: "490000",
    durationDays: 365,
    features: [],
    isActive: true,
  };
  const maxMonthly = plans.find((p) => p.title.includes("مکس") && p.durationDays <= 35) || {
    id: "max-monthly",
    title: "مکس VIP (ماهانه)",
    slug: "max-monthly",
    price: "89000",
    durationDays: 30,
    features: [],
    isActive: true,
  };
  const maxAnnual = plans.find((p) => p.title.includes("مکس") && p.durationDays >= 300) || {
    id: "max-annual",
    title: "مکس VIP (سالانه)",
    slug: "max-yearly",
    price: "890000",
    durationDays: 365,
    features: [],
    isActive: true,
  };

  const activeProPlan = billingCycle === "ANNUAL" ? proAnnual : proMonthly;
  const activeMaxPlan = billingCycle === "ANNUAL" ? maxAnnual : maxMonthly;

  const proPriceNum = Number(activeProPlan.price) || (billingCycle === "ANNUAL" ? 490000 : 49000);
  const maxPriceNum = Number(activeMaxPlan.price) || (billingCycle === "ANNUAL" ? 890000 : 89000);

  const proMonthlyEquivalent =
    billingCycle === "ANNUAL" ? roundToNearest500(proPriceNum / 12) : proPriceNum;
  const maxMonthlyEquivalent =
    billingCycle === "ANNUAL" ? roundToNearest500(maxPriceNum / 12) : maxPriceNum;

  const isProHighlighted = targetPlanId === activeProPlan.id;
  const isMaxHighlighted = targetPlanId === activeMaxPlan.id;

  return (
    <div className="space-y-8 pb-12">
      {checkoutError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{checkoutError}</span>
        </div>
      )}

      {/* 1. Top Current Subscription Summary Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
        {/* Top Row: Current Plan Identity & Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                status?.isPro
                  ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-sm"
                  : "bg-emerald-50 border border-emerald-200/80 text-emerald-600"
              )}
            >
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {status?.isPro
                    ? `پلن فعال: ${status.activeSubscription?.plan?.title || "اشتراک ویژه"}`
                    : "پلن فعلی: پایه و رایگان"}
                </h2>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-bold",
                    status?.isPro
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  )}
                >
                  {status?.isPro
                    ? `فعال • ${toPersianDigits(String(status.remainingDays ?? 0))} روز باقیمانده`
                    : "محدود به ۲ گروه و ۱ صندوق"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {status?.isPro
                  ? "تمامی امکانات پیشرفته برای شما و اعضای تمام گروه‌های تحت مدیریت شما فعال است."
                  : "با تهیه اشتراک، علاوه بر شما، تمام هم‌خانه‌های گروه نیز بدون هزینه به امکانات ویژه دسترسی دارند."}
              </p>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs font-bold inline-flex items-center gap-2 shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>تمدید تجمعی روزها بدون سوختن اعتبار قبلی</span>
          </div>
        </div>

        {/* Bottom Row: 3 Equal-Height Symmetrical Feature/Quota Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">سقف گروه‌های فعال</span>
              <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
                {status?.isPro ? "مدیریت تا ۱۰ گروه یا نامحدود" : "حداکثر ۲ گروه همزمان"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">صندوق مشترک و کارت خانه</span>
              <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
                {status?.isPro ? "کارت‌های بانکی چندگانه" : "۱ کارت در هر گروه"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-800 block">قانون طلایی خانه (Group Halo)</span>
              <span className="text-xs font-bold text-amber-950 mt-0.5 block">
                اشتراک ۱ نفر کل اعضای گروه را ارتقا می‌دهد
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Monthly / Annual Segmented Switcher */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              انتخاب و ارتقای سطح اشتراک
            </h3>
          </div>

          <div className="p-1 rounded-2xl bg-slate-200/70 border border-slate-200/90 inline-flex items-center gap-1 shadow-inner self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBillingCycle("MONTHLY")}
              className={`h-9 px-4 rounded-xl text-xs font-extrabold transition-all ${
                billingCycle === "MONTHLY"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              پرداخت ماهانه
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle("ANNUAL")}
              className={`h-9 px-4 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition-all ${
                billingCycle === "ANNUAL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <span>پرداخت سالانه</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-gradient-to-l from-amber-400 to-yellow-300 text-slate-950">
                ۲ ماه رایگان
              </span>
            </button>
          </div>
        </div>

        {/* 2 Plans Side-by-Side: Golden Pro (Right) and VIP Max (Left) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: پلن پرو طلایی (Golden Pro) */}
          <div
            id="plan-pro"
            className={cn(
              "p-1.5 rounded-[28px] transition-all flex",
              isProHighlighted
                ? "ring-4 ring-amber-400/50"
                : "bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 shadow-lg"
            )}
          >
            <div className="bg-gradient-to-b from-amber-50/40 via-white to-white rounded-[22px] p-6 sm:p-7 flex flex-col justify-between w-full relative overflow-hidden">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-amber-200/70">
                  <div>
                    <span className="text-[11px] font-extrabold text-amber-700 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span>سطح ۲ • محبوب‌ترین انتخاب</span>
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {activeProPlan.title}
                    </h2>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-gradient-to-l from-amber-500 to-yellow-500 text-slate-950 text-[11px] font-extrabold shadow-2xs shrink-0">
                    پیشنهاد ویژه خانه
                  </span>
                </div>

                {/* Price */}
                <div className="py-5 border-b border-amber-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                      {formatCleanToman(proPriceNum)}
                    </span>
                    <span className="text-xs font-extrabold text-amber-800">
                      تومان / {billingCycle === "ANNUAL" ? "سالانه" : "ماهانه"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-amber-700 mt-2 tabular-nums">
                    {billingCycle === "ANNUAL"
                      ? `معادل ماهانه ${formatCleanToman(proMonthlyEquivalent)} تومان (۲ ماه کاملاً رایگان)`
                      : "قابل تمدید ماهانه یا ارتقا به سالانه در هر زمان"}
                  </p>
                </div>

                {/* Halo Callout */}
                <div className="my-5 p-3.5 rounded-2xl bg-gradient-to-l from-amber-50 to-yellow-50/70 border border-amber-300/80">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-950">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>قانون طلایی خانه فعال است:</span>
                  </div>
                  <p className="text-xs text-amber-900 mt-1">
                    خرید شما تمام اعضای گروهتان را بدون هزینه اضافه Pro می‌کند
                  </p>
                </div>

                {/* Bullet List */}
                <ul className="space-y-3 text-xs mb-8">
                  <li className="flex items-center gap-2.5 text-slate-900 font-bold whitespace-nowrap">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>ساخت و مدیریت تا ۱۰ گروه فعال همزمان</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-900 font-bold whitespace-nowrap">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>تعریف تا ۵ کارت صندوق مشترک در هر گروه</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-900 font-bold whitespace-nowrap">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>خروجی فایل اکسل استاندارد فارسی (CSV)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-900 font-bold whitespace-nowrap">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>پوشش رایگان امکانات Pro برای کل هم‌خانه‌ها</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-900 font-bold whitespace-nowrap">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>پشتیبانی اولویت‌دار طلایی در تمام روزهای هفته</span>
                  </li>
                </ul>
              </div>

              {/* CTA Button */}
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={() => handleCheckout(activeProPlan.id)}
                isLoading={purchasingPlanId === activeProPlan.id}
                className="w-full h-12 rounded-xl bg-gradient-to-l from-amber-500 via-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm shadow-md transition-all"
                leftIcon={<Crown className="w-4 h-4 ml-1.5" />}
              >
                {billingCycle === "ANNUAL"
                  ? "خرید پرو طلایی سالانه (با تخفیف)"
                  : "خرید و فعال‌سازی پرو طلایی ماهانه"}
              </Button>
            </div>
          </div>

          {/* Card 2: پلن مکس (DongChi Max VIP) */}
          <div
            id="plan-max"
            className={cn(
              "p-1.5 rounded-[28px] transition-all flex",
              isMaxHighlighted
                ? "ring-4 ring-emerald-400/50"
                : "bg-gradient-to-b from-indigo-500 via-slate-800 to-emerald-500 shadow-lg"
            )}
          >
            <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white rounded-[22px] p-6 sm:p-7 flex flex-col justify-between w-full relative overflow-hidden">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
                  <div>
                    <span className="text-[11px] font-extrabold text-indigo-300 flex items-center gap-1">
                      <Gem className="w-3.5 h-3.5 text-indigo-400" />
                      <span>سطح ۳ • حداکثر قدرت</span>
                    </span>
                    <h2 className="text-xl font-extrabold text-white mt-0.5">
                      {activeMaxPlan.title}
                    </h2>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 text-[11px] font-extrabold shrink-0">
                    نامحدود مطلق
                  </span>
                </div>

                {/* Price */}
                <div className="py-5 border-b border-white/10">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight">
                      {formatCleanToman(maxPriceNum)}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      تومان / {billingCycle === "ANNUAL" ? "سالانه" : "ماهانه"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-400 mt-2 tabular-nums">
                    {billingCycle === "ANNUAL"
                      ? `معادل ماهانه ${formatCleanToman(maxMonthlyEquivalent)} تومان (بیشترین صرفه‌جویی VIP)`
                      : "مخصوص مدیران ساختمان، خوابگاه‌ها و چندخانه‌ها"}
                  </p>
                </div>

                {/* VIP Box */}
                <div className="my-5 p-3.5 rounded-2xl bg-white/[0.06] border border-white/15">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-300">
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>پوشش فراگیر تمام گروه‌های شما:</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    گروه‌ها، صندوق‌های بانکی و آرشیو مالی کاملاً نامحدود
                  </p>
                </div>

                {/* Bullet List */}
                <ul className="space-y-3 text-xs mb-8">
                  <li className="flex items-center gap-2.5 text-slate-100 font-semibold whitespace-nowrap">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>ساخت و مدیریت تعداد نامحدود گروه و ساختمان</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-100 font-semibold whitespace-nowrap">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>تعریف تعداد نامحدود کارت و صندوق مشترک</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-100 font-semibold whitespace-nowrap">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>آرشیو دائمی و نامحدود تمام دوره‌های مالی</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-100 font-semibold whitespace-nowrap">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>قانون طلایی فعال برای تمام گروه‌های تحت مدیریت</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-100 font-semibold whitespace-nowrap">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>پشتیبانی اختصاصی VIP و اولویت امکانات جدید</span>
                  </li>
                </ul>
              </div>

              {/* CTA Button */}
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={() => handleCheckout(activeMaxPlan.id)}
                isLoading={purchasingPlanId === activeMaxPlan.id}
                className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all"
                leftIcon={<Gem className="w-4 h-4 ml-1.5" />}
              >
                {billingCycle === "ANNUAL"
                  ? "خرید مکس VIP سالانه (نامحدود)"
                  : "خرید و فعال‌سازی مکس VIP ماهانه"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Clean Transactions History Card */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                تاریخچه تراکنش‌ها و صورتحساب‌ها
              </h3>
              <p className="text-[11px] text-slate-400">
                سوابق پرداخت‌ها و کدهای رهگیری شاپرک
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full tabular-nums">
            {toPersianDigits(transactions.length)} تراکنش
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-2 border border-slate-100">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">
              هنوز تراکنش بانکی ثبت نشده است
            </h4>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
              پس از خرید هر یک از پلن‌های بالا، رسید رسمی پرداخت و کد رهگیری بانکی در این جدول ثبت و قابل پیگیری خواهد بود.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3 font-semibold">تاریخ پرداخت</th>
                  <th className="py-2.5 px-3 font-semibold">پلن خریداری‌شده</th>
                  <th className="py-2.5 px-3 font-semibold">مبلغ</th>
                  <th className="py-2.5 px-3 font-semibold">کد رهگیری شاپرک</th>
                  <th className="py-2.5 px-3 font-semibold text-center">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-600 tabular-nums">
                      {toPersianDigits(new Date(tx.createdAt).toLocaleDateString("fa-IR"))}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {tx.plan?.title || "اشتراک دنگ‌چی"}
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900 tabular-nums">
                      {formatToman(BigInt(tx.amount))}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 tabular-nums" dir="ltr">
                      {tx.refId ? toPersianDigits(tx.refId) : "—"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block",
                          tx.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : tx.status === "FAILED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        )}
                      >
                        {tx.status === "SUCCESS"
                          ? "موفق"
                          : tx.status === "FAILED"
                          ? "ناموفق"
                          : "در انتظار"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
