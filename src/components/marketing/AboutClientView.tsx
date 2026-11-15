'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Sparkles,
  ShieldCheck,
  Scale,
  Users,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  Bug,
  Lightbulb,
  Crown,
  Building2,
  ArrowLeft,
  Lock,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import type { ContactTopic } from '@/lib/contact-store';
import { useToast } from '@/components/ui/Toast';

const TOPIC_OPTIONS: {
  key: ContactTopic;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: 'FEATURE',
    label: 'پیشنهاد قابلیت جدید',
    desc: 'ایده برای بهبود دنگ‌بندی و امکانات',
    icon: Lightbulb,
  },
  {
    key: 'BILLING',
    label: 'سوال مالی و اشتراک',
    desc: 'پلن‌های پرو طلایی، مکس و درگاه پرداخت',
    icon: Crown,
  },
  {
    key: 'BUG',
    label: 'گزارش مشکل فنی',
    desc: 'اطلاع‌رسانی خطا یا باگ در محاسبات',
    icon: Bug,
  },
  {
    key: 'PARTNERSHIP',
    label: 'همکاری خوابگاه و ساختمان',
    desc: 'استفاده سازمانی و مجتمع‌های مسکونی',
    icon: Building2,
  },
];

export default function AboutClientView({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { toast } = useToast();
  const [topic, setTopic] = useState<ContactTopic>('FEATURE');
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('لطفاً نام و نام خانوادگی خود را وارد کنید (حداقل ۲ حرف).');
      return;
    }
    if (contactInfo.trim().length < 5) {
      setError('لطفاً شماره موبایل یا ایمیل معتبر جهت دریافت پاسخ وارد کنید.');
      return;
    }
    if (message.trim().length < 10) {
      setError('لطفاً متن پیام یا پیشنهاد خود را کامل‌تر بنویسید (حداقل ۱۰ کاراکتر).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          name: name.trim(),
          contactInfo: contactInfo.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطایی در ثبت پیام رخ داد.');
      } else {
        setSubmittedTicket(data.item?.trackingCode || 'DC-10240');
        setName('');
        setContactInfo('');
        setMessage('');
        toast.success('پیام شما با موفقیت ثبت و به تیم دنگ‌چی ارسال شد.');
      }
    } catch {
      setError('خطا در برقراری ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-16">
      {/* 1. HERO HEADER & 4 ARCHITECTURAL PILLARS */}
      <div className="space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex flex-row items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-extrabold shadow-2xs">
            <Heart className="w-4 h-4 text-emerald-600 fill-emerald-500/20 shrink-0" />
            <span>داستان ما • مهندسی‌شده برای آرامش مالی جمع‌های ایرانی</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 tracking-tight leading-[1.35]">
            پایان تعارف‌های مالی، آغاز صمیمیت و شفافیت
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-[1.85] max-w-2xl mx-auto">
            دنگ‌چی با یک هدف روشن متولد شد: حذف استرس حساب‌وکتاب‌های دستی، جلوگیری از خطاهای
            گرد کردن اعداد و حفظ دوستی‌ها در زندگی هم‌خانه‌ای، سفرهای گروهی و مدیریت ساختمان.
          </p>
        </div>

        {/* 4 Core Values / Metrics Bar */}
        <div className="p-1.5 rounded-[26px] bg-slate-200/60 border border-slate-200/90 shadow-2xs">
          <div className="bg-white rounded-[20px] border border-slate-200/90 p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 divide-y sm:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100">
            <div className="flex items-center gap-3.5 pt-2 sm:pt-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-extrabold text-slate-900 block">دقت ۱۰۰٪ ریالی</span>
                <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
                  موتور محاسبات صحیح BigInt
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-4 sm:pt-0 lg:pr-5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-extrabold text-slate-900 block">۴ حالت دنگ‌بندی</span>
                <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
                  مساوی، دقیق، درصدی و سهمیه‌ای
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-4 sm:pt-0 lg:pr-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-extrabold text-slate-900 block">ممیزی ضدتقلب</span>
                <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
                  ثبت تاریخچه تغییرات (Audit Log)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-4 sm:pt-0 lg:pr-5">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/70 text-teal-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-extrabold text-slate-900 block">حریم خصوصی مطلق</span>
                <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
                  عدم دسترسی به رمز کارت و اسناد
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BENTO STORY & TECHNICAL PHILOSOPHY GRID (12 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Right Card (6 Cols): Why DongChi Was Born */}
        <div className="lg:col-span-6 p-1.5 rounded-[26px] bg-slate-200/60 border border-slate-200/90 flex">
          <div className="bg-white rounded-[20px] border border-slate-200/90 p-6 sm:p-7 flex flex-col justify-between w-full shadow-2xs space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-extrabold">
                  تجربه واقعی زندگی مشترک
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                چرا دنگ‌چی متولد شد؟
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-[1.95] text-justify">
                زندگی مشترک دانشجویی، هم‌خانه‌ای و سفرهای دسته‌جمعی پر از خاطرات ماندگار است؛ اما
                وقتی نوبت به حساب کردن خرج‌های ریزودرشت، شارژ کارت خانه و بده‌بستان‌های چندطرفه
                می‌رسد، یادداشت‌های کاغذی و فایل‌های اکسل خیلی زود به ابهام، رودربایستی و دلخوری
                تبدیل می‌شوند. دنگ‌چی ساخته شد تا این بارِ ذهنی را به طور کامل از دوش جمع‌های
                دوستانه و خانواده‌ها بردارد.
              </p>
            </div>

            {/* Visual Before vs After Comparison Sub-Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-red-50/50 border border-red-200/70 space-y-1.5">
                <span className="text-xs font-extrabold text-red-800 block">
                  ✕ روش سنتی و دستی:
                </span>
                <p className="text-[11px] text-red-900/80 leading-relaxed">
                  کارت‌به‌کارت‌های زنجیره‌ای، فراموشی خریدهای ریز و اختلاف در موجودی کارت خانه
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                <span className="text-xs font-extrabold text-emerald-900 block">
                  ✓ استاندارد دنگ‌چی:
                </span>
                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  تراز لحظه‌ای اعضا، کسر خودکار از صندوق مشترک و تسویه کل بدهی‌ها با ۱ انتقال
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Left Card (6 Cols): Our Technical & Financial Philosophy */}
        <div className="lg:col-span-6 p-1.5 rounded-[26px] bg-slate-200/60 border border-slate-200/90 flex">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-[20px] border border-slate-800 p-6 sm:p-7 flex flex-col justify-between w-full shadow-lg space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-white/15 text-xs font-extrabold">
                  معماری مهندسی فین‌تک
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                فلسفه فنی و استانداردهای امنیتی ما
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-[1.95] text-justify">
                ما دنگ‌چی را نه مثل یک دفترچه یادداشت ساده، بلکه با استانداردهای یک هسته بانکی
                (Core Banking) طراحی کرده‌ایم. استفاده از اعداد صحیح بزرگ (BigInt) برای جلوگیری از
                خطای اعشار، اجرای اتمیک تراکنش‌ها و معماری حفظ حریم خصوصی (Privacy by Design)
                تضمین می‌کند که اطلاعات مالی خانه شما همیشه دقیق، سریع و کاملاً محرمانه بماند.
              </p>
            </div>

            {/* 3 Technical Architecture Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                <span className="text-[11px] font-extrabold text-emerald-400 block">
                  Zero-Sum Invariant
                </span>
                <span className="text-xs font-bold text-slate-200 mt-1 block">
                  تراز دوطرفه حسابداری
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                <span className="text-[11px] font-extrabold text-amber-400 block">
                  Privacy by Design
                </span>
                <span className="text-xs font-bold text-slate-200 mt-1 block">
                  محرمانگی کامل فاکتورها
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                <span className="text-[11px] font-extrabold text-indigo-300 block">
                  Installable PWA
                </span>
                <span className="text-xs font-bold text-slate-200 mt-1 block">
                  نصب بومی بدون تبلیغات
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 12-COLUMN CONTACT & FEEDBACK WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
        {/* Right Column (5 Cols): Support Info, Response SLA & Quick Links */}
        <div className="lg:col-span-5 flex">
          <div className="p-1.5 rounded-[28px] bg-slate-200/60 border border-slate-200/90 w-full flex">
            <div className="bg-white rounded-[22px] border border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between w-full shadow-2xs space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-extrabold">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>ارتباط مستقیم با تیم محصول</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-[1.45]">
                  صدای شما نقشه راه آینده دنگ‌چی را می‌سازد
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 leading-[1.95] text-justify">
                  فرقی نمی‌کند ایده جدیدی برای راحت‌تر شدن دنگ‌بندی دارید، سوالی درباره اشتراک‌های
                  پرو طلایی و مکس VIP برایتان پیش آمده یا می‌خواهید دنگ‌چی را برای خوابگاه و
                  ساختمان خود شخصی‌سازی کنید؛ تمام پیام‌ها مستقیماً توسط تیم فنی بررسی می‌شوند.
                </p>
              </div>

              {/* Middle Process Steps Box (Eliminates Empty Vertical Gap!) */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-3">
                <span className="text-xs font-extrabold text-emerald-950 block">
                  فرآیند رسیدگی به پیام‌های شما:
                </span>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
                      ۱
                    </span>
                    <span className="font-semibold">ثبت آنی پیام و صدور کد پیگیری اختصاصی</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
                      ۲
                    </span>
                    <span className="font-semibold">بررسی مستقیم در کارتابل مدیریت و تیم فنی</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
                      ۳
                    </span>
                    <span className="font-semibold">پاسخگویی و اطلاع‌رسانی نتیجه از طریق شماره یا ایمیل</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3.5 pt-2 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                      میانگین زمان پاسخگویی پشتیبانی
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      کمتر از ۲ ساعت در روزهای کاری هفته
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                        سوالات متداول کاربران
                      </span>
                      <span className="text-xs text-slate-500 mt-1 block">
                        پاسخ سریع به ۱۰ پرسش کلیدی حسابداری
                      </span>
                    </div>
                  </div>
                  <Link
                    className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
                    href="/faq"
                  >
                    <span>مشاهده</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Left Column (7 Cols): Spacious Double-Framed Interactive Contact Form */}
        <div className="lg:col-span-7 flex">
          <div className="p-1.5 rounded-[28px] bg-slate-200/60 border border-slate-200/90 w-full flex">
            <div className="bg-white rounded-[22px] border border-slate-200/90 p-6 sm:p-8 w-full shadow-2xs flex flex-col justify-between">
              {submittedTicket ? (
                <div className="my-auto py-10 text-center space-y-5 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      پیام شما با موفقیت در سیستم ثبت شد
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      کارشناسان تیم دنگ‌چی پیام شما را بررسی کرده و از طریق شماره تماس یا ایمیل
                      ثبت‌شده با شما در ارتباط خواهند بود.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 inline-flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">کد پیگیری پیام شما:</span>
                    <span
                      dir="ltr"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-mono text-xs font-extrabold tracking-wider"
                    >
                      {submittedTicket}
                    </span>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSubmittedTicket(null)}
                      className="h-11 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold transition-colors"
                    >
                      ارسال یک پیام دیگر
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Structured Form Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                          فرم ارسال پیام، پیشنهاد و ارتباط با پشتیبانی
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          موضوع پیام را انتخاب کرده و مشخصات خود را با دقت وارد نمایید
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-extrabold">
                      ● ثبت آنی با کد رهگیری
                    </span>
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                      {error}
                    </div>
                  )}

                  {/* 2x2 Architectural Topic Selector Grid (Zero Text Truncation!) */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-extrabold text-slate-800 block">
                      ۱. موضوع پیام خود را انتخاب کنید
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {TOPIC_OPTIONS.map((item) => {
                        const Icon = item.icon;
                        const active = topic === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setTopic(item.key)}
                            className={`p-3.5 rounded-2xl border text-right flex items-center justify-between gap-3 transition-all ${
                              active
                                ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/15 shadow-2xs'
                                : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                  active
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-white border border-slate-200/80 text-slate-500'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span
                                  className={`text-xs sm:text-sm font-extrabold block ${
                                    active ? 'text-emerald-950' : 'text-slate-800'
                                  }`}
                                >
                                  {item.label}
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  {item.desc}
                                </span>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                active
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {active && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Name & Contact Info Side by Side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 block">
                        ۲. نام و نام خانوادگی شما
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: علی احمدی"
                        className="w-full h-12 px-4 rounded-xl bg-slate-50/70 focus:bg-white border border-slate-200/90 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 focus:outline-none text-xs sm:text-sm font-medium text-slate-900 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 block">
                        ۳. شماره موبایل یا ایمیل (جهت پاسخگویی)
                      </label>
                      <input
                        type="text"
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        placeholder="مثال: ۰۹۱۲۱۲۳۴۵۶۷ یا ایمیل"
                        className="w-full h-12 px-4 rounded-xl bg-slate-50/70 focus:bg-white border border-slate-200/90 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 focus:outline-none text-xs sm:text-sm font-medium text-slate-900 text-right transition-all"
                      />
                    </div>
                  </div>

                  {/* Step 3: Message Textarea */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-800 block">
                      ۴. متن کامل پیام، پیشنهاد یا گزارش شما
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="لطفاً جزئیات پیشنهاد، سوال یا بازخورد خود را با دقت بنویسید..."
                      className="w-full p-4 rounded-xl bg-slate-50/70 focus:bg-white border border-slate-200/90 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 focus:outline-none text-xs sm:text-sm font-medium text-slate-900 leading-relaxed resize-none transition-all"
                    />
                  </div>

                  {/* Form Footer */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>ثبت مستقیم در صندوق پیام‌های مدیریت همراه با کد پیگیری اختصاصی</span>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto h-11 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap shrink-0"
                    >
                      <Send className="w-4 h-4 shrink-0" />
                      <span>{submitting ? 'در حال ثبت پیام...' : 'ثبت و ارسال پیام'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
