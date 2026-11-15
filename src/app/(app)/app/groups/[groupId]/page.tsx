"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { CardSkeleton, ExpenseListSkeleton } from "@/components/ui/Skeleton";
import { formatToman, toPersianDigits, parseToman } from "@/lib/money";
import { formatBankCard, detectIranBank } from "@/lib/iran-banks";
import {
  Users,
  Settings,
  PiggyBank,
  Plus,
  ArrowRight,
  Copy,
  Check,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  Share2,
  HandCoins,
  Receipt,
  Scale,
  Calendar,
  History,
  Trash2,
  Edit3,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  BarChart3,
} from "lucide-react";

interface MemberDetail {
  memberId: string;
  userId: string;
  name: string;
  phone: string;
  cardNumber: string | null;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  netBalance: string;
}

interface FundDetail {
  id: string;
  title: string;
  cardNumber: string | null;
  currentBalance: string;
  transactions?: any[];
}

interface ExpenseSplitDetail {
  id: string;
  userId: string;
  owedAmount: string;
  splitType: string;
  user: { id: string; name: string };
}

interface ExpenseDetail {
  id: string;
  title: string;
  totalAmount: string;
  paymentSource: "PERSONAL" | "FUND";
  paidByUserId?: string | null;
  fundId?: string | null;
  expenseDate: string;
  createdAt: string;
  category: { id: string; name: string; icon: string; color: string };
  paidByUser?: { id: string; name: string } | null;
  fund?: { id: string; title: string } | null;
  splits: ExpenseSplitDetail[];
  auditLogs?: any[];
}

interface SettlementDetail {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: string;
  note: string | null;
  settledAt: string;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
}

interface AuditLogDetail {
  id: string;
  action: string;
  oldData: any;
  newData: any;
  createdAt: string;
  changedByUser: { id: string; name: string };
}

interface GroupDetail {
  id: string;
  title: string;
  currency: string;
  inviteCode: string;
  createdAt: string;
  myRole: "OWNER" | "MEMBER";
  totalFundBalance: string;
  funds: FundDetail[];
  members: MemberDetail[];
  simplifiedDebts: { fromId: string; toId: string; amount: string }[];
  recentExpenses: ExpenseDetail[];
  recentSettlements: SettlementDetail[];
  auditLogs: AuditLogDetail[];
  isBalanced: boolean;
}

export default function GroupSpaceHub() {
  const params = useParams();
  const router = useRouter();
  const groupId = String(params.groupId);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Delete modal state
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);

  // Invite link copy state
  const [copied, setCopied] = useState(false);

  // Filter tabs for Unified Financial Ledger
  const [ledgerFilter, setLedgerFilter] = useState<
    "ALL" | "EXPENSES" | "SETTLEMENTS" | "AUDIT"
  >("ALL");

  // Main high-level view tabs: SETTLEMENTS, LEDGER, AUDIT
  const [activeMainTab, setActiveMainTab] = useState<
    "SETTLEMENTS" | "LEDGER" | "AUDIT"
  >("SETTLEMENTS");

  // Deposit modal state
  const [activeFundForDeposit, setActiveFundForDeposit] =
    useState<FundDetail | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Reconciliation modal state
  const [activeFundForReconcile, setActiveFundForReconcile] =
    useState<FundDetail | null>(null);
  const [reconcileBalance, setReconcileBalance] = useState("");
  const [reconcileNote, setReconcileNote] = useState("");
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  // Expense Detail Modal state
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDetail | null>(
    null
  );
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  // Budget Alert state
  const [budgetAlert, setBudgetAlert] = useState<{
    categoryName: string;
    status: "WARNING" | "EXCEEDED";
    usagePercent: number;
  } | null>(null);

  const fetchGroup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [groupRes, profileRes, reportsRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch(`/api/user/profile`),
        fetch(`/api/groups/${groupId}/reports`).catch(() => null),
      ]);

      const groupData = await groupRes.json();
      const profileData = await profileRes.json();

      if (!groupRes.ok) {
        throw new Error(groupData.error || "خطا در دریافت اطلاعات گروه.");
      }

      setGroup(groupData.group);
      setCurrentUser(profileData.user);

      if (reportsRes && reportsRes.ok) {
        const reportsData = await reportsRes.json();
        const alertBudget = reportsData.categoryBudgets?.find(
          (b: any) => b.status === "EXCEEDED" || b.status === "WARNING"
        );
        if (alertBudget) {
          setBudgetAlert({
            categoryName: alertBudget.categoryName,
            status: alertBudget.status,
            usagePercent: alertBudget.usagePercent ?? 0,
          });
        } else {
          setBudgetAlert(null);
        }
      }
    } catch (err: any) {
      setError(err.message || "خطای ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroup();
    }
  }, [groupId]);

  const handleCopyInvite = () => {
    if (!group) return;
    const inviteUrl = `${window.location.origin}/app/join/${group.inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("لینک دعوت خانه با موفقیت کپی شد!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFundForDeposit) return;
    setDepositError(null);

    const parsed = parseToman(depositAmount);
    if (parsed <= 0n) {
      setDepositError("مبلغ واریزی باید بزرگتر از صفر باشد.");
      return;
    }

    setIsDepositing(true);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/funds/${activeFundForDeposit.id}/deposit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: parsed.toString(),
            note: depositNote.trim() || undefined,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ثبت واریزی.");

      setActiveFundForDeposit(null);
      setDepositAmount("");
      setDepositNote("");
      await fetchGroup();
    } catch (err: any) {
      setDepositError(err.message);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFundForReconcile) return;
    setReconcileError(null);

    const parsed = parseToman(reconcileBalance);
    if (parsed < 0n) {
      setReconcileError("موجودی کارت نمی‌تواند منفی باشد.");
      return;
    }

    setIsReconciling(true);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/funds/${activeFundForReconcile.id}/reconcile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actualBalance: parsed.toString(),
            note: reconcileNote.trim() || undefined,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در تطبیق موجودی کارت.");

      setActiveFundForReconcile(null);
      setReconcileBalance("");
      setReconcileNote("");
      await fetchGroup();
    } catch (err: any) {
      setReconcileError(err.message);
    } finally {
      setIsReconciling(false);
    }
  };

  const executeDeleteExpense = async () => {
    if (!expenseToDeleteId) return;

    setIsDeletingExpense(true);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/expenses/${expenseToDeleteId}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در حذف هزینه.");

      toast.success("سند هزینه با موفقیت حذف گردید.");
      setSelectedExpense(null);
      setExpenseToDeleteId(null);
      await fetchGroup();
    } catch (err: any) {
      toast.error(err.message || "خطا در حذف هزینه.");
    } finally {
      setIsDeletingExpense(false);
    }
  };

  // Helper to map participant id to human name
  const resolveEntityName = (id: string): string => {
    if (!group) return id;
    if (id.startsWith("FUND:")) {
      const fId = id.replace("FUND:", "");
      const f = group.funds.find((x) => x.id === fId);
      return f ? `صندوق ${f.title}` : "صندوق مشترک خانه";
    }
    const m = group.members.find((x) => x.userId === id);
    return m ? m.name : "یکی از اعضا";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-44 bg-slate-200 animate-pulse rounded-xl" />
          <div className="h-9 w-28 bg-slate-200 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <ExpenseListSkeleton count={4} />
      </div>
    );
  }

  if (error || !group) {
    return (
      <Card className="p-6 text-center bg-red-50 border-red-200">
        <p className="text-sm font-semibold text-red-700">
          {error || "گروه مورد نظر یافت نشد."}
        </p>
        <div className="mt-4">
          <Link href="/app">
            <Button variant="outline" size="sm">
              بازگشت به داشبورد
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Combine feed entries
  const expensesList = group.recentExpenses || [];
  const settlementsList = group.recentSettlements || [];
  const auditList = group.auditLogs || [];

  return (
    <div className="space-y-6">
      {/* 1. Top Header Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{group.title}</h1>
              {group.myRole === "OWNER" && (
                <Badge variant="pro" size="sm" className="text-[10px] py-0 px-2">
                  مدیر
                </Badge>
              )}
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              {toPersianDigits(group.members.length)} عضو • ارز: {group.currency}
            </span>
          </div>
        </div>

        <Link href={`/app/groups/${groupId}/settings`}>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            leftIcon={<Settings className="w-3.5 h-3.5 ml-1 text-slate-500" />}
          >
            تنظیمات
          </Button>
        </Link>
      </div>

      {/* Budget Alert Banner */}
      {budgetAlert && (
        <Link
          href={`/app/groups/${groupId}/reports`}
          className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-colors shadow-xs ${
            budgetAlert.status === "EXCEEDED"
              ? "bg-red-50 border-red-200 text-red-800 hover:bg-red-100"
              : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {budgetAlert.status === "EXCEEDED"
                ? `هشدار: سقف بودجه دسته‌بندی «${budgetAlert.categoryName}» پر شده است!`
                : `توجه: سقف بودجه دسته‌بندی «${budgetAlert.categoryName}» در آستانه اتمام است (${toPersianDigits(budgetAlert.usagePercent)}٪).`}
            </span>
          </div>
          <span className="font-bold underline text-[11px] shrink-0">
            مشاهده گزارش
          </span>
        </Link>
      )}

      {/* 2. Primary Action Bar: New Expense, Settle Up, & Reports */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <Link href={`/app/groups/${groupId}/expenses/new`}>
          <Button
            variant="primary"
            size="lg"
            className="w-full text-xs sm:text-sm font-bold shadow-sm"
            leftIcon={<Plus className="w-5 h-5 ml-1" />}
          >
            ثبت خرج جدید
          </Button>
        </Link>

        <Link href={`/app/groups/${groupId}/settle`}>
          <Button
            variant="outline"
            size="lg"
            className="w-full text-xs sm:text-sm font-bold bg-white shadow-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50"
            leftIcon={<HandCoins className="w-5 h-5 ml-1 text-emerald-600" />}
          >
            تسویه حساب
          </Button>
        </Link>

        <Link href={`/app/groups/${groupId}/reports`}>
          <Button
            variant="outline"
            size="lg"
            className="w-full text-xs sm:text-sm font-bold bg-white shadow-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            leftIcon={<BarChart3 className="w-5 h-5 ml-1 text-indigo-600" />}
          >
            گزارش‌ها و بودجه
          </Button>
        </Link>
      </div>

      {/* 3. Shared House Fund (صندوق مشترک خانه) Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-sm text-slate-900">
              صندوق مشترک خانه (کارت بانکی)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            تراز صندوق با کارت فیزیکی
          </span>
        </div>

        {group.funds.length === 0 ? (
          <Card className="p-5 text-center bg-slate-50 border-dashed border-2 border-slate-200">
            <p className="text-xs text-slate-500 mb-3">
              هنوز صندوق مشترکی برای این گروه تعریف نشده است.
            </p>
            <Link href={`/app/groups/${groupId}/settings`}>
              <Button variant="primary" size="sm">
                ایجاد صندوق جدید
              </Button>
            </Link>
          </Card>
        ) : (
          group.funds.map((fund) => {
            const bal = BigInt(fund.currentBalance);
            return (
              <div
                key={fund.id}
                className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-emerald-500/20 relative overflow-hidden"
              >
                {/* Decorative golden chip & ambient glow */}
                <div className="absolute -top-12 -left-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="font-extrabold text-sm text-slate-200">
                        {fund.title}
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                        کارت مشترک خانه
                      </span>
                    </div>

                    {/* Golden EMV Chip SVG */}
                    <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border border-amber-300 shadow-xs flex items-center justify-center p-1">
                      <div className="w-full h-full border border-amber-600/40 rounded-xs grid grid-cols-2 gap-0.5 opacity-80" />
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-400 block">موجودی صندوق</span>
                    <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
                      {formatToman(bal)}
                    </div>
                  </div>

                  {/* Card Number LTR */}
                  {fund.cardNumber && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 text-xs text-slate-300 font-mono tracking-widest" dir="ltr">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{fund.cardNumber}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">کارت متصل به صندوق</span>
                    </div>
                  )}

                  {/* Glass Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveFundForDeposit(fund)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-3.5 shadow-sm border border-emerald-400/30"
                      leftIcon={<Plus className="w-3.5 h-3.5 ml-1" />}
                    >
                      + شارژ صندوق
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveFundForReconcile(fund);
                        setReconcileBalance(fund.currentBalance);
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs h-9 px-3.5 backdrop-blur-xs font-semibold"
                      leftIcon={<Scale className="w-3.5 h-3.5 ml-1 text-emerald-300" />}
                    >
                      تطبیق موجودی
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Double-Framed Segmented Control */}
      <div className="p-1 bg-slate-200/70 rounded-xl flex items-center gap-1 text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveMainTab("SETTLEMENTS")}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMainTab === "SETTLEMENTS"
              ? "bg-white text-emerald-800 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>تراز و تسویه هوشمند</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMainTab("LEDGER");
            if (ledgerFilter === "AUDIT") setLedgerFilter("ALL");
          }}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMainTab === "LEDGER"
              ? "bg-white text-emerald-800 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>دفتر کل تراکنش‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMainTab("AUDIT");
            setLedgerFilter("AUDIT");
          }}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMainTab === "AUDIT"
              ? "bg-white text-emerald-800 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>تاریخچه تغییرات</span>
        </button>
      </div>

      {/* Main Tab 1: Settlements & Balances */}
      {activeMainTab === "SETTLEMENTS" && (
        <div className="space-y-6">
          {/* 4. Smart Settlement Suggestions (پیشنهاد تسویه هوشمند) */}
          <Card className="p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-sm text-slate-900">
                  پیشنهاد تسویه حساب هوشمند
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">
                کمترین تعداد تراکنش ممکن
              </span>
            </div>

            {group.simplifiedDebts.length === 0 ? (
              <div className="py-6 text-center bg-emerald-50/50 rounded-xl border border-emerald-100 p-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-emerald-900">
                  تمامی حساب‌های اعضا و صندوق‌ها کاملاً تسویه است!
                </p>
                <p className="text-[11px] text-emerald-700 mt-1">
                  هیچ فردی به فرد دیگری یا صندوق بدهکار نیست.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {group.simplifiedDebts.map((debt, idx) => {
                  const amountVal = BigInt(debt.amount);
                  const fromName = resolveEntityName(debt.fromId);
                  const toName = resolveEntityName(debt.toId);

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{fromName}</span>
                        <span className="text-slate-400">باید به</span>
                        <span className="font-bold text-emerald-700">{toName}</span>
                        <span className="text-slate-400">بپردازد:</span>
                        <span className="font-extrabold text-sm text-slate-900 tabular-nums mr-1">
                          {formatToman(amountVal)}
                        </span>
                      </div>

                      {!debt.fromId.startsWith("FUND:") &&
                        !debt.toId.startsWith("FUND:") && (
                          <Link
                            href={`/app/groups/${groupId}/settle?from=${debt.fromId}&to=${debt.toId}&amount=${debt.amount}`}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white text-[11px] h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold"
                            >
                              ثبت این تسویه
                            </Button>
                          </Link>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 5. Member Balances List (تراز اعضای گروه) */}
          <Card className="p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-sm text-slate-900">تراز اعضای گروه</h2>
              </div>
              <Badge
                variant={group.isBalanced ? "credit" : "warning"}
                size="sm"
                className="text-[10px]"
              >
                {group.isBalanced ? "تراز دقیق سیستم ✓" : "نیاز به بررسی"}
              </Badge>
            </div>

            <div className="divide-y divide-slate-100">
              {group.members.map((member) => {
                const netVal = BigInt(member.netBalance);
                const isCreditor = netVal > 0n;
                const isDebtor = netVal < 0n;

                return (
                  <div
                    key={member.memberId}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-700">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            {member.name}
                          </span>
                          {member.role === "OWNER" && (
                            <Badge
                              variant="pro"
                              size="sm"
                              className="text-[10px] py-0 px-1.5"
                            >
                              مدیر
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          {toPersianDigits(member.phone)}
                        </span>
                      </div>
                    </div>

                    <div className="text-left">
                      <span
                        className={`font-bold text-sm block tabular-nums ${
                          isCreditor
                            ? "text-emerald-600"
                            : isDebtor
                            ? "text-red-600"
                            : "text-slate-500"
                        }`}
                      >
                        {isCreditor && "+"}
                        {formatToman(netVal)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isCreditor ? "طلبکار" : isDebtor ? "بدهکار" : "بی‌حساب"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Main Tab 2 & 3: Ledger & Audit Logs */}
      {(activeMainTab === "LEDGER" || activeMainTab === "AUDIT") && (
      <Card className="p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-700" />
            <h2 className="font-bold text-base text-slate-900">
              {activeMainTab === "AUDIT"
                ? "تاریخچه تغییرات و رخدادهای مالی"
                : "دفتر کل تراکنش‌های گروه"}
            </h2>
          </div>

          {/* Filter Pills */}
          {activeMainTab === "LEDGER" && (
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: "ALL", label: "همه" },
                { id: "EXPENSES", label: "خرج‌ها" },
                { id: "SETTLEMENTS", label: "تسویه‌ها" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLedgerFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    ledgerFilter === f.id
                      ? "bg-white text-emerald-700 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content of Ledger */}
        <div className="divide-y divide-slate-100">
          {/* EXPENSES SECTION */}
          {(ledgerFilter === "ALL" || ledgerFilter === "EXPENSES") &&
            expensesList.map((exp) => {
              const amountVal = BigInt(exp.totalAmount);
              return (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExpense(exp)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs"
                      style={{
                        backgroundColor: `${exp.category.color}20`,
                        color: exp.category.color,
                      }}
                    >
                      {exp.category.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {exp.title}
                        </span>
                        <Badge
                          variant={
                            exp.paymentSource === "FUND" ? "pro" : "neutral"
                          }
                          size="sm"
                          className="text-[10px] py-0 px-1.5"
                        >
                          {exp.paymentSource === "FUND" ? "صندوق خانه" : "شخصی"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {exp.paymentSource === "PERSONAL"
                          ? `پرداخت توسط ${exp.paidByUser?.name || "یکی از اعضا"}`
                          : `پرداخت از ${exp.fund?.title || "صندوق خانه"}`}
                        {" • "}
                        {toPersianDigits(
                          new Date(exp.expenseDate).toLocaleDateString("fa-IR")
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-left">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                      {formatToman(amountVal)}
                    </span>
                    <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </div>
              );
            })}

          {/* SETTLEMENTS SECTION */}
          {(ledgerFilter === "ALL" || ledgerFilter === "SETTLEMENTS") &&
            settlementsList.map((stl) => {
              const amountVal = BigInt(stl.amount);
              return (
                <div
                  key={stl.id}
                  className="py-3 flex items-center justify-between px-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <HandCoins className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <span>{stl.fromUser.name}</span>
                        <span className="text-slate-400">به</span>
                        <span className="text-emerald-700">{stl.toUser.name}</span>
                        <Badge variant="credit" size="sm" className="text-[10px] py-0">
                          تسویه
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {stl.note || "تسویه‌حساب دنگ"} •{" "}
                        {toPersianDigits(
                          new Date(stl.settledAt).toLocaleDateString("fa-IR")
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="font-bold text-xs sm:text-sm text-emerald-700 tabular-nums">
                    {formatToman(amountVal)}
                  </span>
                </div>
              );
            })}

          {/* AUDIT LOGS SECTION */}
          {(ledgerFilter === "ALL" || ledgerFilter === "AUDIT") &&
            auditList.map((log) => (
              <div
                key={log.id}
                className="py-3 px-2 flex items-start gap-3 text-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                  <History className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      {log.changedByUser?.name || "سیستم"}
                    </span>
                    <Badge variant="neutral" size="sm" className="text-[10px] py-0">
                      {log.action}
                    </Badge>
                    <span className="text-[10px] text-slate-400 mr-auto tabular-nums">
                      {toPersianDigits(
                        new Date(log.createdAt).toLocaleDateString("fa-IR")
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {log.action === "CREATE" && "سند جدیدی در سیستم ثبت کرد."}
                    {log.action === "UPDATE" && "سندی را ویرایش و به‌روزرسانی کرد."}
                    {log.action === "DELETE" && "سندی را از سیستم حذف کرد."}
                    {log.action === "RECONCILE" && "موجودی کارت خانه را تطبیق داد."}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </Card>
      )}

      {/* 7. Invite Box */}
      <Card className="p-5 border-dashed border-2 border-emerald-300 bg-emerald-50/30 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-emerald-600" />
              دعوت از اعضای خانواده یا هم‌خانه‌ها
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              کد دعوت:{" "}
              <code className="bg-white px-2 py-0.5 rounded font-mono font-bold text-emerald-800 border border-emerald-200 text-sm">
                {group.inviteCode}
              </code>
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyInvite}
            className="text-xs bg-white"
            leftIcon={
              copied ? (
                <Check className="w-4 h-4 ml-1 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 ml-1 text-slate-500" />
              )
            }
          >
            {copied ? "لینک کپی شد!" : "کپی لینک دعوت"}
          </Button>
        </div>
      </Card>

      {/* MODAL 1: Expense Detail & Audit Log Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{
                    backgroundColor: `${selectedExpense.category.color}20`,
                    color: selectedExpense.category.color,
                  }}
                >
                  {selectedExpense.category.name.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-base font-bold">
                    {selectedExpense.title}
                  </CardTitle>
                  <p className="text-xs text-slate-400">
                    {selectedExpense.category.name} •{" "}
                    {toPersianDigits(
                      new Date(selectedExpense.expenseDate).toLocaleDateString(
                        "fa-IR"
                      )
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedExpense(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="space-y-5 pt-4">
              {/* Amount & Source Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">
                    مبلغ کل فاکتور:
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                    {formatToman(BigInt(selectedExpense.totalAmount))}
                  </span>
                </div>

                <Badge
                  variant={
                    selectedExpense.paymentSource === "FUND" ? "pro" : "neutral"
                  }
                  size="md"
                >
                  {selectedExpense.paymentSource === "FUND"
                    ? `پرداخت از ${selectedExpense.fund?.title || "صندوق خانه"}`
                    : `پرداخت توسط ${selectedExpense.paidByUser?.name || "عضو"}`}
                </Badge>
              </div>

              {/* Splits Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  تقسیم دنگ اعضا ({selectedExpense.splits.length} نفر)
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl px-3 bg-white">
                  {selectedExpense.splits.map((s) => (
                    <div
                      key={s.id}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">
                        {s.user.name}
                      </span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {formatToman(BigInt(s.owedAmount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Log / History of this Expense */}
              {selectedExpense.auditLogs && selectedExpense.auditLogs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-600" />
                    تاریخچه تغییرات سند (Audit Log)
                  </h4>
                  <div className="space-y-1.5">
                    {selectedExpense.auditLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-800 ml-1">
                            {log.changedByUser?.name || "کاربر"}
                          </span>
                          <span>
                            {log.action === "CREATE"
                              ? "سند را ایجاد کرد."
                              : "سند را ویرایش کرد."}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          {toPersianDigits(
                            new Date(log.createdAt).toLocaleDateString("fa-IR")
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions: Edit & Delete */}
              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <Link
                  href={`/app/groups/${groupId}/expenses/${selectedExpense.id}/edit`}
                  className="w-1/2"
                >
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full text-xs"
                    leftIcon={<Edit3 className="w-4 h-4 ml-1" />}
                  >
                    ویرایش سند
                  </Button>
                </Link>

                <Button
                  variant="danger"
                  size="md"
                  onClick={() => setExpenseToDeleteId(selectedExpense.id)}
                  isLoading={isDeletingExpense}
                  className="w-1/2 text-xs"
                  leftIcon={<Trash2 className="w-4 h-4 ml-1" />}
                >
                  حذف سند هزینه
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 2: Deposit to Fund Modal */}
      {activeFundForDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <Card className="w-full max-w-md shadow-xl border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold">
                  شارژ و واریز به {activeFundForDeposit.title}
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  مبلغ واریزی به موجودی صندوق اضافه و در تراز شما به عنوان طلب
                  ثبت می‌شود.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveFundForDeposit(null);
                  setDepositError(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent>
              {depositError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {depositError}
                </div>
              )}

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <Input
                  label="مبلغ واریزی (تومان)"
                  placeholder="مثال: ۵۰۰,۰۰۰"
                  numericOnly
                  currencyPreview
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  autoFocus
                />

                <Input
                  label="توضیحات واریز (اختیاری)"
                  placeholder="مثال: واریز شارژ ماهانه، سهم خرید اولیه"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                />

                <div className="pt-2 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/2"
                    onClick={() => {
                      setActiveFundForDeposit(null);
                      setDepositError(null);
                    }}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-1/2"
                    isLoading={isDepositing}
                  >
                    ثبت واریز
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 3: Reconciliation Modal (تطبیق موجودی کارت) */}
      {activeFundForReconcile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <Card className="w-full max-w-md shadow-xl border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  تطبیق موجودی کارت بانکی خانه
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  صندوق: {activeFundForReconcile.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveFundForReconcile(null);
                  setReconcileError(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent>
              {reconcileError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {reconcileError}
                </div>
              )}

              {/* Current System vs Actual Preview */}
              <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">موجودی فعلی در سیستم:</span>
                  <span className="font-bold tabular-nums">
                    {formatToman(BigInt(activeFundForReconcile.currentBalance))}
                  </span>
                </div>

                {parseToman(reconcileBalance) !==
                  BigInt(activeFundForReconcile.currentBalance) && (
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-600 font-semibold">
                      مغایرت محاسبه‌شده:
                    </span>
                    <span
                      className={`font-black tabular-nums ${
                        parseToman(reconcileBalance) <
                        BigInt(activeFundForReconcile.currentBalance)
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {parseToman(reconcileBalance) <
                      BigInt(activeFundForReconcile.currentBalance)
                        ? `کسری: ${formatToman(
                            BigInt(activeFundForReconcile.currentBalance) -
                              parseToman(reconcileBalance)
                          )}`
                        : `مازاد: ${formatToman(
                            parseToman(reconcileBalance) -
                              BigInt(activeFundForReconcile.currentBalance)
                          )}`}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleReconcileSubmit} className="space-y-4">
                <Input
                  label="موجودی واقعی فعلی کارت بانکی (استعلام از همراه بانک)"
                  placeholder="موجودی دقیق به تومان"
                  numericOnly
                  currencyPreview
                  value={reconcileBalance}
                  onChange={(e) => setReconcileBalance(e.target.value)}
                  autoFocus
                />

                <Input
                  label="توضیحات تطبیق (اختیاری)"
                  placeholder="مثال: تطبیق هفتگی، کارمزد کارت به کارت"
                  value={reconcileNote}
                  onChange={(e) => setReconcileNote(e.target.value)}
                />

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  * در صورت کسری موجودی، اختلاف به عنوان خرج ثبت‌نشده بین تمامی
                  اعضای گروه مساوی تقسیم می‌شود تا حساب‌ها تراز گردند.
                </p>

                <div className="pt-2 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/2"
                    onClick={() => {
                      setActiveFundForReconcile(null);
                      setReconcileError(null);
                    }}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-1/2"
                    isLoading={isReconciling}
                  >
                    تأیید و تطبیق
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Confirm Delete Expense Modal */}
      <ConfirmModal
        isOpen={!!expenseToDeleteId}
        onClose={() => setExpenseToDeleteId(null)}
        onConfirm={executeDeleteExpense}
        title="حذف سند هزینه"
        description="آیا از حذف این فاکتور اطمینان دارید؟ با حذف این هزینه، سهم بدهی و بستانکاری تمام اعضا و موجودی صندوق به وضعیت پیش از ثبت این فاکتور بازخواهد گشت."
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        isLoading={isDeletingExpense}
      />
    </div>
  );
}
