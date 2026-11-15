"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { UpgradePromptModal } from "@/components/billing/UpgradePromptModal";
import { formatToman, toPersianDigits, parseToman } from "@/lib/money";
import {
  ArrowRight,
  Download,
  Calendar,
  Lock,
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Target,
  Users,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Flame,
  Clock,
  Layers,
} from "lucide-react";

interface CategoryBudget {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  budgetId: string | null;
  monthlyLimit: string | null;
  spentAmount: string;
  remainingAmount: string | null;
  usagePercent: number | null;
  alertThreshold: number;
  status: "SAFE" | "WARNING" | "EXCEEDED" | "UNBUDGETED";
  projectedSpend: string | null;
  isPaceWarning: boolean;
}

interface SpendingInsights {
  totalSpent: string;
  dailyAverage: string;
  monthOverMonthChangePercent: number | null;
  memberConsumption: Record<string, string>;
  topCategory: {
    id: string;
    name: string;
    amount: string;
    percent: number;
  } | null;
  dailySeries: { date: string; amount: string }[];
}

interface BillingCycle {
  id: string;
  groupId: string;
  title: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  closedAt: string | null;
  _count?: { expenses: number };
}

interface MemberInfo {
  userId: string;
  name: string;
  phone: string;
  role: "OWNER" | "MEMBER";
}

const CATEGORY_COLORS = [
  "#059669", // Emerald
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#14B8A6", // Teal
  "#EF4444", // Red
  "#6366F1", // Indigo
  "#84CC16", // Lime
  "#64748B", // Slate
];

export default function GroupReportsPage() {
  const params = useParams();
  const groupId = String(params.groupId);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cycles, setCycles] = useState<BillingCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [categories, setCategories] = useState<
    { id: string; name: string; color: string; icon: string }[]
  >([]);

  // Budget Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetFormCatId, setBudgetFormCatId] = useState("");
  const [budgetFormLimit, setBudgetFormLimit] = useState("");
  const [budgetFormThreshold, setBudgetFormThreshold] = useState("80");
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);
  const [budgetFormError, setBudgetFormError] = useState<string | null>(null);

  // Delete Budget Modal State
  const [budgetToDeleteId, setBudgetToDeleteId] = useState<string | null>(null);
  const [isDeletingBudget, setIsDeletingBudget] = useState(false);

  // Closing Cycle Modal State
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [nextCycleTitle, setNextCycleTitle] = useState("");
  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  // Upgrade to Pro Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalReason, setUpgradeModalReason] = useState<string | undefined>(undefined);
  const [exportingCsv, setExportingCsv] = useState(false);

  const [isPending, startTransition] = useTransition();

  const fetchReports = async (cycleId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const url = cycleId
        ? `/api/groups/${groupId}/reports?cycleId=${cycleId}`
        : `/api/groups/${groupId}/reports`;

      const [repRes, catRes] = await Promise.all([
        fetch(url),
        fetch(`/api/groups/${groupId}/categories`),
      ]);

      if (!repRes.ok) {
        const d = await repRes.json();
        throw new Error(d.error || "خطا در دریافت گزارش‌ها");
      }

      const repData = await repRes.json();
      setCycles(repData.cycles || []);
      setSelectedCycle(repData.selectedCycle);
      setSelectedCycleId(repData.selectedCycle?.id || "ALL");
      setCategoryBudgets(repData.categoryBudgets || []);
      setInsights(repData.spendingInsights || null);
      setMembers(repData.members || []);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
    } catch (err: any) {
      setError(err.message || "خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [groupId]);

  const handleCycleChange = (cId: string) => {
    setSelectedCycleId(cId);
    startTransition(() => {
      fetchReports(cId);
    });
  };

  // Budget save
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetFormCatId) {
      setBudgetFormError("لطفاً یک دسته‌بندی را انتخاب کنید.");
      return;
    }
    const limit = parseToman(budgetFormLimit);
    if (limit <= 0n) {
      setBudgetFormError("سقف بودجه باید بزرگتر از صفر باشد.");
      return;
    }

    try {
      setBudgetSubmitting(true);
      setBudgetFormError(null);

      const res = await fetch(`/api/groups/${groupId}/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: budgetFormCatId,
          monthlyLimit: limit.toString(),
          alertThreshold: Number(budgetFormThreshold) || 80,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "خطا در ثبت بودجه.");
      }

      setIsBudgetModalOpen(false);
      setBudgetFormCatId("");
      setBudgetFormLimit("");
      setBudgetFormThreshold("80");
      toast.success("سقف بودجه دسته‌بندی با موفقیت ذخیره گردید.");
      fetchReports(selectedCycleId);
    } catch (err: any) {
      setBudgetFormError(err.message);
    } finally {
      setBudgetSubmitting(false);
    }
  };

  // Delete Budget
  const executeDeleteBudget = async () => {
    if (!budgetToDeleteId) return;

    setIsDeletingBudget(true);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/budgets/${budgetToDeleteId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "خطا در حذف بودجه.");
      }
      toast.success("سقف بودجه دسته‌بندی با موفقیت حذف گردید.");
      setBudgetToDeleteId(null);
      fetchReports(selectedCycleId);
    } catch (err: any) {
      toast.error(err.message || "خطا در حذف بودجه.");
    } finally {
      setIsDeletingBudget(false);
    }
  };

  // Close Cycle
  const handleCloseCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycle) return;

    try {
      setCloseSubmitting(true);
      setCloseError(null);

      const res = await fetch(
        `/api/groups/${groupId}/cycles/${selectedCycle.id}/close`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nextCycleTitle: nextCycleTitle.trim() || undefined,
          }),
        }
      );

      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || "خطا در بستن دوره مالی.");
      }

      setIsCloseModalOpen(false);
      setNextCycleTitle("");
      fetchReports();
    } catch (err: any) {
      setCloseError(err.message);
    } finally {
      setCloseSubmitting(false);
    }
  };

  const openEditBudget = (b: CategoryBudget) => {
    setBudgetFormCatId(b.categoryId);
    setBudgetFormLimit(
      b.monthlyLimit ? formatToman(BigInt(b.monthlyLimit)) : ""
    );
    setBudgetFormThreshold(String(b.alertThreshold || 80));
    setBudgetFormError(null);
    setIsBudgetModalOpen(true);
  };

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const url = `/api/groups/${groupId}/reports/export${
        selectedCycleId ? `?cycleId=${selectedCycleId}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (res.status === 402 || d.code === "PRO_REQUIRED") {
          setUpgradeModalReason(d.error);
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(d.error || "خطا در دریافت فایل اکسل.");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `dongchi-report-${groupId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("فایل گزارش اکسل با موفقیت دانلود شد.");
    } catch (err: any) {
      toast.error(err.message || "خطا در دانلود خروجی اکسل.");
    } finally {
      setExportingCsv(false);
    }
  };

  if (loading && !insights) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-slate-200 animate-pulse rounded-xl" />
          <div className="h-9 w-28 bg-slate-200 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

  // Calculate donut chart segments
  const activeBudgetSegments = categoryBudgets
    .filter((b) => BigInt(b.spentAmount) > 0n)
    .map((b, idx) => ({
      name: b.categoryName,
      amount: BigInt(b.spentAmount),
      color: b.categoryColor || CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));

  const donutTotal = activeBudgetSegments.reduce((sum, s) => sum + s.amount, 0n);

  let cumulativePercent = 0;
  const donutSlices = activeBudgetSegments.map((seg) => {
    const percent =
      donutTotal > 0n ? Number((seg.amount * 1000n) / donutTotal) / 10 : 0;
    const startAngle = (cumulativePercent / 100) * 360;
    cumulativePercent += percent;
    const endAngle = (cumulativePercent / 100) * 360;
    return {
      ...seg,
      percent,
      startAngle,
      endAngle,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/app/groups/${groupId}`}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              حسابدار هوشمند و گزارش‌ها
            </h1>
            <span className="text-xs text-slate-500">
              تحلیل خرج، بودجه‌بندی ماهانه و بستن دوره‌های مالی
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Cycle Selector */}
          <div className="relative">
            <select
              value={selectedCycleId}
              onChange={(e) => handleCycleChange(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-bold text-slate-700 shadow-xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">همه دوره‌ها (کل تاریخچه)</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.isClosed ? "(بسته شده)" : "(دوره جاری)"}
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
          </div>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            {exportingCsv ? "در حال دریافت..." : "خروجی اکسل"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Spent */}
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              مجموع هزینه‌ها
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 tabular-nums">
            {formatToman(BigInt(insights?.totalSpent || "0"))}{" "}
            <span className="text-[10px] font-normal text-slate-400">تومان</span>
          </div>
          {insights?.monthOverMonthChangePercent !== null &&
            insights?.monthOverMonthChangePercent !== undefined && (
              <div className="mt-2 flex items-center gap-1 text-[11px] font-bold">
                {insights.monthOverMonthChangePercent > 0 ? (
                  <span className="text-red-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />+
                    {toPersianDigits(
                      Math.abs(insights.monthOverMonthChangePercent)
                    )}
                    ٪ نسبت به قبل
                  </span>
                ) : insights.monthOverMonthChangePercent < 0 ? (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" />-
                    {toPersianDigits(
                      Math.abs(insights.monthOverMonthChangePercent)
                    )}
                    ٪ نسبت به قبل
                  </span>
                ) : (
                  <span className="text-slate-500">بدون تغییر نسبت به قبل</span>
                )}
              </div>
            )}
        </Card>

        {/* Daily Burn Rate */}
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              میانگین خرج روزانه
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 tabular-nums">
            {formatToman(BigInt(insights?.dailyAverage || "0"))}{" "}
            <span className="text-[10px] font-normal text-slate-400">تومان</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-2">
            سرعت سوخت پول خانه
          </span>
        </Card>

        {/* Top Spending Category */}
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              بیشترین دسته‌بندی
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-black text-slate-900 truncate">
            {insights?.topCategory?.name || "بدون هزینه"}
          </div>
          {insights?.topCategory && (
            <span className="text-[11px] font-bold text-amber-600 block mt-2 tabular-nums">
              {toPersianDigits(insights.topCategory.percent)}٪ از کل خرج دوره
            </span>
          )}
        </Card>

        {/* Cycle Status */}
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              وضعیت دوره مالی
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-black text-slate-900">
            {selectedCycle ? (
              selectedCycle.isClosed ? (
                <span className="text-slate-500 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> بسته شده
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> دوره فعال و باز
                </span>
              )
            ) : (
              "کل تاریخچه"
            )}
          </div>
          {selectedCycle && (
            <span className="text-[10px] text-slate-400 block mt-2 tabular-nums">
              تا تاریخ{" "}
              {new Date(selectedCycle.endDate).toLocaleDateString("fa-IR")}
            </span>
          )}
        </Card>
      </div>

      {/* 3. Category Breakdown & Visual Donut Chart */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            ترکیب و سهم دسته‌بندی‌های هزینه
          </CardTitle>
          <span className="text-xs text-slate-400">
            {toPersianDigits(donutSlices.length)} دسته‌بندی فعال
          </span>
        </CardHeader>
        <CardContent className="pt-6">
          {donutSlices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              هنوز هزینه‌ای در این دوره ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* SVG Ring / Donut */}
              <div className="relative flex items-center justify-center">
                <svg
                  viewBox="0 0 100 100"
                  className="w-48 h-48 transform -rotate-90"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="14"
                  />
                  {donutSlices.map((slice, idx) => {
                    const strokeDasharray = `${(slice.percent / 100) * 238.76} 238.76`;
                    const strokeDashoffset = `-${
                      (slice.startAngle / 360) * 238.76
                    }`;
                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="14"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                      />
                    );
                  })}
                </svg>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[11px] font-medium text-slate-400">
                    مجموع
                  </span>
                  <span className="text-sm font-black text-slate-900 tabular-nums">
                    {formatToman(donutTotal)}
                  </span>
                  <span className="text-[10px] text-slate-400">تومان</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-2.5">
                {donutSlices.map((slice, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="font-bold text-slate-800">
                        {slice.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 tabular-nums">
                        {formatToman(slice.amount)} تومان
                      </span>
                      <span className="font-bold text-slate-700 tabular-nums bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                        {toPersianDigits(slice.percent)}٪
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Monthly Category Budgets & Burn Rate Alerts */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            سقف بودجه ماهانه و هشدار سرعت خرج
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBudgetFormCatId("");
              setBudgetFormLimit("");
              setBudgetFormThreshold("80");
              setBudgetFormError(null);
              setIsBudgetModalOpen(true);
            }}
            className="text-xs"
            leftIcon={<Plus className="w-3.5 h-3.5 ml-1 text-emerald-600" />}
          >
            تعیین سقف بودجه
          </Button>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {categoryBudgets.filter((b) => b.monthlyLimit !== null).length ===
          0 ? (
            <div className="py-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">
                هنوز سقف بودجه‌ای برای دسته‌بندی‌های خانه تعیین نشده است.
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                با تعیین سقف بودجه، اگر سرعت خرج خانه بالا رود یا به سقف نزدیک
                شوید، سیستم به شما هشدار خواهد داد.
              </p>
            </div>
          ) : (
            categoryBudgets
              .filter((b) => b.monthlyLimit !== null)
              .map((b) => {
                const limit = BigInt(b.monthlyLimit!);
                const spent = BigInt(b.spentAmount);
                const percent = b.usagePercent ?? 0;

                let barColor = "bg-emerald-600";
                let statusBadge = (
                  <Badge variant="credit" size="sm">
                    وضعیت امن
                  </Badge>
                );

                if (b.status === "EXCEEDED") {
                  barColor = "bg-red-600";
                  statusBadge = (
                    <Badge variant="debt" size="sm">
                      عبور از سقف بودجه
                    </Badge>
                  );
                } else if (b.status === "WARNING") {
                  barColor = "bg-amber-500";
                  statusBadge = (
                    <Badge variant="warning" size="sm">
                      نزدیک به سقف ({toPersianDigits(b.alertThreshold)}٪)
                    </Badge>
                  );
                }

                return (
                  <div
                    key={b.categoryId}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{b.categoryIcon || "🏷️"}</span>
                        <span className="font-bold text-sm text-slate-900">
                          {b.categoryName}
                        </span>
                        {statusBadge}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditBudget(b)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="ویرایش بودجه"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {b.budgetId && (
                          <button
                            onClick={() => setBudgetToDeleteId(b.budgetId!)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="حذف بودجه"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{
                            width: `${Math.min(100, Math.max(0, percent))}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                        <span>
                          خرج‌شده: {formatToman(spent)} از {formatToman(limit)}{" "}
                          تومان
                        </span>
                        <span className="font-bold text-slate-700">
                          {toPersianDigits(percent)}٪
                        </span>
                      </div>
                    </div>

                    {/* Burn-Rate Pace Warning Banner */}
                    {b.isPaceWarning && b.projectedSpend && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>هشدار سرعت خرج:</strong> با نرخ فعلی، تا پایان
                          ماه به خرج تخمینی{" "}
                          <strong>
                            {formatToman(BigInt(b.projectedSpend))} تومان
                          </strong>{" "}
                          خواهید رسید و از سقف عبور می‌کنید.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </CardContent>
      </Card>

      {/* 5. Member Consumption Breakdown Table */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            سهم مصرف هر عضو در دوره (دنگ‌های استفاده‌شده)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="divide-y divide-slate-100">
            {members.map((m) => {
              const consumed = BigInt(
                insights?.memberConsumption[m.userId] || "0"
              );
              const total = BigInt(insights?.totalSpent || "0");
              const sharePercent =
                total > 0n ? Number((consumed * 1000n) / total) / 10 : 0;

              return (
                <div
                  key={m.userId}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {m.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800">
                          {m.name}
                        </span>
                        {m.role === "OWNER" && (
                          <Badge variant="pro" size="sm" className="text-[9px]">
                            مدیر
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        سهم مصرف: {toPersianDigits(sharePercent)}٪ از کل دوره
                      </span>
                    </div>
                  </div>

                  <div className="text-left font-black text-xs text-slate-900 tabular-nums">
                    {formatToman(consumed)}{" "}
                    <span className="text-[10px] font-normal text-slate-400">
                      تومان
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 6. Monthly Closing (بستن دوره مالی) */}
      {selectedCycle && !selectedCycle.isClosed && (
        <Card className="border-indigo-200 bg-indigo-50/40 shadow-xs">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900">
                  بستن دوره مالی «{selectedCycle.title}»
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                  با بستن دوره، اسناد و فاکتورهای این دوره قفل شده و امکان تغییر
                  یا حذف نخواهند داشت. تمام مانده‌ها و صندوق‌ها ثبت شده و دوره ۳۰
                  روزه جدیدی آغاز می‌شود.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setNextCycleTitle(`دوره مالی ${new Date().toLocaleDateString("fa-IR", { month: "long", year: "numeric" })}`);
                setCloseError(null);
                setIsCloseModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 self-end sm:self-auto text-xs"
              leftIcon={<Lock className="w-3.5 h-3.5 ml-1" />}
            >
              بستن حساب این دوره
            </Button>
          </CardContent>
        </Card>
      )}

      {/* --- MODAL: SET / EDIT BUDGET --- */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                تعیین سقف بودجه دسته‌بندی
              </h3>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-4 space-y-4">
              {budgetFormError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                  {budgetFormError}
                </div>
              )}

              {/* Category Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  دسته‌بندی هزینه
                </label>
                <select
                  value={budgetFormCatId}
                  onChange={(e) => setBudgetFormCatId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">انتخاب دسته‌بندی...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monthly Limit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  سقف بودجه ماهانه (تومان)
                </label>
                <Input
                  type="text"
                  placeholder="مثال: ۲,۰۰۰,۰۰۰"
                  value={budgetFormLimit}
                  onChange={(e) => {
                    const parsed = parseToman(e.target.value);
                    setBudgetFormLimit(
                      parsed > 0n ? formatToman(parsed) : e.target.value
                    );
                  }}
                  required
                />
              </div>

              {/* Alert Threshold */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>آستانه ارسال هشدار</span>
                  <span className="text-emerald-700 tabular-nums">
                    {toPersianDigits(budgetFormThreshold)}٪ سقف
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={budgetFormThreshold}
                  onChange={(e) => setBudgetFormThreshold(e.target.value)}
                  className="w-full accent-emerald-600"
                />
                <span className="text-[10px] text-slate-400 block">
                  وقتی مجموع خرج به این درصد از سقف برسد، هشدار زرد رنگ نمایش
                  داده خواهد شد.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBudgetModalOpen(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={budgetSubmitting}
                >
                  ذخیره سقف بودجه
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CLOSE BILLING CYCLE --- */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                تأیید بستن حساب و دوره مالی
              </h3>
              <button
                onClick={() => setIsCloseModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseCycle} className="p-4 space-y-4">
              {closeError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                  {closeError}
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                آیا از بستن دوره مالی{" "}
                <strong>«{selectedCycle?.title}»</strong> اطمینان دارید؟
                با تایید این عملیات، دیگر نمی‌توان هزینه‌های ثبت شده در این دوره
                را ویرایش یا حذف نمود.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  عنوان دوره مالی جدید
                </label>
                <Input
                  type="text"
                  placeholder="مثال: دوره مالی آذر ۱۴۰۵"
                  value={nextCycleTitle}
                  onChange={(e) => setNextCycleTitle(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCloseModalOpen(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  isLoading={closeSubmitting}
                >
                  بستن قطعی حساب دوره
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Budget Modal */}
      <ConfirmModal
        isOpen={!!budgetToDeleteId}
        onClose={() => setBudgetToDeleteId(null)}
        onConfirm={executeDeleteBudget}
        title="حذف سقف بودجه"
        description="آیا از حذف سقف بودجه این دسته‌بندی اطمینان دارید؟ هشدارهای مصرف و سرعت خرج برای این دسته‌بندی دیگر نمایش داده نخواهند شد."
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        isLoading={isDeletingBudget}
      />

      {/* Upgrade to Pro Modal */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="ارتقا جهت خروجی اکسل و گزارش‌های تحلیلی"
        reason={upgradeModalReason}
        feature="EXPORT_CSV"
      />
    </div>
  );
}
