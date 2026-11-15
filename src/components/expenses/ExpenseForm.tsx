"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { formatToman, toPersianDigits, parseToman } from "@/lib/money";
import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentSplit,
  calculateSharesSplit,
  SplitResult,
} from "@/lib/accounting/split-calculator";
import {
  Wallet,
  PiggyBank,
  Users,
  Percent,
  Divide,
  Scale,
  Calendar,
  AlertCircle,
  Save,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
  Minus,
} from "lucide-react";

const QUICK_SUGGESTIONS = [
  { label: "خرید سوپرمارکت", keywords: ["سوپرمارکت", "خوراک", "خرید"] },
  { label: "قبض و اینترنت", keywords: ["قبوض", "اینترنت", "قبض"] },
  { label: "اجاره و شارژ", keywords: ["اجاره", "شارژ", "مسکن"] },
  { label: "میوه و نان", keywords: ["خوراک", "سوپرمارکت", "میوه"] },
];

export interface ExpenseFormProps {
  groupId: string;
  members: Array<{
    userId: string;
    name: string;
    phone: string;
  }>;
  funds: Array<{
    id: string;
    title: string;
    currentBalance: string;
  }>;
  currentUserId: string;
  initialData?: {
    id: string;
    title: string;
    totalAmount: string;
    categoryId: string;
    paymentSource: "PERSONAL" | "FUND";
    paidByUserId?: string | null;
    fundId?: string | null;
    splitType: "EQUAL" | "EXACT" | "PERCENT" | "SHARES";
    expenseDate?: string;
    splits: Array<{
      userId: string;
      owedAmount: string;
      shareValue?: number | null;
    }>;
  };
}

export function ExpenseForm({
  groupId,
  members,
  funds,
  currentUserId,
  initialData,
}: ExpenseFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Basic Fields
  const [title, setTitle] = useState(initialData?.title || "");
  const [amountStr, setAmountStr] = useState(
    initialData ? initialData.totalAmount : ""
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [categories, setCategories] = useState<any[]>([]);
  const [expenseDate, setExpenseDate] = useState(
    initialData?.expenseDate
      ? new Date(initialData.expenseDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  // Payment Source
  const [paymentSource, setPaymentSource] = useState<"PERSONAL" | "FUND">(
    initialData?.paymentSource || "PERSONAL"
  );
  const [paidByUserId, setPaidByUserId] = useState(
    initialData?.paidByUserId || currentUserId
  );
  const [fundId, setFundId] = useState(
    initialData?.fundId || (funds.length > 0 ? funds[0].id : "")
  );

  // Split Mode: EQUAL, EXACT, PERCENT, SHARES
  const [splitType, setSplitType] = useState<
    "EQUAL" | "EXACT" | "PERCENT" | "SHARES"
  >(initialData?.splitType || "EQUAL");

  // State for EQUAL mode (selected member IDs)
  const [equalMembers, setEqualMembers] = useState<string[]>(
    initialData
      ? initialData.splits.map((s) => s.userId)
      : members.map((m) => m.userId)
  );

  // Progressive disclosure toggle: only expand split settings if custom split or user explicitly opened it
  const isAllMembersEqual =
    splitType === "EQUAL" &&
    equalMembers.length === members.length &&
    members.every((m) => equalMembers.includes(m.userId));

  const [isAdvancedSplitOpen, setIsAdvancedSplitOpen] = useState(
    !isAllMembersEqual || (initialData && initialData.splitType !== "EQUAL")
  );

  // Progressive disclosure for date & notes
  const [isDetailsOpen, setIsDetailsOpen] = useState(
    !!(initialData?.expenseDate && new Date(initialData.expenseDate).toISOString().split("T")[0] !== new Date().toISOString().split("T")[0])
  );

  // State for EXACT mode: Record<userId, string>
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    members.forEach((m) => {
      const match = initialData?.splits.find((s) => s.userId === m.userId);
      map[m.userId] = match ? match.owedAmount : "";
    });
    return map;
  });

  // State for PERCENT mode: Record<userId, number>
  const [percents, setPercents] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    const n = members.length;
    members.forEach((m, idx) => {
      const match = initialData?.splits.find((s) => s.userId === m.userId);
      if (match && match.shareValue !== undefined && match.shareValue !== null) {
        map[m.userId] = match.shareValue;
      } else {
        map[m.userId] = idx === 0 ? 100 - (n - 1) * Math.floor(100 / n) : Math.floor(100 / n);
      }
    });
    return map;
  });

  // State for SHARES mode: Record<userId, number>
  const [shares, setShares] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    members.forEach((m) => {
      const match = initialData?.splits.find((s) => s.userId === m.userId);
      map[m.userId] =
        match && match.shareValue && match.shareValue > 0
          ? match.shareValue
          : 1;
    });
    return map;
  });

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch(`/api/groups/${groupId}/categories`);
        const data = await res.json();
        if (data.categories) {
          setCategories(data.categories);
          if (!categoryId && data.categories.length > 0) {
            setCategoryId(data.categories[0].id);
          }
        }
      } catch (err) {
        console.error("fetch categories error:", err);
      }
    };
    fetchCats();
  }, [groupId]);

  const parsedAmount = parseToman(amountStr);

  // Calculate live preview of splits
  let splitPreview: SplitResult[] = [];
  let splitError: string | null = null;

  if (parsedAmount > 0n) {
    try {
      if (splitType === "EQUAL") {
        if (equalMembers.length === 0) {
          splitError = "حداقل یک عضو باید برای تقسیم مساوی انتخاب شود.";
        } else {
          splitPreview = calculateEqualSplit(parsedAmount, equalMembers);
        }
      } else if (splitType === "EXACT") {
        const list = members.map((m) => ({
          userId: m.userId,
          amount: parseToman(exactAmounts[m.userId] || "0"),
        }));
        const sumExact = list.reduce((acc, curr) => acc + curr.amount, 0n);
        const diff = parsedAmount - sumExact;
        if (diff !== 0n) {
          splitError =
            diff > 0n
              ? `${formatToman(diff)} کمتر از مبلغ کل وارد شده است.`
              : `${formatToman(-diff)} بیشتر از مبلغ کل وارد شده است.`;
        } else {
          splitPreview = calculateExactSplit(parsedAmount, list);
        }
      } else if (splitType === "PERCENT") {
        const list = members.map((m) => ({
          userId: m.userId,
          percent: percents[m.userId] || 0,
        }));
        const sumP = list.reduce((acc, curr) => acc + curr.percent, 0);
        if (Math.abs(sumP - 100) > 0.001) {
          splitError = `مجموع درصدها باید ۱۰۰٪ باشد (مجموع فعلی: ${sumP}٪).`;
        } else {
          splitPreview = calculatePercentSplit(parsedAmount, list);
        }
      } else if (splitType === "SHARES") {
        const list = members.map((m) => ({
          userId: m.userId,
          shares: shares[m.userId] || 1,
        }));
        splitPreview = calculateSharesSplit(parsedAmount, list);
      }
    } catch (e: any) {
      splitError = e.message;
    }
  }

  const isValidToSubmit =
    title.trim().length >= 2 &&
    parsedAmount > 0n &&
    categoryId &&
    !splitError &&
    splitPreview.length > 0 &&
    (paymentSource === "PERSONAL" ? !!paidByUserId : !!fundId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidToSubmit) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      let participantsPayload: any[] = [];
      if (splitType === "EQUAL") {
        participantsPayload = equalMembers;
      } else if (splitType === "EXACT") {
        participantsPayload = members.map((m) => ({
          userId: m.userId,
          amount: parseToman(exactAmounts[m.userId] || "0").toString(),
        }));
      } else if (splitType === "PERCENT") {
        participantsPayload = members.map((m) => ({
          userId: m.userId,
          percent: percents[m.userId] || 0,
        }));
      } else if (splitType === "SHARES") {
        participantsPayload = members.map((m) => ({
          userId: m.userId,
          shares: shares[m.userId] || 1,
        }));
      }

      const payload = {
        title: title.trim(),
        totalAmount: parsedAmount.toString(),
        categoryId,
        expenseDate,
        paymentSource,
        paidByUserId: paymentSource === "PERSONAL" ? paidByUserId : null,
        fundId: paymentSource === "FUND" ? fundId : null,
        splitType,
        participants: participantsPayload,
        notes: notes.trim() || undefined,
      };

      const url = initialData
        ? `/api/groups/${groupId}/expenses/${initialData.id}`
        : `/api/groups/${groupId}/expenses`;
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ثبت هزینه.");
      }

      toast.success(
        initialData
          ? "تغییرات سند هزینه ذخیره شد."
          : "خرج جدید با موفقیت ثبت شد."
      );
      router.push(`/app/groups/${groupId}`);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "خطای ارتباط با سرور");
      toast.error(err.message || "خطا در ثبت سند هزینه.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. المبلغ (تومان) - Large, prominent, zero-error input */}
      <Card className="p-5 shadow-xs border-slate-200">
        <Input
          label="مبلغ هزینه (تومان)"
          placeholder="مثال: ۳۵۰,۰۰۰"
          numericOnly
          currencyPreview
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
          className="text-lg sm:text-xl font-extrabold h-12"
          required
          autoFocus
        />
      </Card>

      {/* 2. بابت چه چیزی؟ (عنوان و انتخاب دسته‌بندی با یک تپ) */}
      <Card className="p-5 space-y-4 shadow-xs border-slate-200">
        <Input
          label="بابت چه چیزی؟ (عنوان هزینه)"
          placeholder="مثال: خرید سوپرمارکت، گوشت و مرغ، شارژ ساختمان"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[11px] text-slate-500 font-medium">پیشنهاد سریع:</span>
          {QUICK_SUGGESTIONS.map((s) => (
            <button
              type="button"
              key={s.label}
              onClick={() => {
                setTitle(s.label);
                const matchedCat = categories.find((c) =>
                  s.keywords.some((kw) => c.name.includes(kw))
                );
                if (matchedCat) {
                  setCategoryId(matchedCat.id);
                }
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 font-medium transition-colors active:scale-95"
            >
              + {s.label}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            انتخاب دسته‌بندی
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const isSelected = categoryId === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`text-xs px-3.5 py-2 rounded-xl border transition-all duration-150 flex items-center gap-1.5 active:scale-95 ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 3. پرداخت توسط (منبع پرداخت جمع‌وجور) */}
      <Card className="p-5 space-y-3.5 shadow-xs border-slate-200">
        <label className="block text-xs font-semibold text-slate-700">
          پرداخت توسط چه منبعی انجام شد؟
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentSource("PERSONAL")}
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              paymentSource === "PERSONAL"
                ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>جیب شخصی</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentSource("FUND")}
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              paymentSource === "FUND"
                ? "bg-indigo-50 border-indigo-500 text-indigo-800 ring-2 ring-indigo-500/20"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <PiggyBank className="w-4 h-4 text-indigo-600" />
            <span>صندوق خانه</span>
          </button>
        </div>

        {paymentSource === "PERSONAL" ? (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              کدام عضو پرداخت را انجام داد؟
            </label>
            <select
              value={paidByUserId}
              onChange={(e) => setPaidByUserId(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} {m.userId === currentUserId ? "(شما)" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              از کدام صندوق مشترک کسر شود؟
            </label>
            {funds.length === 0 ? (
              <p className="text-xs text-red-600">
                هیچ صندوق مشترکی در این گروه تعریف نشده است.
              </p>
            ) : (
              <select
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title} (موجودی: {formatToman(BigInt(f.currentBalance))})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </Card>

      {/* 4. نحوه تقسیم دنگ‌ها (با Progressive Disclosure) */}
      <Card className="p-5 space-y-3.5 shadow-xs border-slate-200">
        {!isAdvancedSplitOpen ? (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Divide className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-900">
                  تقسیم مساوی بین تمام اعضا ({toPersianDigits(members.length)} نفر)
                </span>
              </div>
              <p className="text-xs text-emerald-700 font-medium tabular-nums">
                {parsedAmount > 0n && splitPreview.length > 0 ? (
                  <span>
                    سهم هر نفر:{" "}
                    <strong className="font-extrabold text-sm">
                      {formatToman(splitPreview[0].owedAmount)}
                    </strong>
                  </span>
                ) : (
                  "مبلغ بین تمام اعضا به‌طور مساوی تقسیم می‌شود"
                )}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdvancedSplitOpen(true)}
              className="text-xs gap-1.5"
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            >
              تغییر نفرات یا نحوه تقسیم
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-900">
                  تنظیمات نحوه دنگ‌بندی
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSplitType("EQUAL");
                  setEqualMembers(members.map((m) => m.userId));
                  setIsAdvancedSplitOpen(false);
                }}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                بازگشت به تقسیم مساوی همه
              </button>
            </div>

            {/* 4-Tab Selector */}
            <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-center">
              {[
                { type: "EQUAL", label: "مساوی", icon: Divide },
                { type: "EXACT", label: "مبلغ دقیق", icon: Scale },
                { type: "PERCENT", label: "درصدی", icon: Percent },
                { type: "SHARES", label: "سهمیه‌ای", icon: Users },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    type="button"
                    key={tab.type}
                    onClick={() =>
                      setSplitType(tab.type as "EQUAL" | "EXACT" | "PERCENT" | "SHARES")
                    }
                    className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                      splitType === tab.type
                        ? "bg-white text-emerald-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: EQUAL */}
            {splitType === "EQUAL" && (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-slate-500 mb-2">
                  اعضایی که در این هزینه سهیم هستند را علامت بزنید:
                </p>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl px-3">
                  {members.map((m) => {
                    const isChecked = equalMembers.includes(m.userId);
                    const previewMatch = splitPreview.find((s) => s.userId === m.userId);

                    return (
                      <label
                        key={m.userId}
                        className="py-2.5 flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEqualMembers([...equalMembers, m.userId]);
                              } else {
                                setEqualMembers(
                                  equalMembers.filter((id) => id !== m.userId)
                                );
                              }
                            }}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-xs font-semibold text-slate-800">
                            {m.name}
                          </span>
                        </div>

                        {isChecked && previewMatch && (
                          <span className="text-xs font-bold text-emerald-700 tabular-nums">
                            {formatToman(previewMatch.owedAmount)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: EXACT */}
            {splitType === "EXACT" && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    مبلغ سهم هر فرد را دقیقاً به تومان وارد کنید:
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      splitError ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {splitError ? splitError : "تراز کامل است ✓"}
                  </span>
                </div>

                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.userId} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700 w-28 truncate">
                        {m.name}
                      </span>
                      <Input
                        placeholder="۰ تومان"
                        numericOnly
                        value={exactAmounts[m.userId] || ""}
                        onChange={(e) =>
                          setExactAmounts({
                            ...exactAmounts,
                            [m.userId]: e.target.value,
                          })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: PERCENT */}
            {splitType === "PERCENT" && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    درصد سهم هر عضو از ۱۰۰٪ را مشخص کنید:
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      splitError ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {splitError ? splitError : "مجموع ۱۰۰٪ است ✓"}
                  </span>
                </div>

                <div className="space-y-2">
                  {members.map((m) => {
                    const previewMatch = splitPreview.find((s) => s.userId === m.userId);
                    return (
                      <div key={m.userId} className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 w-28 truncate">
                          {m.name}
                        </span>
                        <div className="w-24 relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={percents[m.userId] ?? 0}
                            onChange={(e) =>
                              setPercents({
                                ...percents,
                                [m.userId]: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs text-center font-bold"
                          />
                          <span className="absolute left-2 top-2.5 text-[10px] text-slate-400">
                            ٪
                          </span>
                        </div>

                        <span className="text-xs font-bold text-slate-600 tabular-nums flex-1 text-left">
                          {previewMatch ? formatToman(previewMatch.owedAmount) : "۰"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 4: SHARES */}
            {splitType === "SHARES" && (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-500">
                  ضریب یا تعداد سهم هر نفر را مشخص کنید (مثلاً ۱ سهم، ۲ سهم):
                </p>

                <div className="space-y-2">
                  {members.map((m) => {
                    const sVal = shares[m.userId] || 1;
                    const previewMatch = splitPreview.find((s) => s.userId === m.userId);

                    return (
                      <div
                        key={m.userId}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <span className="text-xs font-semibold text-slate-700">
                          {m.name}
                        </span>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                setShares({
                                  ...shares,
                                  [m.userId]: Math.max(1, sVal - 1),
                                })
                              }
                              className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-800"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-bold text-xs tabular-nums">
                              {toPersianDigits(sVal)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setShares({
                                  ...shares,
                                  [m.userId]: sVal + 1,
                                })
                              }
                              className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-800"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs font-bold text-emerald-700 tabular-nums w-24 text-left">
                            {previewMatch ? formatToman(previewMatch.owedAmount) : "۰"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 5. تنظیمات بیشتر (تاریخ و جزئیات اختیاری) */}
      <Card className="p-4 shadow-xs border-slate-200">
        <button
          type="button"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 select-none py-1"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>تنظیمات بیشتر (تاریخ فاکتور و یادداشت)</span>
          </div>
          {isDetailsOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isDetailsOpen && (
          <div className="pt-4 border-t border-slate-100 mt-3 space-y-3.5 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                تاریخ فاکتور / هزینه
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                یادداشت یا توضیحات فاکتور (اختیاری)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="توضیحاتی برای هم‌خانه‌ها بنویسید..."
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full text-sm font-bold shadow-md h-12"
          disabled={!isValidToSubmit || isSubmitting}
          isLoading={isSubmitting}
          leftIcon={<Save className="w-4 h-4 ml-1" />}
        >
          {initialData ? "ذخیره تغییرات سند هزینه" : "ثبت نهایی هزینه و دنگ‌ها"}
        </Button>
      </div>
    </form>
  );
}
