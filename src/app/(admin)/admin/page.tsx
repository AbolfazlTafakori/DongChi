"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { formatToman, toPersianDigits } from "@/lib/money";
import {
  Users,
  Layers,
  CreditCard,
  DollarSign,
  Receipt,
  Crown,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Activity,
  Zap,
  Gift,
  Sliders,
  Bell,
  Sparkles,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  bannedUsers: number;
  totalGroups: number;
  totalExpensesCount: number;
  totalExpensesVolume: string;
  activeProSubscriptions: number;
  totalSuccessfulRevenue: string;
  smsMode: "LIVE" | "DEV_SANDBOX";
  recentOtpsLast24h: number;
  recentTransactions: Array<{
    id: string;
    amount: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    createdAt: string;
    refId: string | null;
    user: { id: string; name: string; phone: string };
    plan: { title: string; slug: string };
  }>;
}

export default function AdminOverviewPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick grant Pro state
  const [quickPhone, setQuickPhone] = useState("");
  const [isGrantingPro, setIsGrantingPro] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `خطا در دریافت آمار سیستم (${res.status}).`);
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error("fetchStats error:", err);
      setError(err.message || "خطای ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickGrantPro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhone.trim()) return;

    setIsGrantingPro(true);
    try {
      const usersRes = await fetch("/api/admin/users");
      const usersData = await usersRes.json();
      const targetUser = usersData.users?.find(
        (u: any) => u.phone === quickPhone.trim()
      );

      if (!targetUser) {
        throw new Error("کاربری با این شماره موبایل یافت نشد.");
      }

      const grantRes = await fetch(`/api/admin/users/${targetUser.id}/grant-pro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 30 }),
      });

      if (!grantRes.ok) throw new Error("خطا در اعطای اشتراک Pro.");

      toast.success(`اشتراک ۳۰ روزه ویژه به ${targetUser.name || quickPhone} اعطا شد.`);
      setQuickPhone("");
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || "خطا در عملیات اعطای اشتراک.");
    } finally {
      setIsGrantingPro(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-white/70 animate-pulse rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 rounded-3xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-3">
        <p className="font-bold">{error || "خطا در پردازش اطلاعات داشبورد مدیریت."}</p>
        <Button variant="outline" size="sm" onClick={fetchStats}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Executive Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              مانیتورینگ عملیات، حسابداری و سلامت زیرساخت
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            پایش بی‌درنگ تراکنش‌های درگاه شتاب، ثبت اسناد خانه‌ها و حجم گردش مالی پلتفرم
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>محاسبات BigInt بدون خطا</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>کد تستی OTP: ۱۲۳۴۵</span>
          </div>
        </div>
      </div>

      {/* 2. Structured Quick Access Cards (Bento style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/settings"
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-2xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block group-hover:text-amber-800 transition-colors">
                تنظیمات درگاه، پیامک و متون سایت (CMS)
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                تغییر درگاه زرین‌پال/زیبال، کلید کاوه‌نگار، تست ارسال و تیتر صفحه اول
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
        </Link>

        <Link
          href="/admin/notifications"
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-2xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block group-hover:text-emerald-800 transition-colors">
                مرکز نوتیفیکیشن و ارسال اعلان کاربران
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                ارسال اعلان هدفمند به کاربران رایگان، مشترکین Pro یا شماره خاص
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </Link>
      </div>

      {/* 3. Top 6 Macro KPI Cards (Balanced Equal-Height Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Total Users */}
        <div className="h-full flex flex-col justify-between p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">کاربران ثبت‌نامی</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              {toPersianDigits(stats.totalUsers)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            {stats.bannedUsers > 0 ? (
              <span className="text-red-600 font-bold">
                {toPersianDigits(stats.bannedUsers)} مسدود
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">۱۰۰٪ اعضا فعال</span>
            )}
          </div>
        </div>

        {/* Total Groups */}
        <div className="h-full flex flex-col justify-between p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">گروه‌های خانه</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              {toPersianDigits(stats.totalGroups)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            خانه‌ها و جمع‌های مالی
          </div>
        </div>

        {/* Total Expenses Count */}
        <div className="h-full flex flex-col justify-between p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">کل اسناد مالی</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              {toPersianDigits(stats.totalExpensesCount)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            فاکتورهای ثبت‌شده
          </div>
        </div>

        {/* Expenses Volume */}
        <div className="h-full flex flex-col justify-between p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-purple-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">گردش مالی خانه‌ها</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-base font-black text-slate-900 tabular-nums truncate">
              {formatToman(BigInt(stats.totalExpensesVolume))}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            مجموع مبالغ دنگ‌ها
          </div>
        </div>

        {/* Active Pro Subs */}
        <div className="h-full flex flex-col justify-between p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">اشتراک‌های Pro</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 tabular-nums">
              {toPersianDigits(stats.activeProSubscriptions)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            کاربران ویژه فعال
          </div>
        </div>

        {/* Revenue */}
        <div className="h-full flex flex-col justify-between p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">درآمد فروش اشتراک</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-base font-black text-emerald-600 tabular-nums truncate">
              {formatToman(BigInt(stats.totalSuccessfulRevenue))}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            تراکنش‌های درگاه بانک
          </div>
        </div>
      </div>

      {/* 4. Balanced 12-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Gateway Transactions (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="shadow-2xs overflow-hidden border-slate-200/90">
            <CardHeader className="border-b border-slate-100 p-4 sm:p-5 flex flex-row items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-500" />
                آخرین تراکنش‌های درگاه پرداخت
              </CardTitle>
              <Link
                href="/admin/billing"
                className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
              >
                <span>مشاهده همه</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {stats.recentTransactions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  هنوز هیچ تراکنشی در سیستم ثبت نشده است.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.recentTransactions.map((tx) => {
                    let badge = (
                      <Badge variant="warning" size="sm">
                        در انتظار
                      </Badge>
                    );
                    if (tx.status === "SUCCESS") {
                      badge = (
                        <Badge variant="credit" size="sm">
                          موفق
                        </Badge>
                      );
                    } else if (tx.status === "FAILED") {
                      badge = (
                        <Badge variant="debt" size="sm">
                          ناموفق
                        </Badge>
                      );
                    }

                    return (
                      <div
                        key={tx.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            💳
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">
                                {tx.user?.name || "کاربر"} ({toPersianDigits(tx.user?.phone || "")})
                              </span>
                              {badge}
                            </div>
                            <span className="text-[11px] text-slate-400 tabular-nums">
                              {tx.plan?.title} • {new Date(tx.createdAt).toLocaleDateString("fa-IR")}
                              {tx.refId && ` • پیگیری: ${toPersianDigits(tx.refId)}`}
                            </span>
                          </div>
                        </div>

                        <div className="text-left font-black text-xs text-slate-900 tabular-nums">
                          {formatToman(BigInt(tx.amount))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions & Infrastructure (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Grant Pro Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900">
                  اعطای سریع اشتراک Pro با موبایل
                </h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  فعال‌سازی ۳۰ روزه بدون نیاز به درگاه پرداخت
                </span>
              </div>
            </div>

            <form onSubmit={handleQuickGrantPro} className="space-y-3">
              <Input
                label="شماره موبایل کاربر"
                placeholder="09121111111"
                numericOnly
                maxLength={11}
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-xs"
                isLoading={isGrantingPro}
              >
                اعطای اشتراک ۳۰ روزه ویژه
              </Button>
            </form>
          </div>

          {/* Infrastructure Health Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900">
                  وضعیت سلامت سرویس‌ها
                </h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ارتباط آنلاین با درگاه بانکی و پنل پیامک
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-700 p-2 rounded-xl bg-slate-50/80">
                <span className="text-slate-500">پیامک احراز هویت:</span>
                <span className="font-bold text-emerald-700">
                  {stats.smsMode === "LIVE" ? "پنل کاوه‌نگار فعال" : "کد تستی ۱۲۳۴۵"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700 p-2 rounded-xl bg-slate-50/80">
                <span className="text-slate-500">OTPهای ۲۴ ساعت گذشته:</span>
                <span className="font-bold tabular-nums text-slate-900">
                  {toPersianDigits(stats.recentOtpsLast24h)} پیامک
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700 p-2 rounded-xl bg-slate-50/80">
                <span className="text-slate-500">درگاه پرداخت شتاب:</span>
                <span className="font-bold text-indigo-700">
                  شبیه‌ساز هوشمند شاپرک
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/admin/logs"
                className="w-full h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center justify-between px-3 transition-colors"
              >
                <span>مشاهده لاگ‌های امنیتی و اطلاعیه‌ها</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
