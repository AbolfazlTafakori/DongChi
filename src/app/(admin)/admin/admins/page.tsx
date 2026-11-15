"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Crown,
  CreditCard,
  Headphones,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  Trash2,
  Edit3,
  Phone,
  User,
  Calendar,
  AlertCircle,
  X,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toPersianDigits } from "@/lib/money";

interface AdminAccountItem {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  role: "SUPER_ADMIN" | "FINANCE_ADMIN" | "SUPPORT_ADMIN";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

interface AdminCounts {
  total: number;
  superAdmin: number;
  financeAdmin: number;
  supportAdmin: number;
  active: number;
  inactive: number;
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminAccountItem[]>([]);
  const [counts, setCounts] = useState<AdminCounts>({
    total: 0,
    superAdmin: 0,
    financeAdmin: 0,
    supportAdmin: 0,
    active: 0,
    inactive: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminAccountItem | null>(null);
  const [modalForm, setModalForm] = useState({
    username: "",
    fullName: "",
    phone: "",
    role: "SUPPORT_ADMIN" as "SUPER_ADMIN" | "FINANCE_ADMIN" | "SUPPORT_ADMIN",
    password: "",
    isActive: true,
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/admins");
      const data = await res.json();
      if (res.ok && data.admins) {
        setAdmins(data.admins);
        setCounts(data.counts);
      }
    } catch (err) {
      console.error("fetch admins error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const openCreateModal = () => {
    setEditingAdmin(null);
    setModalForm({
      username: "",
      fullName: "",
      phone: "",
      role: "SUPPORT_ADMIN",
      password: "",
      isActive: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (admin: AdminAccountItem) => {
    setEditingAdmin(admin);
    setModalForm({
      username: admin.username,
      fullName: admin.fullName,
      phone: admin.phone,
      role: admin.role,
      password: "",
      isActive: admin.isActive,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);

    try {
      if (editingAdmin) {
        // Edit mode
        const res = await fetch(`/api/admin/admins/${editingAdmin.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: modalForm.fullName,
            phone: modalForm.phone,
            role: modalForm.role,
            isActive: modalForm.isActive,
            password: modalForm.password || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "خطا در ویرایش اطلاعات مدیر");

        setNotification({ type: "success", message: "اطلاعات مدیر با موفقیت به‌روزرسانی شد." });
        setIsModalOpen(false);
        fetchAdmins();
      } else {
        // Create mode
        const res = await fetch("/api/admin/admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: modalForm.username,
            fullName: modalForm.fullName,
            phone: modalForm.phone,
            role: modalForm.role,
            password: modalForm.password,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "خطا در ایجاد مدیر جدید");

        setNotification({ type: "success", message: "مدیر جدید با موفقیت اضافه شد." });
        setIsModalOpen(false);
        fetchAdmins();
      }
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (admin: AdminAccountItem) => {
    if (!confirm(`آیا از حذف حساب کاربری مدیر «${admin.fullName}» (${admin.username}) اطمینان دارید؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در حذف مدیر");

      setNotification({ type: "success", message: "مدیر مورد نظر با موفقیت حذف گردید." });
      fetchAdmins();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message });
    }
  };

  const handleToggleStatus = async (admin: AdminAccountItem) => {
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !admin.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در تغییر وضعیت مدیر");

      fetchAdmins();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message });
    }
  };

  // Filter admins
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.phone.includes(searchQuery);

    const matchesRole =
      selectedRoleFilter === "ALL" || admin.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
            <Crown className="w-3.5 h-3.5 text-rose-600" />
            <span>مدیر ارشد (Super Admin)</span>
          </span>
        );
      case "FINANCE_ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>مدیر مالی و تسویه (Finance)</span>
          </span>
        );
      case "SUPPORT_ADMIN":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">
            <Headphones className="w-3.5 h-3.5 text-blue-600" />
            <span>مدیر پشتیبانی (Support)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900">
              مدیریت مدیران و سطوح دسترسی (RBAC)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            پایگاه‌داده ایزوله ادمین‌ها، انتساب نقش‌ها، کنترل دسترسی به درگاه و گزارشات کلان
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          variant="primary"
          className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs h-10 px-4 rounded-xl flex items-center gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4 text-amber-400" />
          <span>تعریف مدیر جدید</span>
        </Button>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">کل مدیران سیستم</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {toPersianDigits(counts.total)}
            </span>
            <span className="text-[11px] font-bold text-emerald-600">
              {toPersianDigits(counts.active)} فعال
            </span>
          </div>
        </Card>

        {/* Metric 2 */}
        <Card className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">مدیران ارشد کلان</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">
              {toPersianDigits(counts.superAdmin)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">دسترسی تام</span>
          </div>
        </Card>

        {/* Metric 3 */}
        <Card className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">مدیران مالی و درگاه</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              {toPersianDigits(counts.financeAdmin)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">تسویه و پلن</span>
          </div>
        </Card>

        {/* Metric 4 */}
        <Card className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">مدیران پشتیبانی</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700">
              {toPersianDigits(counts.supportAdmin)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">نظارت کاربران</span>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام، نام کاربری یا شماره موبایل مدیر..."
            className="w-full h-10 pr-10 pl-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-medium text-slate-900 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "همه سطوح" },
            { id: "SUPER_ADMIN", label: "مدیر ارشد" },
            { id: "FINANCE_ADMIN", label: "مدیر مالی" },
            { id: "SUPPORT_ADMIN", label: "پشتیبانی" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedRoleFilter === tab.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Admins Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            در حال بارگذاری اطلاعات مدیران سامانه...
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700">مدیری با این مشخصات یافت نشد.</p>
            <p className="text-xs text-slate-400">عبارت جستجو را تغییر دهید یا مدیر جدید اضافه کنید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500">
                  <th className="py-3.5 px-4">مشخصات هویتی مدیر</th>
                  <th className="py-3.5 px-4">نام کاربری</th>
                  <th className="py-3.5 px-4">سطح دسترسی (Role)</th>
                  <th className="py-3.5 px-4">شماره تماس</th>
                  <th className="py-3.5 px-4">وضعیت حساب</th>
                  <th className="py-3.5 px-4">آخرین ورود</th>
                  <th className="py-3.5 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center shrink-0">
                          {admin.fullName.charAt(0) || "م"}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900">{admin.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{admin.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      @{admin.username}
                    </td>

                    <td className="py-3.5 px-4">{getRoleBadge(admin.role)}</td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">
                      {toPersianDigits(admin.phone)}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          admin.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {admin.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>فعال</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>غیرفعال</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-medium text-[11px]">
                      {admin.lastLoginAt ? (
                        new Intl.DateTimeFormat("fa-IR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(admin.lastLoginAt))
                      ) : (
                        <span className="text-slate-400">ورود ثبت نشده</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(admin)}
                          title="ویرایش مشخصات یا رمز عبور"
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteAdmin(admin)}
                          title="حذف حساب کاربری مدیر"
                          className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Admin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingAdmin ? "ویرایش حساب مدیر" : "تعریف مدیر جدید سامانه"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingAdmin
                      ? `ویرایش مشخصات کاربری @${editingAdmin.username}`
                      : "ثبت در دیتابیس ایزوله ادمین و ایجاد دسترسی"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error in modal */}
            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {/* Username (read-only on edit) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  نام کاربری (Username)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  disabled={!!editingAdmin}
                  value={modalForm.username}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, username: e.target.value.toLowerCase().trim() })
                  }
                  placeholder="admin_finance"
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={modalForm.fullName}
                  onChange={(e) => setModalForm({ ...modalForm, fullName: e.target.value })}
                  placeholder="مثال: رضا حسینی"
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">شماره موبایل</label>
                <input
                  type="tel"
                  dir="ltr"
                  maxLength={11}
                  value={modalForm.phone}
                  onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })}
                  placeholder="09121112233"
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Role Select */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  سطح دسترسی نقش (RBAC Role)
                </label>
                <select
                  value={modalForm.role}
                  onChange={(e) =>
                    setModalForm({
                      ...modalForm,
                      role: e.target.value as "SUPER_ADMIN" | "FINANCE_ADMIN" | "SUPPORT_ADMIN",
                    })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="SUPER_ADMIN">مدیر ارشد سامانه (SUPER_ADMIN) - دسترسی تام</option>
                  <option value="FINANCE_ADMIN">مدیر مالی و تسویه (FINANCE_ADMIN) - درگاه و پلن‌ها</option>
                  <option value="SUPPORT_ADMIN">مدیر پشتیبانی (SUPPORT_ADMIN) - کاربران و ترازها</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    {editingAdmin ? "رمز عبور جدید (اختیاری)" : "رمز عبور ورود"}
                  </label>
                  {editingAdmin && (
                    <span className="text-[10px] text-slate-400">در صورت عدم تغییر خالی بگذارید</span>
                  )}
                </div>
                <input
                  type="password"
                  dir="ltr"
                  required={!editingAdmin}
                  value={modalForm.password}
                  onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })}
                  placeholder={editingAdmin ? "••••••••" : "حداقل ۶ نویسه"}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Status Toggle on Edit */}
              {editingAdmin && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">وضعیت فعال بودن حساب:</span>
                  <input
                    type="checkbox"
                    checked={modalForm.isActive}
                    onChange={(e) => setModalForm({ ...modalForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 rounded-xl text-xs font-bold"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-5 rounded-xl text-xs font-black"
                >
                  {editingAdmin ? "ذخیره تغییرات" : "ایجاد حساب مدیر"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
