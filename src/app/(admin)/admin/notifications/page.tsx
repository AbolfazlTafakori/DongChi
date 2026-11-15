"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Send,
  Users,
  Crown,
  User,
  Info,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import type { AppNotificationItem, NotificationTarget, NotificationLevel } from "@/lib/notification-store";
import { toPersianDigits } from "@/lib/money";

const TARGET_OPTIONS: { key: NotificationTarget; label: string; desc: string; icon: any }[] = [
  { key: "ALL", label: "همه کاربران", desc: "کل اعضای ثبت‌نام شده در سامانه", icon: Users },
  { key: "FREE_ONLY", label: "فقط کاربران رایگان", desc: "کمپین‌های تخفیف و ارتقا به Pro", icon: User },
  { key: "PRO_ONLY", label: "فقط مشترکین Pro و Max", desc: "اطلاع‌رسانی فیچرهای ویژه", icon: Crown },
  { key: "USER", label: "کاربر خاص (موبایل)", desc: "ارسال اختصاصی به یک شماره خاص", icon: SmartphoneIcon },
];

function SmartphoneIcon(props: any) {
  return <User {...props} />;
}

const LEVEL_OPTIONS: { key: NotificationLevel; label: string; colorClass: string; borderClass: string }[] = [
  { key: "INFO", label: "اطلاع‌رسانی (آبی)", colorClass: "bg-blue-50 text-blue-700", borderClass: "border-blue-300" },
  { key: "SUCCESS", label: "موفقیت / قابلیت جدید (سبز)", colorClass: "bg-emerald-50 text-emerald-700", borderClass: "border-emerald-300" },
  { key: "WARNING", label: "هشدار مهم (نارنجی)", colorClass: "bg-amber-50 text-amber-800", borderClass: "border-amber-300" },
  { key: "PROMO", label: "پیشنهاد ویژه فروش (طلایی)", colorClass: "bg-yellow-50 text-yellow-800", borderClass: "border-yellow-400" },
];

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<NotificationTarget>("ALL");
  const [targetPhone, setTargetPhone] = useState("");
  const [level, setLevel] = useState<NotificationLevel>("INFO");
  const [actionLabel, setActionLabel] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [isPinnedBanner, setIsPinnedBanner] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      toast.error("خطا در بارگذاری اعلان‌ها.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      toast.error("عنوان اعلان باید حداقل ۳ کاراکتر باشد.");
      return;
    }
    if (!body.trim() || body.trim().length < 5) {
      toast.error("متن پیام باید حداقل ۵ کاراکتر باشد.");
      return;
    }
    if (target === "USER" && !targetPhone.trim()) {
      toast.error("لطفاً شماره موبایل کاربر هدف را وارد کنید.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          level,
          target,
          targetPhone: target === "USER" ? targetPhone.trim() : undefined,
          actionLabel: actionLabel.trim() || undefined,
          actionUrl: actionUrl.trim() || undefined,
          isPinnedBanner,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ایجاد اعلان.");
      }

      toast.success("اعلان با موفقیت ایجاد و منتشر گردید.");
      setTitle("");
      setBody("");
      setActionLabel("");
      setActionUrl("");
      setIsPinnedBanner(false);
      fetchNotifications();
    } catch (err: any) {
      toast.error(err.message || "خطا در ارسال اعلان");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (notifId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/notifications/${notifId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, isActive: !currentActive } : n))
        );
        toast.info(currentActive ? "اعلان متوقف شد." : "اعلان مجدداً فعال شد.");
      }
    } catch {
      toast.error("خطا در تغییر وضعیت اعلان.");
    }
  };

  const handleDelete = async (notifId: string) => {
    if (!confirm("آیا از حذف این اعلان اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/notifications/${notifId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notifId));
        toast.success("اعلان با موفقیت حذف شد.");
      }
    } catch {
      toast.error("خطا در حذف اعلان.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-white">مرکز نوتیفیکیشن و ارسال اعلان‌های هدفمند</h1>
          </div>
          <p className="text-xs text-slate-400">
            ارسال پیام همگانی، کمپین‌های ارتقا به کاربران رایگان، اطلاعیه‌های مهم و پیام خصوصی به شماره خاص
          </p>
        </div>

        <button
          type="button"
          onClick={fetchNotifications}
          className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-all self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>بروزرسانی آمار</span>
        </button>
      </div>

      {/* Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* RIGHT COLUMN (5 Cols): Notification Composer Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-black text-slate-900">فرم ایجاد و انتشار اعلان جدید</h2>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                تحویل آنی در اپ
              </span>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Target Audience */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">جامعه هدف (گیرندگان اعلان):</label>
                <div className="grid grid-cols-2 gap-2">
                  {TARGET_OPTIONS.map((opt) => {
                    const isSel = target === opt.key;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setTarget(opt.key)}
                        className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                          isSel
                            ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/15"
                            : "bg-slate-50/60 hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">{opt.label}</span>
                          <Icon className={`w-3.5 h-3.5 ${isSel ? "text-emerald-600" : "text-slate-400"}`} />
                        </div>
                        <span className="text-[10px] text-slate-400 truncate">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Phone if target === USER */}
              {target === "USER" && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <label className="text-xs font-bold text-amber-900 block">شماره موبایل کاربر هدف:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="09121234567"
                    className="w-full h-10 px-3 rounded-xl border border-amber-300 bg-white font-mono text-xs font-bold text-center"
                  />
                </div>
              )}

              {/* Notification Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">سطح و تم رنگی اعلان:</label>
                <div className="grid grid-cols-2 gap-2">
                  {LEVEL_OPTIONS.map((lvl) => (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => setLevel(lvl.key)}
                      className={`p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        level === lvl.key
                          ? `${lvl.colorClass} ${lvl.borderClass} ring-2 ring-slate-400/20 shadow-2xs`
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">عنوان نوتیفیکیشن:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تخفیف ویژه ۴۰٪ تمدید سالانه پرو"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">متن کامل پیام:</label>
                <textarea
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="جزئیات اعلان یا پیام تبریک، اطلاع‌رسانی یا راهنمای کاربری..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none leading-relaxed"
                />
              </div>

              {/* Action Button (Optional) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">متن دکمه اقدام (اختیاری):</label>
                  <input
                    type="text"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    placeholder="مثال: ارتقا به پرو"
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">لینک دکمه (مثال: /app/billing):</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    placeholder="/app/billing"
                    className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-left"
                  />
                </div>
              </div>

              {/* Pinned Top Banner Toggle */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">سنجاق در بالای پیشخوان (/app):</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">نمایش در باکس بنر سراسری داشبورد</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPinnedBanner(!isPinnedBanner)}
                  className="cursor-pointer"
                >
                  {isPinnedBanner ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "در حال ارسال..." : "ارسال و انتشار آنی نوتیفیکیشن"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* LEFT COLUMN (7 Cols): Sent Notifications History & Read Counts */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-black text-slate-900">تاریخچه اعلان‌های ارسالی سیستم</h2>
              </div>
              <span className="text-xs text-slate-400 tabular-nums">
                {toPersianDigits(notifications.length)} اعلان ثبت‌شده
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">
                در حال بارگذاری لیست اعلان‌ها...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                هنوز اعلانی ثبت نشده است. از فرم سمت راست اولین نوتیفیکیشن را بفرستید.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => {
                  const levelMatch = LEVEL_OPTIONS.find((l) => l.key === notif.level) || LEVEL_OPTIONS[0];
                  const targetMatch = TARGET_OPTIONS.find((t) => t.key === notif.target) || TARGET_OPTIONS[0];

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                        notif.isActive ? "bg-slate-50/70 border-slate-200/90" : "bg-slate-100/50 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{notif.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${levelMatch.colorClass}`}
                            >
                              {levelMatch.label.split(" ")[0]}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold">
                              {targetMatch.label}
                            </span>
                            {notif.isPinnedBanner && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                                📌 بنر بالای داشبورد
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed text-justify">{notif.body}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(notif.id, notif.isActive)}
                            title={notif.isActive ? "توقف ارسال" : "فعال‌سازی مجدد"}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 cursor-pointer"
                          >
                            {notif.isActive ? (
                              <ToggleRight className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(notif.id)}
                            title="حذف اعلان"
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Footer Info Strip */}
                      <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-bold text-slate-700">
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>خوانده شده توسط:</span>
                            <strong className="text-emerald-700 tabular-nums">
                              {toPersianDigits(notif.readByUserIds.length)} نفر
                            </strong>
                          </span>
                          {notif.targetPhone && (
                            <span className="font-mono text-slate-500">شماره: {notif.targetPhone}</span>
                          )}
                        </div>

                        {notif.actionUrl && (
                          <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                            <span>{notif.actionLabel || "لینک اقدام"}</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
