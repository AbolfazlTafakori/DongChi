"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Receipt,
  Calculator,
  PlusCircle,
  Check,
  Share2,
  Wallet,
  Users,
  Sparkles,
  ArrowRight,
  PiggyBank,
  CheckCircle2,
  Delete,
} from "lucide-react";
import {
  toPersianDigits,
  formatToman,
  formatLiveAmountInput,
} from "@/lib/money";
import { useToast } from "@/components/ui/Toast";
import { useMobileSync } from "@/hooks/useMobileSync";

interface GroupOption {
  id: string;
  title: string;
}

interface MobileQuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userGroups?: GroupOption[];
}

export function MobileQuickActionSheet({
  isOpen,
  onClose,
  userGroups = [],
}: MobileQuickActionSheetProps) {
  const { toast } = useToast();
  const { enqueueOfflineAction, triggerSync, isOnline } = useMobileSync();

  const [activeTab, setActiveTab] = useState<"EXPENSE" | "CALCULATOR" | "GROUP">("EXPENSE");

  // 1. Quick Expense Form State
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [rawAmountInput, setRawAmountInput] = useState("");
  const [paymentSource, setPaymentSource] = useState<"PERSONAL" | "FUND">("PERSONAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Instant Split Calculator State
  const [calcAmountInput, setCalcAmountInput] = useState("300000");
  const [peopleCount, setPeopleCount] = useState<number>(3);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (userGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(userGroups[0].id);
    }
  }, [userGroups, selectedGroupId]);

  if (!isOpen) return null;

  // Amount parsing with live words
  const parsedExpenseAmount = formatLiveAmountInput(rawAmountInput);
  const parsedCalcAmount = formatLiveAmountInput(calcAmountInput);

  // Calculator share calculation
  const calcTotalBigInt = parsedCalcAmount.value;
  const calcSharePerPerson =
    peopleCount > 0 && calcTotalBigInt > 0n
      ? calcTotalBigInt / BigInt(peopleCount)
      : 0n;

  const quickExpensePresets = [
    "نان و سوپرمارکت",
    "ناهار هم‌خانه‌ها",
    "خرید میوه و سبزیجات",
    "قبض اینترنت و شارژ",
    "لوازم شوینده و بهداشتی",
  ];

  // Native Touch Keypad handlers
  const handleKeypadPress = (digit: string) => {
    if (activeTab === "EXPENSE") {
      setRawAmountInput((prev) => {
        if (digit === "000" && (!prev || prev === "0")) return prev;
        if (prev.length >= 10) return prev;
        return prev + digit;
      });
    } else if (activeTab === "CALCULATOR") {
      setCalcAmountInput((prev) => {
        if (digit === "000" && (!prev || prev === "0")) return prev;
        if (prev.length >= 10) return prev;
        return prev + digit;
      });
    }
  };

  const handleBackspace = () => {
    if (activeTab === "EXPENSE") {
      setRawAmountInput((prev) => prev.slice(0, -1));
    } else if (activeTab === "CALCULATOR") {
      setCalcAmountInput((prev) => prev.slice(0, -1));
    }
  };

  const handleQuickAdd = (amountToAdd: number) => {
    if (activeTab === "EXPENSE") {
      const current = Number(parsedExpenseAmount.raw || 0);
      setRawAmountInput(String(current + amountToAdd));
    } else if (activeTab === "CALCULATOR") {
      const current = Number(parsedCalcAmount.raw || 0);
      setCalcAmountInput(String(current + amountToAdd));
    }
  };

  const handleQuickExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGroupId) {
      toast.error("لطفاً یک گروه را انتخاب کنید.");
      return;
    }
    if (!expenseTitle.trim()) {
      toast.error("لطفاً عنوان خرج را وارد کنید.");
      return;
    }
    if (parsedExpenseAmount.value <= 0n) {
      toast.error("مبلغ خرج باید بیشتر از صفر باشد.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        groupId: selectedGroupId,
        title: expenseTitle.trim(),
        totalAmount: parsedExpenseAmount.value.toString(),
        paymentSource,
        splitType: "EQUAL",
      };

      if (!isOnline) {
        // Enqueue offline action
        enqueueOfflineAction({
          type: "QUICK_EXPENSE",
          payload,
        });
        toast.success(
          "خرج در صف آفلاین ذخیره شد و به محض اتصال اینترنت با سرور همگام می‌شود."
        );
        onClose();
        resetExpenseForm();
        return;
      }

      // Online submission
      const res = await fetch(`/api/groups/${selectedGroupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "خطا در ثبت خرج");
      }

      toast.success("خرج با موفقیت در گروه ثبت و با سایت همگام شد.");
      triggerSync(true);
      window.dispatchEvent(new CustomEvent("dongchi:data-synced"));
      onClose();
      resetExpenseForm();
    } catch (err: any) {
      toast.error(err.message || "خطا در برقراری ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetExpenseForm = () => {
    setExpenseTitle("");
    setRawAmountInput("");
    setPaymentSource("PERSONAL");
  };

  const handleCopyShare = async () => {
    const text = `دنگ هر نفر از مبلغ ${formatToman(
      calcTotalBigInt
    )} بین ${toPersianDigits(peopleCount)} نفر: ${formatToman(
      calcSharePerPerson
    )} می‌باشد.\n(محاسبه‌شده با اپلیکیشن هوشمند دنگ‌چی)`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "محاسبه دنگ با دنگ‌چی",
          text,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedShare(true);
      toast.success("متن سهم دنگ در حافظه کپی شد.");
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      toast.error("خطا در کپی متن سهم");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-xs select-none transition-all animate-in fade-in"
      dir="rtl"
    >
      {/* Background backdrop tap to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-Up Bottom Sheet Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-t-[32px] shadow-2xl border-t border-slate-200 z-10 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Top Drag Handle Pill */}
        <div className="pt-3 pb-1 flex justify-center shrink-0 cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 hover:bg-slate-400 transition-colors" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                عملیات سریع نئوبانک
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                کیبورد عددی لمسی، ثبت خرج یا تقسیم فوری
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Mobile Action Tabs */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("EXPENSE")}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "EXPENSE"
                ? "bg-white text-emerald-700 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>ثبت خرج خانه</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CALCULATOR")}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "CALCULATOR"
                ? "bg-white text-emerald-700 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>دنگ سرانگشتی</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("GROUP")}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "GROUP"
                ? "bg-white text-emerald-700 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ساخت یا عضویت</span>
          </button>
        </div>

        {/* Tab 1: Quick Group Expense */}
        {activeTab === "EXPENSE" && (
          <form
            onSubmit={handleQuickExpenseSubmit}
            className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-right"
          >
            {userGroups.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-amber-50 border border-amber-200/70 space-y-2">
                <Users className="w-8 h-8 text-amber-600 mx-auto" />
                <p className="text-xs font-bold text-amber-900">
                  شما هنوز عضو هیچ گروهی نیستید.
                </p>
                <p className="text-[11px] text-amber-700">
                  برای ثبت خرج، ابتدا یک خانه بسازید یا با کد دعوت وارد شوید.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("GROUP")}
                    className="h-9 px-4 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-xs"
                  >
                    ساخت اولین گروه ←
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Group Selector & Title Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      خانه یا جمع:
                    </label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full h-10 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    >
                      {userGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      عنوان خرید:
                    </label>
                    <input
                      type="text"
                      value={expenseTitle}
                      onChange={(e) => setExpenseTitle(e.target.value)}
                      placeholder="مثال: نان و لبنیات صبحانه..."
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Quick Preset Pills */}
                <div className="flex gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
                  {quickExpensePresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExpenseTitle(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-600 shrink-0 cursor-pointer transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Amount Display & Words */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-1 text-center shadow-xs">
                  <span className="text-[10px] text-slate-400 font-medium block">
                    مبلغ هزینه (تومان):
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                    {parsedExpenseAmount.formatted || "۰"}
                    <span className="text-xs text-slate-400 mr-1.5 font-bold">تومان</span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate">
                    {parsedExpenseAmount.words || "صفر تومان"}
                  </p>
                </div>

                {/* Quick-Add Chips */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[50000, 100000, 200000, 500000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAdd(val)}
                      className="h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200/60 transition-colors cursor-pointer"
                    >
                      +{toPersianDigits(val / 1000)}هزار
                    </button>
                  ))}
                </div>

                {/* 3x4 Touch Numeric Keypad */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleKeypadPress(d)}
                      className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-extrabold text-base transition-all cursor-pointer flex items-center justify-center tabular-nums shadow-2xs"
                    >
                      {toPersianDigits(d)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleKeypadPress("000")}
                    className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                  >
                    ۰۰۰
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress("0")}
                    className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-extrabold text-base transition-all cursor-pointer flex items-center justify-center tabular-nums shadow-2xs"
                  >
                    ۰
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="h-11 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 font-extrabold text-sm transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                    title="پاک کردن رقم آخر"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>

                {/* Payment Source Toggle */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentSource("PERSONAL")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      paymentSource === "PERSONAL"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>پرداخت از جیب من</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentSource("FUND")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      paymentSource === "FUND"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <PiggyBank className="w-4 h-4" />
                    <span>کسر از صندوق مشترک</span>
                  </button>
                </div>

                {/* Submit Action */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="inline-block animate-spin">⏳</span>
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>
                      {!isOnline ? "ذخیره در صف آفلاین" : "ثبت و تقسیم خودکار دنگ"}
                    </span>
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* Tab 2: Instant Split Calculator */}
        {activeTab === "CALCULATOR" && (
          <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-right">
            {/* Amount Display */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-1 text-center shadow-xs">
              <span className="text-[10px] text-slate-400 font-medium block">
                مبلغ فاکتور برای محاسبه دنگ:
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
                {parsedCalcAmount.formatted || "۰"}
                <span className="text-xs text-slate-400 mr-1.5 font-bold">تومان</span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {parsedCalcAmount.words || "صفر تومان"}
              </p>
            </div>

            {/* People Count Selector */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-600 block">
                تعداد نفرات برای تقسیم:
              </span>
              <div className="grid grid-cols-7 gap-1">
                {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPeopleCount(num)}
                    className={`h-9 rounded-xl font-black text-xs transition-all cursor-pointer ${
                      peopleCount === num
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {toPersianDigits(num)}
                  </button>
                ))}
              </div>
            </div>

            {/* Result Box */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-center space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 block">
                سهم هر نفر از دنگ:
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums">
                {formatToman(calcSharePerPerson)}
              </div>
            </div>

            {/* Quick Numeric Keypad for Calculator */}
            <div className="grid grid-cols-3 gap-1.5">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleKeypadPress(d)}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-extrabold text-sm transition-all cursor-pointer flex items-center justify-center tabular-nums"
                >
                  {toPersianDigits(d)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress("000")}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                ۰۰۰
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm"
              >
                ۰
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm flex items-center justify-center"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Share / Copy Button */}
            <button
              type="button"
              onClick={handleCopyShare}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              {copiedShare ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>متن سهم کپی شد!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>ارسال یا کپی متن سهم برای هم‌خانه‌ها</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 3: Create or Join Household Group */}
        {activeTab === "GROUP" && (
          <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1 text-right">
            <Link
              href="/app?action=create"
              onClick={onClose}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-800">
                    ساخت خانه یا جمع جدید
                  </h4>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    تعریف فضای حسابداری مشترک و دعوت هم‌خانه‌ها با کد ۶ رقمی
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </Link>

            <Link
              href="/app?action=join"
              onClick={onClose}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 group-hover:text-blue-800">
                    ورود به خانه با کد دعوت
                  </h4>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    عضویت در گروه دوستان با وارد کردن کد اشتراک خانه
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
