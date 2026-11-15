"use client";

import React, { useState } from "react";
import {
  Scale,
  Wallet,
  Flame,
  History,
  Lock,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const splitModes = [
  { id: "EQUAL", label: "مساوی" },
  { id: "PERCENT", label: "درصدی" },
  { id: "SHARES", label: "سهمیه‌ای" },
  { id: "EXACT", label: "مبلغ دقیق" },
] as const;

type SplitMode = (typeof splitModes)[number]["id"];

interface MemberShare {
  name: string;
  shareRule: string;
  amount: string;
  initial: string;
}

const splitData: Record<
  SplitMode,
  {
    invoiceTitle: string;
    members: MemberShare[];
  }
> = {
  EQUAL: {
    invoiceTitle: "فاکتور نمونه: خرید هفتگی سوپرمارکت — ۱,۰۰۰,۰۰۰ تومان",
    members: [
      { name: "علی محمدی", shareRule: "۱/۳ سهم (مساوی)", amount: "۳۳۳,۳۳۴ تومان", initial: "ع" },
      { name: "سارا رضایی", shareRule: "۱/۳ سهم (مساوی)", amount: "۳۳۳,۳۳۳ تومان", initial: "س" },
      { name: "رضا کاظمی", shareRule: "۱/۳ سهم (مساوی)", amount: "۳۳۳,۳۳۳ تومان", initial: "ر" },
    ],
  },
  PERCENT: {
    invoiceTitle: "فاکتور نمونه: قبض برق و گاز زمستان — ۱,۰۰۰,۰۰۰ تومان",
    members: [
      { name: "علی محمدی", shareRule: "۵۰٪ سهم (اتاق بزرگ مستر)", amount: "۵۰۰,۰۰۰ تومان", initial: "ع" },
      { name: "سارا رضایی", shareRule: "۳۰٪ سهم (اتاق متوسط)", amount: "۳۰۰,۰۰۰ تومان", initial: "س" },
      { name: "رضا کاظمی", shareRule: "۲۰٪ سهم (اتاق کوچک)", amount: "۲۰۰,۰۰۰ تومان", initial: "ر" },
    ],
  },
  SHARES: {
    invoiceTitle: "فاکتور نمونه: وعده ناهار مشترک — ۱,۰۰۰,۰۰۰ تومان",
    members: [
      { name: "علی محمدی", shareRule: "۲ سهم (همراه با مهمان)", amount: "۴۰۰,۰۰۰ تومان", initial: "ع" },
      { name: "سارا رضایی", shareRule: "۲ سهم (استفاده کامل)", amount: "۴۰۰,۰۰۰ تومان", initial: "س" },
      { name: "رضا کاظمی", shareRule: "۱ سهم (نصف روز حضور)", amount: "۲۰۰,۰۰۰ تومان", initial: "ر" },
    ],
  },
  EXACT: {
    invoiceTitle: "فاکتور نمونه: خرید اقلام بهداشتی و نظافت — ۱,۰۰۰,۰۰۰ تومان",
    members: [
      { name: "علی محمدی", shareRule: "مبلغ ثابت اقلام شخصی", amount: "۴۵۰,۰۰۰ تومان", initial: "ع" },
      { name: "سارا رضایی", shareRule: "مبلغ ثابت اقلام شخصی", amount: "۳۵۰,۰۰۰ تومان", initial: "س" },
      { name: "رضا کاظمی", shareRule: "مبلغ ثابت سهم مشاعات", amount: "۲۰۰,۰۰۰ تومان", initial: "ر" },
    ],
  },
};

export function InteractiveBentoFeatures() {
  const [activeSplitTab, setActiveSplitTab] = useState<SplitMode>("EQUAL");
  const currentSplit = splitData[activeSplitTab];

  return (
    <section id="features" className="max-w-6xl mx-auto px-4 space-y-10">
      {/* 1. Section Header (Balanced, Zero Orphan Word Wraps) */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-extrabold inline-flex items-center gap-2 shadow-2xs">
          <span>✦ مهندسی‌شده برای مدیریت مالی خانه و سفر</span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.35]">
          ابزارهای دقیق حسابداری خانه، در قالبی ساده و بی‌تعارف
        </h2>

        <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
          به‌جای ماشین‌حساب و یادداشت‌های پراکنده، تمام خریدها، شارژ صندوق و تسویه‌حساب‌ها را با دقت ۱۰۰٪ ریالی در یک فضای مشترک مدیریت کنید.
        </p>
      </div>

      {/* 2. Double-Framed 12-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* BENTO CARD 1 (lg:col-span-7 — دنگ‌بندی ۴ حالته تعاملی) */}
        <div className="lg:col-span-7 p-1.5 rounded-[26px] bg-slate-200/55 border border-slate-200/90 flex">
          <div className="bg-white rounded-[20px] border border-slate-200/80 p-6 sm:p-7 shadow-2xs flex flex-col justify-between w-full hover:border-emerald-500/40 transition-all duration-300">
            {/* Top Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs border border-emerald-100">
                  <Scale className="w-6 h-6" />
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                  بدون ۱ تومان خطای گرد کردن
                </span>
              </div>

              <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                دنگ‌بندی ۴ حالته انعطاف‌پذیر
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                تقسیم مساوی برای خریدهای روزمره، درصدی بر اساس متراژ اتاق‌ها، سهمیه‌ای برای مهمانان، و مبالغ دقیق ریالی با حفظ باقیمانده بدون گرد کردن اعداد.
              </p>
            </div>

            {/* Rich Interactive Mini-UI Preview */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
              {/* Top Segmented Tabs */}
              <div className="grid grid-cols-4 gap-1.5 bg-slate-200/70 p-1 rounded-xl text-center text-xs font-bold text-slate-700">
                {splitModes.map((mode) => {
                  const isActive = activeSplitTab === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setActiveSplitTab(mode.id)}
                      className={cn(
                        "py-1.5 rounded-lg transition-all duration-150 cursor-pointer",
                        isActive
                          ? "bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
                      )}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>

              {/* Simulated Invoice Header */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-0.5">
                <span>{currentSplit.invoiceTitle}</span>
                <span className="text-emerald-700 font-extrabold">سهم کل: ۱۰۰٪</span>
              </div>

              {/* 3 Member Breakdown Rows */}
              <div className="space-y-2">
                {currentSplit.members.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-2.5 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs transition-colors hover:border-slate-300"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-black text-xs flex items-center justify-center shrink-0">
                        {m.initial}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{m.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">
                          {m.shareRule}
                        </span>
                      </div>
                    </div>

                    <span className="font-black text-emerald-700 tabular-nums">
                      {m.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BENTO CARD 2 (lg:col-span-5 — صندوق مشترک و کارت بانکی خانه) */}
        <div className="lg:col-span-5 p-1.5 rounded-[26px] bg-slate-200/55 border border-slate-200/90 flex">
          <div className="bg-white rounded-[20px] border border-slate-200/80 p-6 sm:p-7 shadow-2xs flex flex-col justify-between w-full hover:border-emerald-500/40 transition-all duration-300">
            {/* Top Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs border border-teal-100">
                  <Wallet className="w-6 h-6" />
                </div>
                <span className="bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full text-xs font-bold">
                  پشتیبانی از تطبیق موجودی
                </span>
              </div>

              <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                صندوق مشترک و کارت خانه
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                کارت بانکی تنخواه خانه را ثبت کنید، واریزی‌های اعضا را متمرکز کرده و هنگام ثبت خریدها مستقیماً از موجودی صندوق کسر کنید.
              </p>
            </div>

            {/* Rich Visual Bank Card + Live Deduction Pill */}
            <div className="mt-6 space-y-2.5">
              {/* Shetab Virtual Bank Card */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white shadow-lg border border-emerald-500/20 relative overflow-hidden space-y-3.5">
                {/* Ambient Blur */}
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

                {/* Card Top Row */}
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs font-bold text-slate-200">
                    بانک پاسارگاد • کارت مشترک خانه
                  </span>

                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-emerald-300 rotate-90"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                      <path d="M12 19a8.5 8.5 0 0 1 0-14" />
                      <path d="M15.5 21.5a12 12 0 0 1 0-19" />
                    </svg>

                    <svg
                      className="w-8 h-6 rounded-xs shadow-xs"
                      viewBox="0 0 40 28"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="40" height="28" rx="4" fill="#EAB308" />
                      <rect x="2" y="2" width="36" height="24" rx="2" fill="#FACC15" />
                      <path
                        d="M0 14H12M28 14H40M14 0V28M26 0V28M12 9H28M12 19H28"
                        stroke="#B45309"
                        strokeWidth="1.2"
                      />
                    </svg>
                  </div>
                </div>

                {/* Card Number */}
                <div
                  className="dir-ltr font-mono text-sm sm:text-base tracking-[0.2em] text-emerald-100 text-center py-1 font-bold tabular-nums drop-shadow-sm"
                  dir="ltr"
                >
                  5022  2910  ••••  7701
                </div>

                {/* Card Bottom Row */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-900/60 relative z-10">
                  <span className="text-slate-400">موجودی فعلی صندوق:</span>
                  <span className="font-extrabold text-base text-emerald-400 tabular-nums">
                    ۲,۴۵۰,۰۰۰ تومان
                  </span>
                </div>
              </div>

              {/* Live Deduction Strip */}
              <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 flex items-center justify-between text-xs font-semibold shadow-2xs">
                <div className="flex items-center gap-1.5 text-emerald-900">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>کسر خودکار خرید نان و لبنیات از صندوق</span>
                </div>
                <span className="font-black text-emerald-800 tabular-nums">
                  - ۱۸۵,۰۰۰ تومان
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO CARD 3 (lg:col-span-5 — کنترل بودجه و سرعت خرج) */}
        <div className="lg:col-span-5 p-1.5 rounded-[26px] bg-slate-200/55 border border-slate-200/90 flex">
          <div className="bg-white rounded-[20px] border border-slate-200/80 p-6 sm:p-7 shadow-2xs flex flex-col justify-between w-full hover:border-amber-500/40 transition-all duration-300">
            {/* Top Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs border border-amber-100">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
                  هوش مالی خودکار
                </span>
              </div>

              <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                کنترل سقف بودجه و سرعت خرج (Burn Rate)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                تعیین سقف بودجه ماهانه برای دسته‌بندی‌ها به همراه پایش هوشمند سرعت سوزاندن تنخواه تا در انتهای ماه دچار کسری نشوید.
              </p>
            </div>

            {/* Rich Dual-Category Budget Monitor */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              {/* Category 1 (Safe) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">خوراک و سوپرمارکت</span>
                  <span className="text-emerald-700 tabular-nums">
                    ۳,۹۰۰,۰۰۰ از ۵,۰۰۰,۰۰۰ تومان (۷۸٪)
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: "78%" }} />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  وضعیت پایدار • میانگین روزانه ۱۳۰,۰۰۰ تومان
                </span>
              </div>

              {/* Category 2 (Warning) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">کافه و سفارش غذا</span>
                  <span className="text-amber-700 tabular-nums">
                    ۱,۸۵۰,۰۰۰ از ۲,۰۰۰,۰۰۰ تومان (۹۲٪)
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: "92%" }} />
                </div>

                {/* Alert Pill */}
                <div className="px-2.5 py-1.5 rounded-lg bg-amber-100/90 text-amber-950 text-[11px] font-bold flex items-center justify-between border border-amber-200/80">
                  <span>⚠ هشدار سرعت خرج: پیش‌بینی اتمام بودجه تا ۴ روز دیگر</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO CARD 4 (lg:col-span-7 — تاریخچه تغییرات ضدتقلب و بستن دوره مالی) */}
        <div className="lg:col-span-7 p-1.5 rounded-[26px] bg-slate-200/55 border border-slate-200/90 flex">
          <div className="bg-white rounded-[20px] border border-slate-200/80 p-6 sm:p-7 shadow-2xs flex flex-col justify-between w-full hover:border-indigo-500/40 transition-all duration-300">
            {/* Top Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs border border-indigo-100">
                  <History className="w-6 h-6" />
                </div>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold">
                  شفافیت ۱۰۰٪ اسناد
                </span>
              </div>

              <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                تاریخچه تغییرات (Audit Log) و قفل پایان ماه
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                هرگونه ویرایش یا حذف فاکتور، با ثبت مقادیر قبل و بعد در تاریخچه ممیزی ذخیره می‌شود. در پایان هر ماه می‌توانید دوره مالی را قفل کنید تا اسناد دستکاری نشوند.
              </p>
            </div>

            {/* Rich 2-Item Audit & Closing Timeline */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              {/* Timeline Item 1 (Live Edit Diff Preview) */}
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold text-[11px]">
                    ویرایش سند
                  </span>
                  <span className="text-slate-700 font-semibold">
                    توسط سارا • فاکتور «خرید میوه»
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="line-through text-red-500 tabular-nums">
                    ۱۸۰,۰۰۰
                  </span>
                  <span className="text-slate-400">←</span>
                  <span className="text-emerald-700 font-extrabold tabular-nums">
                    ۲۴۰,۰۰۰ تومان
                  </span>
                </div>
              </div>

              {/* Timeline Item 2 (Monthly Cycle Lock Preview) */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-950 font-bold">
                  <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>بستن حساب دوره آبان ۱۴۰۵ توسط مدیر گروه</span>
                </div>

                <span className="bg-white text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold text-[11px] shadow-2xs">
                  🔒 قفل ضدتغییر فعال • ۱۲ فاکتور بایگانی شد
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
