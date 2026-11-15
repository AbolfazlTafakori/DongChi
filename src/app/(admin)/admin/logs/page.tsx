"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { formatToman, toPersianDigits } from "@/lib/money";
import {
  ShieldAlert,
  ShieldCheck,
  Megaphone,
  Smartphone,
  Activity,
  History,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Lock,
  PiggyBank,
} from "lucide-react";

export default function AdminLogsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [announcementType, setAnnouncementType] = useState<"info" | "warning" | "success">("info");
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/logs");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "خطا در دریافت لاگ‌ها");
      }
      const json = await res.json();
      setData(json);
      if (json.announcement) {
        setAnnouncementMsg(json.announcement.message);
        setAnnouncementType(json.announcement.type);
        setAnnouncementActive(json.announcement.isActive);
      }
    } catch (err: any) {
      setError(err.message || "خطا در بارگذاری لاگ‌های سیستم");
      toast.error(err.message || "خطا در بارگذاری لاگ‌های سیستم");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;

    setSavingAnnouncement(true);
    try {
      const res = await fetch("/api/admin/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: announcementMsg.trim(),
          type: announcementType,
          isActive: announcementActive,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطا در ثبت اطلاعیه");
      toast.success("اطلاعیه سراسری سیستم با موفقیت به‌روزرسانی شد.");
      fetchLogs();
    } catch (err: any) {
      toast.error(err.message || "خطا در ذخیره اطلاعیه.");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-60 bg-slate-200 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const logs = data?.logs || {};

  return (
    <div className="space-y-6">
      {/* 1. Header with Refresh Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            لاگ‌های امنیتی و مدیریت اطلاعیه‌ها
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            رصد زنده وضعیت درخواست‌های احراز هویت، تاریخچه تغییرات سیستمی و مدیریت بنر اعلان سراسری
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          className="text-xs gap-1.5 self-end sm:self-auto"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          به‌روزرسانی داده‌ها
        </Button>
      </div>

      {/* 2. System Announcement Banner Manager */}
      <Card className="p-6 shadow-xs border-slate-200">
        <CardHeader className="p-0 pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-600" />
              مدیریت بنر اطلاعیه سراسری سیستم (نمایش در بالای داشبورد کاربران)
            </CardTitle>
            <Badge
              variant={announcementActive ? "credit" : "neutral"}
              size="sm"
              className="text-[10px]"
            >
              {announcementActive ? "فعال و در حال نمایش" : "غیرفعال"}
            </Badge>
          </div>
        </CardHeader>

        <form onSubmit={handleSaveAnnouncement} className="space-y-4">
          <Input
            label="متن پیام اطلاعیه"
            placeholder="مثال: سامانه در تاریخ ۲۵ آبان به مدت ۱۰ دقیقه به‌روزرسانی خواهد شد..."
            value={announcementMsg}
            onChange={(e) => setAnnouncementMsg(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                نوع پیام (رنگ‌بندی بنر)
              </label>
              <select
                value={announcementType}
                onChange={(e) => setAnnouncementType(e.target.value as any)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="info">اطلاع‌رسانی آبی (Info)</option>
                <option value="warning">هشدار زرد/نارنجی (Warning)</option>
                <option value="success">موفقیت سبز (Success)</option>
              </select>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-4 pt-6">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={announcementActive}
                  onChange={(e) => setAnnouncementActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>فعال بودن نمایش بنر برای کاربران</span>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="mr-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs"
                isLoading={savingAnnouncement}
              >
                ذخیره و انتشار اطلاعیه
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* 3. Operational & Security Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent OTP Requests Log */}
        <Card className="p-5 shadow-xs border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">
                آخرین کدهای درخواستی OTP (۲۰ مورد اخیر)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">شماره‌ها ماسک شده‌اند</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 pb-2">
                  <th className="py-2 font-medium">شماره موبایل</th>
                  <th className="py-2 font-medium">وضعیت</th>
                  <th className="py-2 font-medium">زمان ارسال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(logs.recentOtps || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">
                      هیچ درخواستی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  (logs.recentOtps || []).map((otp: any) => (
                    <tr key={otp.id} className="hover:bg-slate-50">
                      <td className="py-2 font-mono tabular-nums text-slate-800">
                        {otp.maskedPhone}
                      </td>
                      <td className="py-2">
                        {otp.used ? (
                          <Badge variant="credit" size="sm" className="text-[10px] py-0">
                            مصرف‌شده ✓
                          </Badge>
                        ) : new Date(otp.expiresAt) < new Date() ? (
                          <Badge variant="neutral" size="sm" className="text-[10px] py-0 text-slate-400">
                            منقضی
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm" className="text-[10px] py-0">
                            معتبر
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 text-slate-400 tabular-nums text-[11px]">
                        {toPersianDigits(
                          new Date(otp.createdAt).toLocaleTimeString("fa-IR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* System Audit Logs */}
        <Card className="p-5 shadow-xs border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900">
                تاریخچه تغییرات سیستمی و اسناد (Audit)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">حفظ محرمانگی مبالغ</span>
          </div>

          <div className="overflow-y-auto max-h-[350px] divide-y divide-slate-100">
            {(logs.recentAudits || []).length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                هیچ رویدادی ثبت نشده است.
              </p>
            ) : (
              (logs.recentAudits || []).map((audit: any) => (
                <div key={audit.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{audit.userName}</span>
                      <Badge variant="neutral" size="sm" className="text-[10px] py-0">
                        {audit.action}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      در گروه: {audit.groupTitle}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 tabular-nums">
                    {toPersianDigits(
                      new Date(audit.createdAt).toLocaleDateString("fa-IR")
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 4. Fund Reconciliations & Deposits Activity */}
      <Card className="p-5 shadow-xs border-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              گردش حساب صندوق‌های مشترک خانه‌ها (واریز و تطبیق موجودی)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">آخرین عملیات صندوق‌ها</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 pb-2">
                <th className="py-2 font-medium">نوع عملیات</th>
                <th className="py-2 font-medium">گروه و صندوق</th>
                <th className="py-2 font-medium">کاربر مجری</th>
                <th className="py-2 font-medium">مبلغ</th>
                <th className="py-2 font-medium">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(logs.recentFundTxs || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    هیچ تراکنش صندوقی ثبت نشده است.
                  </td>
                </tr>
              ) : (
                (logs.recentFundTxs || []).map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-2.5">
                      <Badge
                        variant={tx.type === "DEPOSIT" ? "credit" : "warning"}
                        size="sm"
                        className="text-[10px] py-0"
                      >
                        {tx.type === "DEPOSIT" ? "شارژ صندوق" : "تطبیق موجودی"}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-slate-800">
                      <span className="font-semibold">{tx.groupTitle}</span>
                      <span className="text-[11px] text-slate-400 block -mt-0.5">
                        {tx.fundTitle}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-700">{tx.userName}</td>
                    <td className="py-2.5 font-bold tabular-nums text-slate-900">
                      {formatToman(BigInt(tx.amount))}
                    </td>
                    <td className="py-2.5 text-slate-400 tabular-nums text-[11px]">
                      {toPersianDigits(
                        new Date(tx.createdAt).toLocaleDateString("fa-IR")
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
