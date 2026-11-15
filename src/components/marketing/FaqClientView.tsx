'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Scale,
  Wallet,
  Crown,
  ShieldCheck,
  Sparkles,
  MessageSquarePlus,
  ArrowLeft,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import type { FaqItem, FaqCategory } from '@/lib/faq-store';
import { toPersianDigits } from '@/lib/money';

interface FaqClientViewProps {
  initialFaqs: FaqItem[];
  isAuthenticated: boolean;
}

const CATEGORY_META: Record<
  'ALL' | FaqCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; colorClass: string }
> = {
  ALL: {
    label: 'همه موضوعات',
    icon: Layers,
    colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  ACCOUNTING: {
    label: 'دنگ‌بندی و محاسبات',
    icon: Scale,
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  FUND: {
    label: 'صندوق و کارت خانه',
    icon: Wallet,
    colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  SUBSCRIPTION: {
    label: 'اشتراک پرو و مکس',
    icon: Crown,
    colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  SECURITY: {
    label: 'امنیت و نصب برنامه',
    icon: ShieldCheck,
    colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
};

export default function FaqClientView({ initialFaqs, isAuthenticated }: FaqClientViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | FaqCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(initialFaqs[0]?.id ?? null);

  const filteredFaqs = useMemo(() => {
    return initialFaqs.filter((item) => {
      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory;
      const q = searchQuery.trim();
      const matchesSearch =
        !q ||
        item.question.includes(q) ||
        item.answer.includes(q) ||
        (item.badge && item.badge.includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [initialFaqs, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: initialFaqs.length };
    for (const item of initialFaqs) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [initialFaqs]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      {/* 1. HERO HEADER & SEARCH BAR */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex flex-row items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-extrabold shadow-2xs">
          <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>مرکز راهنما و پاسخ به پرسش‌های متداول</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 tracking-tight leading-[1.35]">
          پاسخ شفاف به تمام ابهامات مالی و فنی شما
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-[1.85] max-w-2xl mx-auto">
          هرآنچه درباره نحوه کارکرد دنگ‌بندی ۴ حالته، مدیریت کارت مشترک خانه، قانون طلایی اشتراک‌ها و
          امنیت اطلاعات بانکی نیاز دارید در این صفحه دسته‌بندی شده است.
        </p>

        {/* Live Search Input inside Double-Frame */}
        <div className="pt-2 max-w-2xl mx-auto">
          <div className="p-1.5 rounded-2xl bg-slate-200/65 border border-slate-200/90 shadow-2xs">
            <div className="relative bg-white rounded-xl border border-slate-200/90 flex items-center">
              <Search className="w-5 h-5 text-slate-400 mr-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در سوالات (مثلاً: صندوق مشترک، قانون طلایی، اکسل، رمز کارت...)"
                className="w-full h-12 pr-3 pl-4 bg-transparent text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="ml-3 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold shrink-0"
                >
                  پاک کردن
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY FILTER TABS BAR */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(['ALL', 'ACCOUNTING', 'FUND', 'SUBSCRIPTION', 'SECURITY'] as const).map((catKey) => {
          const meta = CATEGORY_META[catKey];
          const Icon = meta.icon;
          const isSelected = selectedCategory === catKey;
          const count = categoryCounts[catKey] || 0;
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setSelectedCategory(catKey)}
              className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-extrabold inline-flex flex-row items-center gap-2 transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{meta.label}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {toPersianDigits(String(count))}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. 12-COLUMN MAIN CONTENT (ACCORDION LIST + STICKY SIDEBAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right Column (8 Cols): Framed Accordion Cards */}
        <div className="lg:col-span-8 space-y-3.5">
          {filteredFaqs.length === 0 ? (
            <div className="p-1.5 rounded-[24px] bg-slate-200/50 border border-slate-200/80">
              <div className="bg-white rounded-[18px] border border-slate-200/90 p-10 text-center space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800">
                  موردی مطابق با جستجوی شما یافت نشد
                </h3>
                <p className="text-xs text-slate-500">
                  عبارت دیگری را جستجو کنید یا فیلتر دسته‌بندی را روی «همه موضوعات» قرار دهید.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                  }}
                  className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  نمایش تمام سوالات
                </button>
              </div>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openId === faq.id;
              const catMeta = CATEGORY_META[faq.category] || CATEGORY_META.ACCOUNTING;
              const CatIcon = catMeta.icon;

              return (
                <div
                  key={faq.id}
                  className={`p-1 rounded-[22px] transition-all ${
                    isOpen
                      ? 'bg-gradient-to-l from-emerald-500/30 via-teal-500/20 to-slate-200/70 shadow-sm'
                      : 'bg-slate-200/50 hover:bg-slate-200/80'
                  }`}
                >
                  <div className="bg-white rounded-[18px] border border-slate-200/90 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      className="w-full p-5 sm:p-6 text-right flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-xl text-xs font-extrabold tabular-nums flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isOpen
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {toPersianDigits(String(idx + 1).padStart(2, '0'))}
                        </span>

                        <div className="space-y-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border inline-flex items-center gap-1 ${catMeta.colorClass}`}
                            >
                              <CatIcon className="w-3 h-3 shrink-0" />
                              <span>{catMeta.label}</span>
                            </span>

                            {faq.badge && (
                              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200/80">
                                {faq.badge}
                              </span>
                            )}
                          </div>

                          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed">
                            {faq.question}
                          </h2>
                        </div>
                      </div>

                      <span
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isOpen
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 rotate-180'
                            : 'bg-slate-50 border-slate-200/80 text-slate-500'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/40">
                        <p className="text-xs sm:text-sm text-slate-700 leading-[1.95] text-justify">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Left Column (4 Cols): Sticky Guarantee & Support Box */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {/* Card 1: 3 Core Guarantees */}
          <div className="p-1.5 rounded-[24px] bg-slate-200/60 border border-slate-200/90">
            <div className="bg-white rounded-[18px] border border-slate-200/90 p-5 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    ۳ اصل تضمین‌شده دنگ‌چی
                  </h3>
                  <p className="text-[11px] text-slate-400">معماری استاندارد مالی و امنیتی</p>
                </div>
              </div>

              <ul className="space-y-3 text-xs">
                <li className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>تراز دوطرفه بدون ۱ تومان خطا</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    مجموع تراز اعضا همواره با موجودی صندوق مشترک برابر است.
                  </p>
                </li>

                <li className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-1">
                  <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>پوشش گروهی اشتراک (Group Halo)</span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    خرید اشتراک توسط ۱ عضو، کل اعضای آن خانه را ویژه می‌کند.
                  </p>
                </li>

                <li className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>حریم خصوصی ۱۰۰٪ محرمانه</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    ریز فاکتورها و بدهی‌های خانه فقط برای اعضای همان گروه قابل مشاهده است.
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 2: Direct CTA to Contact / Start */}
          <div className="p-1.5 rounded-[24px] bg-slate-900 shadow-lg">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-[18px] border border-slate-800 p-5 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <MessageSquarePlus className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-white">
                  پاسخ سوال خود را پیدا نکردید؟
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تیم پشتیبانی دنگ‌چی آماده پاسخگویی به سوالات فنی و مالی شماست.
                </p>
              </div>
              <div className="pt-1 flex flex-col gap-2.5">
                <Link
                  className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-all"
                  href="/about"
                >
                  <span>ارسال پیام به پشتیبانی</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
                <Link
                  className="w-full h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold inline-flex items-center justify-center transition-all"
                  href={isAuthenticated ? '/app' : '/login'}
                >
                  {isAuthenticated ? 'ورود به پیشخوان مالی' : 'شروع رایگان حسابداری خانه'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
