'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ShieldCheck,
  Scale,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Smartphone,
  Crown,
} from 'lucide-react';

interface MarketingFooterProps {
  isAuthenticated: boolean;
}

const LIVE_TELEMETRY_MESSAGES = [
  { label: 'موتور محاسبات دوطرفه BigInt', status: 'فعال • دقت ۱۰۰٪ ریالی' },
  { label: 'سرویس ساده‌سازی بدهی‌ها (Simplify)', status: 'پایدار • زمان پاسخ ۱۲ms' },
  { label: 'حفاظت نشست و رمزنگاری HttpOnly', status: 'فعال • امنیت بانکی' },
];

export default function MarketingFooter({ isAuthenticated }: MarketingFooterProps) {
  const [telemetryIdx, setTelemetryIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryIdx((prev) => (prev + 1) % LIVE_TELEMETRY_MESSAGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  function scrollToTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const currentTelemetry = LIVE_TELEMETRY_MESSAGES[telemetryIdx];

  return (
    <footer className="w-full mt-24 bg-[#050911] text-white relative overflow-hidden border-t border-slate-800/90 select-none">
      {/* 1. ANIMATED TOP LASER SHIMMER BEAM (CLEARLY SEPARATES PAGE FROM FOOTER) */}
      <div className="relative w-full h-[2px] bg-slate-800/80 overflow-hidden">
        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-emerald-400 to-amber-400 animate-shimmer-beam" />
      </div>

      {/* Subtle Architectural Grid & Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 footer-grid-bg opacity-70" />
      <div className="pointer-events-none absolute -top-32 right-1/4 w-[500px] h-[300px] rounded-full bg-emerald-500/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[500px] h-[250px] rounded-full bg-amber-500/[0.05] blur-3xl" />

      {/* 2. TOP INTEGRATED FULL-WIDTH CTA STRIP */}
      <div className="relative z-10 border-b border-white/[0.08] bg-white/[0.015] backdrop-blur-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>راه‌اندازی رایگان در کمتر از ۶۰ ثانیه</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
              حساب‌وکتاب خانه و جمع‌های دوستانه را یک‌بار برای همیشه استاندارد کنید
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              بدون نیاز به نصب برنامه سنگین؛ همین حالا گروه خانه را بسازید و لینک دعوت را برای اعضا بفرستید.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href={isAuthenticated ? '/app' : '/login'}
              className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 shadow-lg shadow-emerald-500/15 hover:-translate-y-0.5 transition-all whitespace-nowrap"
            >
              <span>{isAuthenticated ? 'ورود به پیشخوان مالی من' : 'ساخت گروه رایگان'}</span>
              <ArrowLeft className="w-4 h-4 shrink-0" />
            </Link>

            <Link
              href="/pricing"
              className="h-11 px-5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/15 hover:border-amber-400/40 text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 hover:-translate-y-0.5 transition-all whitespace-nowrap"
            >
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <span>مشاهده پلن‌های پرو و مکس</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. MAIN 12-COLUMN FOOTER BODY */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Column 1 (4 Cols): Brand Identity + Live Animated Telemetry Box */}
          <div className="md:col-span-12 lg:col-span-4 space-y-5 text-right">
            <Link href="/" className="inline-flex items-center gap-3.5 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-white tracking-tight">
                    دنگ‌چی
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-extrabold tabular-nums">
                    v2.4
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                  سامانه هوشمند حسابداری و دنگ خانه
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-300 leading-[1.95] text-justify">
              دنگ‌چی نسل جدید ابزارهای مالی خانواده، هم‌خانه‌ها و سفرهای گروهی است که با موتور
              محاسبات دوطرفه BigInt، صندوق مشترک بانکی و الگوریتم ساده‌سازی بدهی، آرامش و شفافیت
              مالی را به جمع شما می‌آورد.
            </p>

            {/* Live Cycling Telemetry Monitor (Zero Orphan Line Wraps!) */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/30 transition-colors space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-extrabold text-white whitespace-nowrap">
                    وضعیت لحظه‌ای هسته مالی
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-extrabold tabular-nums whitespace-nowrap">
                  ۹۹.۹٪ پایداری آنلاین
                </span>
              </div>

              <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-300 font-semibold truncate">
                  {currentTelemetry.label}
                </span>
                <span className="text-emerald-400 font-extrabold whitespace-nowrap shrink-0">
                  {currentTelemetry.status}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2 (2 Cols): Quick Navigation Links with Hover Slide Animation */}
          <div className="md:col-span-4 lg:col-span-2 space-y-4 text-right">
            <h3 className="text-xs font-extrabold text-white tracking-wide border-r-2 border-emerald-500 pr-2.5 whitespace-nowrap">
              دسترسی سریع
            </h3>
            <ul className="space-y-3 text-xs font-semibold text-slate-300">
              <li>
                <Link
                  href="/"
                  className="hover:text-emerald-400 hover:-translate-x-1 transition-all inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
                  <span>صفحه اصلی</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#features"
                  className="hover:text-emerald-400 hover:-translate-x-1 transition-all inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <span>امکانات و ویژگی‌ها</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/download"
                  className="hover:text-emerald-400 hover:-translate-x-1 transition-all inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-300 font-bold">دانلود اپلیکیشن موبایل (APK & iOS)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-amber-400 hover:-translate-x-1 transition-all inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>تعرفه‌ها و پلن‌های Pro</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-emerald-400 hover:-translate-x-1 transition-all inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <span>سوالات متداول (FAQ)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-emerald-400 hover:-translate-x-1 transition-all inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <span>درباره ما و پشتیبانی</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-emerald-400 hover:-translate-x-1 transition-all inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <span>حریم خصوصی و امنیت</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 (3 Cols): Core Capabilities */}
          <div className="md:col-span-4 lg:col-span-3 space-y-4 text-right">
            <h3 className="text-xs font-extrabold text-white tracking-wide border-r-2 border-amber-400 pr-2.5 whitespace-nowrap">
              امکانات کلیدی سامانه
            </h3>
            <ul className="space-y-3 text-xs font-semibold text-slate-300">
              <li className="flex items-center gap-2 whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>دنگ‌بندی ۴ حالته بدون خطای ریالی</span>
              </li>
              <li className="flex items-center gap-2 whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>صندوق مشترک و مدیریت کارت خانه</span>
              </li>
              <li className="flex items-center gap-2 whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>تطبیق هوشمند موجودی کارت شتاب</span>
              </li>
              <li className="flex items-center gap-2 whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>بودجه‌بندی و هشدار سرعت خرج ماهانه</span>
              </li>
              <li className="flex items-center gap-2 whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>قفل پایان ماه و تاریخچه تغییرات اسناد</span>
              </li>
              <li className="flex items-center gap-2 whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>قانون طلایی پوشش Pro برای کل خانه</span>
              </li>
            </ul>
          </div>

          {/* Column 4 (3 Cols): 3 Animated Security & Architecture Cards (Crisp 1-Line Subtitles!) */}
          <div className="md:col-span-4 lg:col-span-3 space-y-3 text-right">
            <h3 className="text-xs font-extrabold text-white tracking-wide border-r-2 border-teal-400 pr-2.5 mb-3 whitespace-nowrap">
              استانداردهای امنیتی و فنی
            </h3>

            <div className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 flex items-center gap-3 transition-all hover:-translate-y-0.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-white block whitespace-nowrap">
                  حریم خصوصی ۱۰۰٪ محرمانه
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 whitespace-nowrap">
                  بدون دسترسی به رمز کارت بانکی
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 flex items-center gap-3 transition-all hover:-translate-y-0.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-white block whitespace-nowrap">
                  موتور محاسبات دقیق BigInt
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 whitespace-nowrap">
                  تراز دوطرفه بدون خطای گرد کردن
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 flex items-center gap-3 transition-all hover:-translate-y-0.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-white block whitespace-nowrap">
                  وب‌اپلیکیشن پیش‌رونده (PWA)
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 whitespace-nowrap">
                  قابل نصب روی موبایل و دسکتاپ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FULL-WIDTH BOTTOM SUB-FOOTER BAR + ANIMATED SCROLL-TO-TOP BUTTON */}
      <div className="relative z-10 border-t border-slate-800/90 bg-[#03060C]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-center sm:text-right">
            <span>
              © ۱۴۰۵ — تمامی حقوق برای سامانه حسابداری و دنگ‌بندی هوشمند{' '}
              <strong className="text-white font-extrabold">دنگ‌چی</strong> محفوظ است.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors font-semibold whitespace-nowrap"
              >
                قوانین و حریم خصوصی
              </Link>
              <span className="text-slate-700">•</span>
              <Link
                href="/faq"
                className="hover:text-white transition-colors font-semibold whitespace-nowrap"
              >
                مرکز راهنما
              </Link>
              <span className="text-slate-700">•</span>
              <Link
                href="/about"
                className="hover:text-white transition-colors font-semibold whitespace-nowrap"
              >
                تماس با پشتیبانی
              </Link>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 inline-flex items-center gap-1.5 text-xs font-extrabold transition-all group whitespace-nowrap"
              title="بازگشت به بالای صفحه"
            >
              <span>بالای صفحه</span>
              <ArrowUp className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
