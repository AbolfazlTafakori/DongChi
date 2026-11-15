"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Receipt,
  Users,
  Sparkles,
  TrendingDown,
  Layers,
  ShieldCheck,
  Scale,
} from "lucide-react";

export function LiveHeroSimulator() {
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      className="relative bento-outer group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Floating Badge on the corner */}
      <div className="absolute -top-3.5 -left-2 z-20 animate-float">
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-emerald-400/40">
          <Sparkles className="w-3.5 h-3.5" />
          <span>صفر تومان خطای گرد کردن</span>
        </div>
      </div>

      <div className="bento-inner bg-slate-900 border-slate-800 text-white p-5 sm:p-6 overflow-hidden relative">
        {/* Decorative background glow inside the simulator */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Step Selector Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-300">
              شبیه‌ساز مالی زنده
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl text-[11px] font-semibold">
            {[
              { id: 0, label: "۱. ثبت خرج" },
              { id: 1, label: "۲. دنگ‌بندی" },
              { id: 2, label: "۳. تسویه" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStep(tab.id as 0 | 1 | 2)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeStep === tab.id
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* State Content with Smooth Fade */}
        <div className="min-h-[260px] flex flex-col justify-between">
          {/* STATE 1: Expense & Card Deduction */}
          {activeStep === 0 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  فاکتور ثبت‌شده در گروه
                </span>
                <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                  ثبت موفق
                </span>
              </div>

              {/* Expense Item */}
              <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-white">
                    خرید هفتگی پروتئین و لبنیات
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    توسط علی رضایی • دسته‌بندی خوراک
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-base font-black text-rose-400 tabular-nums">
                    - ۱,۲۰۰,۰۰۰
                  </span>
                  <span className="text-[10px] text-slate-400 block -mt-1">
                    تومان
                  </span>
                </div>
              </div>

              {/* Deducting from Card */}
              <div className="bg-gradient-to-r from-emerald-950/80 to-slate-800/80 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      صندوق مشترک خانه (کارت بلو)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                      ۶۲۱۹ - ۸۶۱۰ - •••• - ۴۴۹۲
                    </span>
                  </div>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold tabular-nums">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    <span>موجودی جدید: ۳,۸۰۰,۰۰۰</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">
                    تومان (کسر شد)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: 4-Way Real-time Split */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="w-4 h-4 text-emerald-400" />
                  تقسیم دقیق بین ۴ همخانه
                </span>
                <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  سهم برابر: ۳۰۰,۰۰۰ ت
                </span>
              </div>

              {/* 4 Member Progress Bars */}
              <div className="space-y-2.5">
                {[
                  { name: "علی رضایی", share: "۳۰۰,۰۰۰", width: "w-full", bg: "bg-emerald-500", role: "پرداخت‌کننده" },
                  { name: "سارا محمدی", share: "۳۰۰,۰۰۰", width: "w-full", bg: "bg-teal-500", role: "بدهکار" },
                  { name: "پویا قاسمی", share: "۳۰۰,۰۰۰", width: "w-full", bg: "bg-cyan-500", role: "بدهکار" },
                  { name: "مریم اکبری", share: "۳۰۰,۰۰۰", width: "w-full", bg: "bg-indigo-500", role: "بدهکار" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200">{item.name}</span>
                        <span className="text-[10px] text-slate-400">({item.role})</span>
                      </div>
                      <span className="text-emerald-400 font-bold tabular-nums">
                        {item.share} تومان
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.bg} rounded-full transition-all duration-700`}
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STATE 3: Simplify Debts */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  الگوریتم ساده‌سازی بدهی‌ها
                </span>
                <span className="text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                  کاهش از ۶ انتقال به ۲
                </span>
              </div>

              {/* Collapsed Debts */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 line-through opacity-60">
                  <span>۴ تراکنش تودرتو و بدهی‌های متقاطع</span>
                  <span>۱,۲۰۰,۰۰۰ ت</span>
                </div>
                <div className="flex items-center justify-center py-1">
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    خالص‌سازی خودکار بدهی‌ها
                  </span>
                </div>

                {/* Final Simplified Transfer */}
                <div className="bg-gradient-to-r from-emerald-900/60 to-slate-900/80 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      سارا
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400 rotate-180" />
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      علی
                    </span>
                  </div>

                  <div className="text-left flex items-center gap-2">
                    <div>
                      <span className="text-sm font-black text-emerald-400 tabular-nums">
                        ۳۰۰,۰۰۰
                      </span>
                      <span className="text-[10px] text-slate-400 block -mt-1">
                        تومان
                      </span>
                    </div>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>با ۱ کارت‌به‌کارت تمامی حساب‌های گروه تسویه کامل می‌شوند.</span>
              </div>
            </div>
          )}

          {/* Bottom Status bar */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              موتور حسابداری دوطرفه بدون خطا
            </span>
            <span className="text-slate-500">
              تغییر خودکار هر ۳.۵ ثانیه
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
