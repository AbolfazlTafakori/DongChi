"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Headphones,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Smartphone,
  CreditCard,
  Users,
  Calculator,
  ShieldCheck,
  HelpCircle,
  ArrowLeft,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { toPersianDigits } from "@/lib/money";

interface LocalTicket {
  trackingCode: string;
  topicTitle: string;
  message: string;
  date: string;
}

const SUPPORT_TOPICS = [
  {
    key: "accounting",
    apiTopic: "BILLING" as const,
    title: "سوال درباره محاسبات و دنگ",
    desc: "ابهام در تراز مالی، گرد کردن یا تسویه بدهی",
  },
  {
    key: "subscription",
    apiTopic: "BILLING" as const,
    title: "اشتراک پرو طلایی و مکس",
    desc: "فعال‌سازی پلن خانه، فاکتور و تمدید اشتراک",
  },
  {
    key: "bug",
    apiTopic: "BUG" as const,
    title: "گزارش خطا یا مشکل فنی",
    desc: "اشکال در ثبت خرج، انتقال یا نمایش صفحات",
  },
  {
    key: "feature",
    apiTopic: "FEATURE" as const,
    title: "پیشنهاد قابلیت جدید",
    desc: "ایده‌ها و امکانات مدنظر شما برای توسعه دنگ‌چی",
  },
];

export default function SupportPage() {
  const { toast } = useToast();

  const [selectedTopic, setSelectedTopic] = useState("accounting");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [myTickets, setMyTickets] = useState<LocalTicket[]>([]);

  // Fetch logged in user details to autofill name & phone
  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (data.user.name) setUserName(data.user.name);
          if (data.user.phone) setUserPhone(data.user.phone);
        }
      })
      .catch(() => {});
  }, []);

  // Load recent tickets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dongchi_my_tickets");
      if (stored) {
        setMyTickets(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const activeTopicObj = SUPPORT_TOPICS.find((t) => t.key === selectedTopic) || SUPPORT_TOPICS[0];

    if (!userName.trim() || userName.trim().length < 2) {
      setFormError("لطفاً نام و نام خانوادگی خود را وارد کنید.");
      return;
    }
    if (!userPhone.trim() || userPhone.trim().length < 5) {
      setFormError("لطفاً شماره تماس معتبر جهت پاسخگویی وارد کنید.");
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setFormError("متن تیکت باید حداقل ۱۰ کاراکتر باشد.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName.trim(),
          contactInfo: userPhone.trim(),
          topic: activeTopicObj.apiTopic,
          message: `[${activeTopicObj.title}] ${message.trim()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ثبت تیکت پشتیبانی.");
      }

      const trackingCode = data.item?.trackingCode || "DC-" + Math.floor(10000 + Math.random() * 90000);
      setSubmittedTicket(trackingCode);
      setMessage("");

      // Save to local tickets history
      const newTicket: LocalTicket = {
        trackingCode,
        topicTitle: activeTopicObj.title,
        message: message.trim(),
        date: new Date().toISOString(),
      };
      const updatedList = [newTicket, ...myTickets].slice(0, 10);
      setMyTickets(updatedList);
      try {
        localStorage.setItem("dongchi_my_tickets", JSON.stringify(updatedList));
      } catch {}

      toast.success("تیکت شما با موفقیت ثبت شد و به کارتابل تیم فنی ارسال گردید.");
    } catch (err: any) {
      setFormError(err.message || "خطای ارتباط با سرور. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-1.5 rounded-[26px] bg-slate-200/60 border border-slate-200/90 shadow-2xs">
        <div className="bg-white rounded-[20px] border border-slate-200/90 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
                  پشتیبانی و مرکز راهنمای دنگ‌چی
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-extrabold">
                  پاسخگویی سریع
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ارسال مستقیم تیکت به تیم فنی، پیگیری کد رهگیری و راهنمای گام‌به‌گام سامانه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/faq"
              className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span>۱۰ سوال متداول</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main 12-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* RIGHT COLUMN (7 Cols): Support Ticket Form & Ticket Tracking History */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-1.5 rounded-[26px] bg-slate-200/60 border border-slate-200/90 shadow-2xs">
            <div className="bg-white rounded-[20px] border border-slate-200/90 p-6 sm:p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                    ارسال مستقیم تیکت یا گزارش
                  </h2>
                </div>
                <span className="text-[11px] text-slate-500 font-bold">
                  میانگین پاسخگویی: کمتر از ۲ ساعت
                </span>
              </div>

              {submittedTicket && (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-extrabold">
                      تیکت شما با موفقیت ثبت شد
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900/80 leading-relaxed">
                    کارشناسان فنی پیام شما را بررسی کرده و نتیجه را از طریق تماس یا پیامک اطلاع می‌دهند.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600 font-bold">کد پیگیری:</span>
                      <span
                        dir="ltr"
                        className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-mono text-xs font-black tracking-wider"
                      >
                        {submittedTicket}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmittedTicket(null)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                    >
                      ارسال پیام جدید
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    {formError}
                  </div>
                )}

                {/* Topic Selector 2x2 Grid */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-800 block">
                    ۱. موضوع درخواست خود را مشخص کنید:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SUPPORT_TOPICS.map((topic) => {
                      const isActive = selectedTopic === topic.key;
                      return (
                        <button
                          key={topic.key}
                          type="button"
                          onClick={() => setSelectedTopic(topic.key)}
                          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-1.5 ${
                            isActive
                              ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/15 shadow-2xs"
                              : "bg-slate-50/60 hover:bg-slate-50 border-slate-200/90"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900">
                              {topic.title}
                            </span>
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isActive ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                              }`}
                            >
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            {topic.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sender Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      ۲. نام و نام خانوادگی
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="مثال: آرش علوی"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      ۳. شماره تماس یا ایمیل
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="مثال: ۰۹۱۲۱۲۳۴۵۶۷"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all text-right"
                    />
                  </div>
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">
                    ۴. شرح درخواست یا مشکل
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="لطفاً جزئیات سوال، پیشنهاد یا خطای مشاهده‌شده را با دقت بنویسید..."
                    className="w-full p-3.5 rounded-xl border border-slate-200/90 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all resize-none leading-relaxed"
                  />
                  <span className="text-[11px] text-slate-400 block text-left">
                    حداقل ۱۰ کاراکتر
                  </span>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>در حال ارسال تیکت...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 shrink-0" />
                      <span>ثبت و ارسال تیکت به پشتیبانی</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Ticket History Strip (Saved in LocalStorage) */}
          {myTickets.length > 0 && (
            <div className="p-1.5 rounded-[24px] bg-slate-200/60 border border-slate-200/90 shadow-2xs">
              <div className="bg-white rounded-[18px] border border-slate-200/90 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>تیکت‌های اخیر شما</span>
                  </div>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {toPersianDigits(myTickets.length)} مورد
                  </span>
                </div>

                <div className="space-y-2">
                  {myTickets.map((ticket, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-900 block truncate">
                          {ticket.topicTitle}
                        </span>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {ticket.message}
                        </p>
                      </div>
                      <div className="text-left shrink-0">
                        <span
                          dir="ltr"
                          className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 font-mono text-[10px] font-extrabold tracking-wider block"
                        >
                          {ticket.trackingCode}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          ثبت‌شده
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LEFT COLUMN (5 Cols): 4 Golden Steps & PWA Installation Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card A: 4 Golden Steps to Master DongChi */}
          <div className="p-1.5 rounded-[26px] bg-slate-200/60 border border-slate-200/90 shadow-2xs">
            <div className="bg-white rounded-[20px] border border-slate-200/90 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    راهنمای ۴ گام طلایی کار با دنگ‌چی
                  </h2>
                  <span className="text-[11px] text-slate-400 block">
                    روال استاندارد مدیریت مالی جمع‌های دوستانه
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {/* Step 1 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">
                      ۱. ثبت شماره کارت در پروفایل
                    </span>
                    <Link
                      href="/app/profile"
                      className="text-[11px] font-extrabold text-emerald-700 hover:text-emerald-800"
                    >
                      ویرایش کارت ←
                    </Link>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    با وارد کردن کارت، هم‌خانه‌ها می‌توانند سهم بدهی شما را با یک کلیک کارت‌به‌کارت کنند.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-xs font-extrabold text-slate-900 block">
                    ۲. ساخت گروه و تعریف کارت مشترک خانه
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    گروه را بسازید، لینک دعوت را بفرستید و در صورت داشتن کارت مشترک، آن را به عنوان صندوق تعریف کنید.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-xs font-extrabold text-slate-900 block">
                    ۳. ثبت خرج با ۴ روش دنگ‌بندی
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    هزینه‌ها را بر اساس سهم مساوی، دقیق ریالی، درصدی یا سهمیه‌ای تقسیم و ثبت نمایید.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-xs font-extrabold text-slate-900 block">
                    ۴. تطبیق موجودی و بستن دوره ماهانه
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    در پایان ماه، با زدن دکمه تسویه خودکار کل بدهی‌ها به کمترین تعداد تراکنش تبدیل می‌شود.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: PWA Native Installation Instructions */}
          <div className="p-1.5 rounded-[26px] bg-slate-200/60 border border-slate-200/90 shadow-2xs">
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-[20px] border border-slate-800 p-5 sm:p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white">
                    نصب نسخه موبایل و ویندوز (PWA)
                  </h2>
                  <span className="text-[11px] text-slate-400 block">
                    بدون نیاز به دانلود فایل و به‌روزرسانی دستی
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                دنگ‌چی یک وب‌اپلیکیشن پیش‌رونده (PWA) است و می‌توانید آن را مستقیماً مانند یک اپلیکیشن بومی روی صفحه اصلی گوشی یا دسکتاپ نصب کنید:
              </p>

              <div className="space-y-3 pt-1">
                {/* Android / Windows Chrome */}
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                  <span className="text-xs font-extrabold text-emerald-400 block">
                    در اندروید و ویندوز (مرورگر Chrome):
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    منوی ۳ نقطه بالای مرورگر را باز کرده و گزینه <strong>«نصب برنامه» (Install App)</strong> را انتخاب کنید.
                  </p>
                </div>

                {/* iPhone Safari */}
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                  <span className="text-xs font-extrabold text-amber-300 block">
                    در آیفون (مرورگر Safari):
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    دکمه <strong>اشتراک‌گذاری (Share)</strong> در پایین صفحه را بزنید و گزینه <strong>«Add to Home Screen»</strong> را لمس کنید.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
