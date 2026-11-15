"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { toPersianDigits } from "@/lib/money";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Crown,
  Gift,
  X,
  UserCheck,
  UserX,
  Phone,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "USER" | "ADMIN";
  isBanned: boolean;
  createdAt: string;
  groupCount: number;
  expenseCount: number;
  isPro: boolean;
  proPlanTitle: string | null;
  proExpiresAt: string | null;
  remainingDays: number;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "danger" | "warning" | "primary";
    action: () => Promise<void>;
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Grant Pro Modal state
  const [activeUserForPro, setActiveUserForPro] = useState<AdminUser | null>(null);
  const [grantDays, setGrantDays] = useState("30");
  const [isGranting, setIsGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "خطا در دریافت لیست کاربران.");
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || "خطای ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleBan = (user: AdminUser) => {
    const actionText = user.isBanned ? "رفع مسدودیت" : "مسدودسازی";
    setConfirmConfig({
      isOpen: true,
      title: `${actionText} حساب کاربر`,
      description: `آیا از ${actionText} کاربر «${user.name}» (${toPersianDigits(user.phone)}) اطمینان دارید؟`,
      variant: user.isBanned ? "primary" : "danger",
      action: async () => {
        setIsConfirming(true);
        try {
          const res = await fetch(`/api/admin/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isBanned: !user.isBanned }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "خطا در انجام عملیات.");
          toast.success(`عملیات ${actionText} با موفقیت انجام شد.`);
          setConfirmConfig(null);
          await fetchUsers();
        } catch (err: any) {
          toast.error(err.message || "خطا در انجام عملیات.");
        } finally {
          setIsConfirming(false);
        }
      },
    });
  };

  const handleToggleRole = (user: AdminUser) => {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    const actionText =
      nextRole === "ADMIN" ? "ارتقا به مدیر سیستم" : "تبدیل به کاربر عادی";
    setConfirmConfig({
      isOpen: true,
      title: `${actionText}`,
      description: `آیا از تغییر نقش کاربر «${user.name}» به ${nextRole === "ADMIN" ? "مدیر ارشد" : "کاربر عادی"} اطمینان دارید؟`,
      variant: nextRole === "ADMIN" ? "primary" : "warning",
      action: async () => {
        setIsConfirming(true);
        try {
          const res = await fetch(`/api/admin/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: nextRole }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "خطا در انجام عملیات.");
          toast.success(`نقش کاربر با موفقیت تغییر یافت.`);
          setConfirmConfig(null);
          await fetchUsers();
        } catch (err: any) {
          toast.error(err.message || "خطا در تغییر نقش.");
        } finally {
          setIsConfirming(false);
        }
      },
    });
  };

  const handleGrantProSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUserForPro) return;

    try {
      setIsGranting(true);
      setGrantError(null);
      const res = await fetch(`/api/admin/users/${activeUserForPro.id}/grant-pro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: Number(grantDays) || 30 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در اعطای اشتراک.");

      toast.success(data.message || "اشتراک با موفقیت اعمال گردید.");
      setActiveUserForPro(null);
      setGrantDays("30");
      await fetchUsers();
    } catch (err: any) {
      setGrantError(err.message);
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            مدیریت کاربران سامانه
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده اطلاعات، مسدودسازی، تغییر سطح دسترسی و اعطای اشتراک Pro
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="جستجو با نام یا موبایل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs h-9 w-full sm:w-56"
            rightIcon={<Search className="w-3.5 h-3.5" />}
          />
          <Button type="submit" variant="primary" size="sm" className="h-9 px-3 text-xs shrink-0">
            جستجو
          </Button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setRoleFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              roleFilter === "ALL" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            همه نقش‌ها
          </button>
          <button
            onClick={() => setRoleFilter("USER")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              roleFilter === "USER" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            کاربران عادی
          </button>
          <button
            onClick={() => setRoleFilter("ADMIN")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              roleFilter === "ADMIN" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            مدیران سیستم
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === "ALL" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            همه وضعیت‌ها
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === "ACTIVE" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            فعال
          </button>
          <button
            onClick={() => setStatusFilter("BANNED")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === "BANNED" ? "bg-red-600 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            مسدودشده
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
          {error}
        </div>
      )}

      {/* 2. Users Table / Cards */}
      <Card className="shadow-xs overflow-hidden border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold text-slate-900">
            فهرست کاربران ({toPersianDigits(users.length)} نفر)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              هیچ کاربری با این مشخصات یافت نشد.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    u.isBanned ? "bg-red-50/40" : "hover:bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        u.role === "ADMIN"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {u.name ? u.name[0] : "ک"}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {u.name}
                        </span>

                        {u.role === "ADMIN" && (
                          <Badge variant="pro" size="sm" className="text-[10px]">
                            مدیر سیستم
                          </Badge>
                        )}

                        {u.isBanned ? (
                          <Badge variant="debt" size="sm" className="text-[10px]">
                            مسدود
                          </Badge>
                        ) : (
                          <Badge variant="credit" size="sm" className="text-[10px]">
                            فعال
                          </Badge>
                        )}

                        {u.isPro && (
                          <Badge variant="warning" size="sm" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300">
                            Pro ({toPersianDigits(u.remainingDays)} روز)
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 tabular-nums">
                        <span>موبایل: {toPersianDigits(u.phone)}</span>
                        <span>•</span>
                        <span>{toPersianDigits(u.groupCount)} گروه</span>
                        <span>•</span>
                        <span>عضویت: {new Date(u.createdAt).toLocaleDateString("fa-IR")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveUserForPro(u)}
                      className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                      leftIcon={<Gift className="w-3.5 h-3.5 ml-1 text-amber-600" />}
                    >
                      هدیه Pro
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleRole(u)}
                      className="text-xs text-slate-600"
                    >
                      {u.role === "ADMIN" ? "تنزل به کاربر" : "ارتقا به ادمین"}
                    </Button>

                    <Button
                      variant={u.isBanned ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handleToggleBan(u)}
                      className={`text-xs ${
                        u.isBanned
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      }`}
                    >
                      {u.isBanned ? "رفع مسدودیت" : "مسدود کردن"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- MODAL: GRANT PRO SUBSCRIPTION --- */}
      {activeUserForPro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-amber-500 text-white">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-100" />
                اعطای اشتراک حرفه‌ای (Pro)
              </h3>
              <button
                onClick={() => setActiveUserForPro(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGrantProSubmit} className="p-5 space-y-4">
              {grantError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                  {grantError}
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                اعطای اشتراک Pro برای کاربر <strong>«{activeUserForPro.name}»</strong> ({toPersianDigits(activeUserForPro.phone)}).
                در صورت داشتن اشتراک فعال، روزهای جدید به انتهای اعتبار قبلی افزوده خواهند شد.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  تعداد روزهای اشتراک هدیه
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["30", "90", "365"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setGrantDays(d)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        grantDays === d
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {toPersianDigits(d)} روز
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={grantDays}
                  onChange={(e) => setGrantDays(e.target.value)}
                  className="mt-2 text-xs"
                  placeholder="یا تعداد روز دلخواه..."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveUserForPro(null)}
                  className="text-xs"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                  isLoading={isGranting}
                >
                  ثبت و فعال‌سازی اشتراک
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={!!confirmConfig?.isOpen}
        onClose={() => setConfirmConfig(null)}
        onConfirm={async () => {
          if (confirmConfig?.action) {
            await confirmConfig.action();
          }
        }}
        title={confirmConfig?.title || "تأیید عملیات"}
        description={confirmConfig?.description || ""}
        confirmText="تأیید و اعمال"
        cancelText="انصراف"
        variant={confirmConfig?.variant || "danger"}
        isLoading={isConfirming}
      />
    </div>
  );
}
