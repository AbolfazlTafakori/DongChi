"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { formatToman, toPersianDigits, parseToman } from "@/lib/money";
import {
  CreditCard,
  Edit2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  Zap,
  TrendingUp,
} from "lucide-react";

interface AdminPlan {
  id: string;
  title: string;
  slug: string;
  price: string;
  durationDays: number;
  isActive: boolean;
}

interface AdminTransaction {
  id: string;
  amount: string;
  authority: string;
  refId: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
  };
  plan: {
    id: string;
    title: string;
    slug: string;
  };
}

export default function AdminBillingPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Plan Edit Modal state
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/billing?${params.toString()}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "خطا در دریافت اطلاعات مالی.");
      }
      const data = await res.json();
      setPlans(data.plans || []);
      setTransactions(data.transactions || []);
    } catch (err: any) {
      setError(err.message || "خطای ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBillingData();
  };

  const openEditPlan = (plan: AdminPlan) => {
    setEditingPlan(plan);
    setEditTitle(plan.title);
    setEditPrice(formatToman(BigInt(plan.price)));
    setEditDuration(String(plan.durationDays));
    setEditIsActive(plan.isActive);
    setPlanError(null);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      setIsUpdatingPlan(true);
      setPlanError(null);

      const parsedPrice = parseToman(editPrice);
      const parsedDays = Number(editDuration);

      const res = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          price: parsedPrice.toString(),
          durationDays: parsedDays,
          isActive: editIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در به‌روزرسانی پلن.");

      toast.success("مشخصات پلن اشتراک با موفقیت به‌روزرسانی شد.");
      setEditingPlan(null);
      await fetchBillingData();
    } catch (err: any) {
      setPlanError(err.message);
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-600" />
          مدیریت اشتراک‌ها، پلن‌ها و دفتر کل تراکنش‌ها
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          تنظیم قیمت و مدت پلن‌ها، مانیتورینگ پرداختی‌های کاربران و رهگیری تراکنش‌ها
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
          {error}
        </div>
      )}

      {/* 2. Plans Configuration Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          <h2 className="font-bold text-sm text-slate-900">
            پلن‌های فعال اشتراک دنگ‌چی
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-3xl bg-white border transition-colors shadow-xs flex flex-col justify-between ${
                p.isActive ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900">
                    {p.title}
                  </span>
                  {p.isActive ? (
                    <Badge variant="credit" size="sm" className="text-[10px]">
                      فعال
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm" className="text-[10px]">
                      غیرفعال
                    </Badge>
                  )}
                </div>

                <div className="mb-3">
                  <span className="text-lg font-black text-slate-900 tabular-nums">
                    {formatToman(BigInt(p.price))}
                  </span>{" "}
                  <span className="text-[10px] text-slate-400">تومان</span>
                </div>

                <div className="text-xs text-slate-500 tabular-nums mb-4">
                  اعتبار: {toPersianDigits(p.durationDays)} روز
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditPlan(p)}
                className="w-full text-xs font-bold"
                leftIcon={<Edit2 className="w-3.5 h-3.5 ml-1" />}
              >
                ویرایش مشخصات و قیمت
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Transactions Ledger */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-500" />
            دفتر کل تراکنش‌های درگاه بانکی
          </h2>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="جستجو با کد پیگیری، شماره یا نام..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs h-9 w-full sm:w-60"
              rightIcon={<Search className="w-3.5 h-3.5" />}
            />
            <Button type="submit" variant="primary" size="sm" className="h-9 px-3 text-xs shrink-0">
              جستجو
            </Button>
          </form>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs text-xs w-fit">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === "ALL" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            همه ({toPersianDigits(transactions.length)})
          </button>
          <button
            onClick={() => setStatusFilter("SUCCESS")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === "SUCCESS" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            موفق
          </button>
          <button
            onClick={() => setStatusFilter("FAILED")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === "FAILED" ? "bg-red-600 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ناموفق
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              statusFilter === "PENDING" ? "bg-amber-500 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            در انتظار
          </button>
        </div>

        {/* Transactions Table */}
        <Card className="shadow-xs overflow-hidden border-slate-200">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                در حال بارگذاری تراکنش‌ها...
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                تراکنشی یافت نشد.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((tx) => {
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
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          💳
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {tx.user?.name || "کاربر"}
                            </span>
                            <span className="text-[11px] text-slate-400 tabular-nums">
                              ({toPersianDigits(tx.user?.phone || "")})
                            </span>
                            {badge}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 tabular-nums">
                            <span>پلن: {tx.plan?.title}</span>
                            <span>•</span>
                            <span>{new Date(tx.createdAt).toLocaleDateString("fa-IR")}</span>
                            {tx.refId && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-700 font-bold">
                                  RefID: {toPersianDigits(tx.refId)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-left font-black text-sm text-slate-900 tabular-nums self-end sm:self-auto shrink-0">
                        {formatToman(BigInt(tx.amount))}{" "}
                        <span className="text-[10px] font-normal text-slate-400">تومان</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- MODAL: EDIT PLAN --- */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                ویرایش پلن «{editingPlan.title}»
              </h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlan} className="p-5 space-y-4">
              {planError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                  {planError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">عنوان پلن</label>
                <Input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">مبلغ اشتراک (تومان)</label>
                <Input
                  numericOnly
                  currencyPreview
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">مدت اعتبار (روز)</label>
                <Input
                  type="number"
                  min="1"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                  پلن فعال است و در سایت نمایش داده می‌شود
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPlan(null)}
                  className="text-xs"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isUpdatingPlan}
                  className="text-xs"
                >
                  ذخیره تغییرات پلن
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
