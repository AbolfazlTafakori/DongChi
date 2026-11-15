'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Crown,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Users,
  Wallet,
  Scale,
  ArrowLeft,
  Calculator,
  Gem,
  Zap,
} from 'lucide-react';
import { toPersianDigits } from '@/lib/money';

export interface PricingPlanItem {
  id: string;
  title: string;
  price: string;
  durationDays: number;
}

interface PricingViewProps {
  plans: PricingPlanItem[];
  isAuthenticated?: boolean;
  isLoggedIn?: boolean;
}

function formatCleanToman(num: number): string {
  return toPersianDigits(Math.round(num).toLocaleString('en-US'));
}

function roundToNearest500(num: number): number {
  return Math.max(500, Math.round(num / 500) * 500);
}

export function PricingView({ plans, isAuthenticated, isLoggedIn }: PricingViewProps) {
  const [billingCycle, setBillingCycle] = useState<'ANNUAL' | 'MONTHLY'>('ANNUAL');
  const [housematesCount, setHousematesCount] = useState<number>(4);

  const isUserAuthed = Boolean(isAuthenticated ?? isLoggedIn);

  // Match Pro & Max plans from DB or fallback cleanly
  const proMonthly = plans.find((p) => p.title.includes('پرو') && p.durationDays <= 35) || {
    id: 'pro-monthly',
    title: 'پرو طلایی (ماهانه)',
    price: '49000',
    durationDays: 30,
  };
  const proAnnual = plans.find((p) => p.title.includes('پرو') && p.durationDays >= 300) || {
    id: 'pro-annual',
    title: 'پرو طلایی (سالانه)',
    price: '490000',
    durationDays: 365,
  };
  const maxMonthly = plans.find((p) => p.title.includes('مکس') && p.durationDays <= 35) || {
    id: 'max-monthly',
    title: 'مکس VIP (ماهانه)',
    price: '89000',
    durationDays: 30,
  };
  const maxAnnual = plans.find((p) => p.title.includes('مکس') && p.durationDays >= 300) || {
    id: 'max-annual',
    title: 'مکس VIP (سالانه)',
    price: '890000',
    durationDays: 365,
  };

  const activeProPlan = billingCycle === 'ANNUAL' ? proAnnual : proMonthly;
  const activeMaxPlan = billingCycle === 'ANNUAL' ? maxAnnual : maxMonthly;

  const proPriceNum = Number(activeProPlan.price) || (billingCycle === 'ANNUAL' ? 490000 : 49000);
  const maxPriceNum = Number(activeMaxPlan.price) || (billingCycle === 'ANNUAL' ? 890000 : 89000);

  const proMonthlyEquivalent =
    billingCycle === 'ANNUAL' ? roundToNearest500(proPriceNum / 12) : proPriceNum;
  const maxMonthlyEquivalent =
    billingCycle === 'ANNUAL' ? roundToNearest500(maxPriceNum / 12) : maxPriceNum;

  const proPerPersonMonthly = roundToNearest500(proMonthlyEquivalent / Math.max(1, housematesCount));

  const freeHref = isUserAuthed ? '/app' : '/login';
  const proCheckoutHref = isUserAuthed
    ? `/app/billing?plan=${encodeURIComponent(activeProPlan.id)}`
    : '/login?from=%2Fapp%2Fbilling';
  const maxCheckoutHref = isUserAuthed
    ? `/app/billing?plan=${encodeURIComponent(activeMaxPlan.id)}`
    : '/login?from=%2Fapp%2Fbilling';

  const matrixRows = [
    {
      title: 'ساخت و عضویت در گروه‌های همزمان',
      desc: 'مدیریت حساب خانه، سفر و جمع‌های دوستانه',
      free: 'حداکثر ۲ گروه',
      pro: 'تا ۱۰ گروه فعال',
      max: 'کاملاً نامحدود',
    },
    {
      title: 'صندوق مشترک و کارت بانکی خانه',
      desc: 'تعریف کارت بانکی مشترک و کسر خودکار خریدها',
      free: '۱ کارت در هر گروه',
      pro: 'تا ۵ کارت در هر گروه',
      max: 'نامحدود کارت بانکی',
    },
    {
      title: 'موتور دنگ‌بندی ۴ حالته و ساده‌سازی بدهی',
      desc: 'تقسیم مساوی، دقیق، درصدی و سهمیه‌ای بدون خطا',
      free: true,
      pro: true,
      max: true,
    },
    {
      title: 'قانون طلایی خانه (پوشش کل هم‌خانه‌ها)',
      desc: 'با خرید ۱ نفر، تمام اعضای گروه ارتقا می‌یابند',
      free: false,
      pro: 'فعال برای کل گروه',
      max: 'فعال برای تمام گروه‌ها',
    },
    {
      title: 'خروجی اکسل فارسی (CSV استاندارد)',
      desc: 'دانلود گزارش کامل فاکتورها و سهم اعضا',
      free: false,
      pro: true,
      max: true,
    },
    {
      title: 'بودجه‌بندی دسته‌ها و هشدار سرعت خرج',
      desc: 'پیش‌بینی هوشمند اتمام بودجه پیش از پایان ماه',
      free: 'دسته‌های پیش‌فرض',
      pro: 'پیشرفته + هشدار زنده',
      max: 'تحلیل چنددوره‌ای VIP',
    },
    {
      title: 'تاریخچه تغییرات (Audit Log) و قفل ماهانه',
      desc: 'ثبت مقادیر قبل و بعد از ویرایش و بستن حساب ماه',
      free: '۳۰ روز اخیر',
      pro: 'آرشیو ۱ ساله کامل',
      max: 'آرشیو دائمی بدون محدودیت',
    },
    {
      title: 'سطح پشتیبانی و رسیدگی به حساب‌ها',
      desc: 'پاسخگویی به سوالات و راهنمایی تنظیمات مالی',
      free: 'پشتیبانی عادی',
      pro: 'پشتیبانی اولویت‌دار طلایی',
      max: 'پشتیبانی اختصاصی VIP',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-14">
      {/* 1. TOP HEADER & BILLING CYCLE SWITCHER */}
      <div className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200/90 text-amber-900 text-xs font-extrabold shadow-2xs">
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            <span>تعرفه‌های شفاف دنگ‌چی • ۱ اشتراک برای تمام اعضای خانه</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 tracking-tight leading-[1.35]">
            پلن مناسب خانه و جمع خود را انتخاب کنید
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-[1.85] max-w-2xl mx-auto">
            با فعال‌سازی اشتراک <strong className="text-amber-600 font-extrabold">پرو طلایی</strong> یا{' '}
            <strong className="text-indigo-600 font-extrabold">مکس VIP</strong> توسط یک نفر، تمام اعضای
            آن گروه بدون پرداخت هزینه اضافه به امکانات ویژه دسترسی خواهند داشت.
          </p>

          {/* Segmented Cycle Switcher */}
          <div className="pt-1 flex justify-center">
            <div className="p-1.5 rounded-2xl bg-slate-200/70 border border-slate-200/90 inline-flex items-center gap-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => setBillingCycle('MONTHLY')}
                className={`h-10 px-6 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                پرداخت ماهانه
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('ANNUAL')}
                className={`h-10 px-6 rounded-xl text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 whitespace-nowrap transition-all ${
                  billingCycle === 'ANNUAL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <span>پرداخت سالانه</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-gradient-to-l from-amber-400 to-yellow-300 text-slate-950">
                  ۲ ماه رایگان
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* FULL-WIDTH 3-ZONE ARCHITECTURAL HOUSEMATE COST SPLITTER BAR */}
        <div className="p-1.5 rounded-[26px] bg-slate-200/60 border border-slate-200/90 shadow-2xs">
          <div className="bg-white rounded-[20px] border border-slate-200/90 p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 items-center gap-5">
            {/* Zone 1 (Right - 4 cols): Calculator Identity */}
            <div className="lg:col-span-4 flex items-center gap-3.5 text-right border-b lg:border-b-0 lg:border-l border-slate-100 pb-4 lg:pb-0 lg:pl-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 whitespace-nowrap">
                    محاسبه‌گر دنگ اشتراک بین هم‌خانه‌ها
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  چون ۱ اشتراک کل گروه را پوشش می‌دهد، هزینه بین اعضا تقسیم می‌شود:
                </p>
              </div>
            </div>

            {/* Zone 2 (Center - 4 cols): Interactive Member Count Selector */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-2 border-b lg:border-b-0 lg:border-l border-slate-100 pb-4 lg:pb-0 lg:px-4">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                تعداد اعضای خانه یا گروه شما:
              </span>
              <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                {[2, 3, 4, 5, 6, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setHousematesCount(n)}
                    className={`h-8 px-2.5 rounded-lg text-xs font-extrabold tabular-nums whitespace-nowrap transition-all ${
                      housematesCount === n
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {toPersianDigits(String(n))} نفر
                  </button>
                ))}
              </div>
            </div>

            {/* Zone 3 (Left - 4 cols): Live Per-Person Output for Both Pro & Max */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              {/* Pro Per-Person Pill */}
              <div className="p-3 rounded-xl bg-gradient-to-b from-amber-50/90 to-amber-50/40 border border-amber-200/90 text-right flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-extrabold text-amber-800 whitespace-nowrap">
                    سهم هر نفر در پرو طلایی
                  </span>
                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
                    {formatCleanToman(proPerPersonMonthly)}
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 whitespace-nowrap">
                    تومان / ماه
                  </span>
                </div>
              </div>

              {/* Max Per-Person Pill */}
              <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800 text-right flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-extrabold text-emerald-300 whitespace-nowrap">
                    سهم هر نفر در مکس VIP
                  </span>
                  <Gem className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-extrabold text-white tabular-nums whitespace-nowrap">
                    {formatCleanToman(roundToNearest500(maxMonthlyEquivalent / housematesCount))}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                    تومان / ماه
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 3-TIER CARDS: BASIC (RIGHT) | GOLDEN PRO (CENTER SPOTLIGHT) | VIP MAX (LEFT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch pt-2">
        {/* TIER 1 (RIGHT): BASIC FREE */}
        <div className="p-1.5 rounded-[28px] bg-slate-200/60 border border-slate-200/90 flex">
          <div className="bg-white rounded-[22px] border border-slate-200/90 p-6 sm:p-7 flex flex-col justify-between w-full shadow-2xs">
            <div>
              {/* Top Tier Badge & Title */}
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 block">سطح ۱ • شروع آسان</span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">پلن پایه رایگان</h2>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold shrink-0">
                  همیشگی
                </span>
              </div>

              {/* Price Zone */}
              <div className="py-5 border-b border-slate-100">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">رایگان</span>
                  <span className="text-xs font-bold text-slate-400">/ بدون محدودیت زمانی</span>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-2">
                  مناسب خانه‌های کوچک و تست تمام امکانات پایه
                </p>
              </div>

              {/* Quota Highlight Box */}
              <div className="my-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                  <Users className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>سهمیه حساب پایه:</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  حداکثر ۲ گروه فعال و ۱ صندوق مشترک در هر گروه
                </p>
              </div>

              {/* Concise Single-Line Feature Bullets */}
              <ul className="space-y-3 text-xs">
                <li className="flex items-center gap-2.5 text-slate-700 font-semibold whitespace-nowrap">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>ساخت و عضویت تا ۲ گروه همزمان</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-700 font-semibold whitespace-nowrap">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>۱ کارت صندوق مشترک در هر گروه</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-700 font-semibold whitespace-nowrap">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>ثبت نامحدود خرج و دنگ‌بندی ۴ حالته</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-700 font-semibold whitespace-nowrap">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>الگوریتم ساده‌سازی بدهی‌ها و تسویه آنی</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-400 whitespace-nowrap">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </span>
                  <span className="line-through">خروجی فایل اکسل فارسی (CSV)</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-400 whitespace-nowrap">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </span>
                  <span className="line-through">قانون طلایی پوشش رایگان هم‌خانه‌ها</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs sm:text-sm font-extrabold inline-flex items-center justify-center transition-all"
                href={freeHref}
              >
                {isUserAuthed ? 'ورود به پیشخوان رایگان' : 'شروع رایگان همیشگی'}
              </Link>
            </div>
          </div>
        </div>

        {/* TIER 2 (CENTER SPOTLIGHT): GOLDEN PRO (پرو طلایی) */}
        <div className="p-1.5 rounded-[28px] bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 shadow-xl relative flex lg:-translate-y-2 transition-all">
          <div className="bg-gradient-to-b from-amber-50/40 via-white to-white rounded-[22px] p-6 sm:p-7 flex flex-col justify-between w-full relative overflow-hidden">
            <div>
              {/* Top Tier Badge & Title */}
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-amber-200/70">
                <div>
                  <span className="text-[11px] font-extrabold text-amber-700 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>سطح ۲ • محبوب‌ترین انتخاب</span>
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">پلن پرو طلایی (Pro)</h2>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-gradient-to-l from-amber-500 to-yellow-500 text-slate-950 text-[11px] font-extrabold shadow-2xs shrink-0">
                  پیشنهاد ویژه خانه
                </span>
              </div>

              {/* Dynamic Price Zone */}
              <div className="py-5 border-b border-amber-100">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                    {formatCleanToman(proPriceNum)}
                  </span>
                  <span className="text-xs font-extrabold text-amber-800">
                    تومان / {billingCycle === 'ANNUAL' ? 'سالانه' : 'ماهانه'}
                  </span>
                </div>
                <p className="text-xs font-bold text-amber-700 mt-2 tabular-nums">
                  {billingCycle === 'ANNUAL'
                    ? `معادل ماهانه ${formatCleanToman(proMonthlyEquivalent)} تومان (۲ ماه کاملاً رایگان)`
                    : 'قابل تمدید ماهانه یا ارتقا به سالانه در هر زمان'}
                </p>
              </div>

              {/* Golden Group Halo Box */}
              <div className="my-5 p-3.5 rounded-2xl bg-gradient-to-l from-amber-50 to-yellow-50/70 border border-amber-300/80">
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>قانون طلایی خانه فعال است:</span>
                </div>
                <p className="text-xs text-amber-900 mt-1">
                  خرید شما تمام اعضای گروهتان را بدون هزینه اضافه Pro می‌کند
                </p>
              </div>

              {/* Concise Single-Line Feature Bullets */}
              <ul className="space-y-3 text-xs">
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
                  <span>بودجه‌بندی هوشمند و هشدار سرعت خرج ماهانه</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-900 font-bold whitespace-nowrap">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>پشتیبانی اولویت‌دار طلایی در تمام روزهای هفته</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-amber-200/60">
              <Link
                className="w-full h-11 rounded-xl bg-gradient-to-l from-amber-500 via-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-md transition-all"
                href={proCheckoutHref}
              >
                <Crown className="w-4 h-4 shrink-0" />
                <span>
                  {billingCycle === 'ANNUAL'
                    ? 'خرید پرو طلایی سالانه'
                    : 'خرید پرو طلایی ماهانه'}
                </span>
                <ArrowLeft className="w-4 h-4 shrink-0" />
              </Link>
            </div>
          </div>
        </div>

        {/* TIER 3 (LEFT): DONGCHI MAX VIP (مکس) */}
        <div className="p-1.5 rounded-[28px] bg-gradient-to-b from-indigo-500 via-slate-800 to-emerald-500 shadow-lg flex">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white rounded-[22px] p-6 sm:p-7 flex flex-col justify-between w-full relative overflow-hidden">
            <div>
              {/* Top Tier Badge & Title */}
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
                <div>
                  <span className="text-[11px] font-extrabold text-indigo-300 flex items-center gap-1">
                    <Gem className="w-3.5 h-3.5 text-indigo-400" />
                    <span>سطح ۳ • حداکثر قدرت</span>
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-0.5">پلن مکس (Max VIP)</h2>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 text-[11px] font-extrabold shrink-0">
                  نامحدود مطلق
                </span>
              </div>

              {/* Dynamic Price Zone */}
              <div className="py-5 border-b border-white/10">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight">
                    {formatCleanToman(maxPriceNum)}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    تومان / {billingCycle === 'ANNUAL' ? 'سالانه' : 'ماهانه'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-400 mt-2 tabular-nums">
                  {billingCycle === 'ANNUAL'
                    ? `معادل ماهانه ${formatCleanToman(maxMonthlyEquivalent)} تومان (بیشترین صرفه‌جویی VIP)`
                    : 'مخصوص مدیران ساختمان، خوابگاه‌ها و چندخانه‌ها'}
                </p>
              </div>

              {/* VIP Max Callout Box */}
              <div className="my-5 p-3.5 rounded-2xl bg-white/[0.06] border border-white/15">
                <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-300">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>پوشش فراگیر تمام گروه‌های شما:</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  گروه‌ها، صندوق‌های بانکی و آرشیو مالی کاملاً نامحدود
                </p>
              </div>

              {/* Concise Single-Line Feature Bullets */}
              <ul className="space-y-3 text-xs">
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
                  <span>خروجی اکسل پیشرفته از کل تاریخچه حساب‌ها</span>
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

            <div className="pt-6 mt-6 border-t border-white/10">
              <Link
                className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-lg transition-all"
                href={maxCheckoutHref}
              >
                <Gem className="w-4 h-4 shrink-0" />
                <span>
                  {billingCycle === 'ANNUAL' ? 'خرید مکس VIP سالانه' : 'خرید مکس VIP ماهانه'}
                </span>
                <ArrowLeft className="w-4 h-4 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 3-TIER COMPARISON MATRIX TABLE */}
      <div className="space-y-6 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            مقایسه کامل سطوح اشتراک دنگ‌چی
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            بررسی دقیق تفاوت‌های پلن پایه رایگان، پرو طلایی و مکس VIP
          </p>
        </div>

        <div className="p-1.5 rounded-[26px] bg-slate-200/60 border border-slate-200/90 shadow-2xs overflow-x-auto">
          <div className="bg-white rounded-[20px] border border-slate-200/90 min-w-[640px] overflow-hidden">
            {/* Matrix Header */}
            <div className="grid grid-cols-12 items-center bg-slate-900 text-white px-6 py-4 text-xs sm:text-sm font-extrabold">
              <div className="col-span-6 text-right">امکانات و ظرفیت‌های سامانه</div>
              <div className="col-span-2 text-center text-slate-300">پایه رایگان</div>
              <div className="col-span-2 text-center text-amber-400 flex items-center justify-center gap-1">
                <Crown className="w-4 h-4 shrink-0" />
                <span>پرو طلایی</span>
              </div>
              <div className="col-span-2 text-center text-emerald-400 flex items-center justify-center gap-1">
                <Gem className="w-4 h-4 shrink-0" />
                <span>مکس VIP</span>
              </div>
            </div>

            {/* Matrix Rows */}
            <div className="divide-y divide-slate-100">
              {matrixRows.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="col-span-6 text-right pr-1 pl-4">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {row.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{row.desc}</div>
                  </div>

                  {/* Free Col */}
                  <div className="col-span-2 text-center flex justify-center">
                    {typeof row.free === 'boolean' ? (
                      row.free ? (
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 inline-flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 inline-flex items-center justify-center">
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )
                    ) : (
                      <span className="text-xs font-semibold text-slate-600">{row.free}</span>
                    )}
                  </div>

                  {/* Golden Pro Col */}
                  <div className="col-span-2 text-center flex justify-center bg-amber-50/35 py-2 rounded-xl">
                    {typeof row.pro === 'boolean' ? (
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 inline-flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-xs font-extrabold text-amber-900">{row.pro}</span>
                    )}
                  </div>

                  {/* Max VIP Col */}
                  <div className="col-span-2 text-center flex justify-center">
                    {typeof row.max === 'boolean' ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-300 text-xs font-extrabold">
                        {row.max}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingView;
