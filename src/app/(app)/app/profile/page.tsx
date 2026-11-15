"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { LogoutButton } from "@/components/LogoutButton";
import { toPersianDigits, normalizeDigits } from "@/lib/money";
import {
  detectIranBank,
  validateIranBankCard,
  formatBankCard,
} from "@/lib/iran-banks";
import {
  User,
  Smartphone,
  CreditCard,
  ShieldCheck,
  Save,
  CheckCircle2,
  Crown,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Lock,
  Sparkles,
  LogOut,
  KeyRound,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCardCopied, setIsCardCopied] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("رمز عبور جدید باید حداقل ۶ نویسه باشد.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("تکرار رمز عبور جدید با رمز وارد شده همخوانی ندارد.");
      return;
    }

    if (profile?.hasPassword && !currentPassword) {
      setPasswordError("لطفاً رمز عبور فعلی خود را وارد نمایید.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در تنظیم رمز عبور.");
      }

      setProfile(data.user);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(
        profile?.hasPassword
          ? "رمز عبور با موفقیت تغییر یافت."
          : "رمز عبور حساب کاربری با موفقیت ثبت شد."
      );
    } catch (err: any) {
      setPasswordError(err.message);
      toast.error(err.message || "خطا در تنظیم رمز عبور.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (res.ok && data.user) {
          setProfile(data.user);
          setName(data.user.name || "");
          const rawCard = data.user.cardNumber || "";
          setCardNumber(formatBankCard(rawCard));
        }
      } catch (err) {
        console.error("fetch profile error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Card computation
  const cleanCardDigits = normalizeDigits(cardNumber).replace(/\D/g, "").slice(0, 16);
  const detectedBank = detectIranBank(cleanCardDigits);
  const isCardValid = validateIranBankCard(cleanCardDigits);
  const formattedCardNumber = formatBankCard(cleanCardDigits);

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = normalizeDigits(raw).replace(/\D/g, "").slice(0, 16);
    setCardNumber(formatBankCard(digitsOnly));
  };

  const handleCopyCard = async () => {
    if (!cleanCardDigits) return;
    try {
      await navigator.clipboard.writeText(cleanCardDigits);
      setIsCardCopied(true);
      toast.success("شماره کارت ۱۶ رقمی کپی شد.");
      setTimeout(() => setIsCardCopied(false), 2000);
    } catch {
      toast.error("خطا در کپی شماره کارت.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cleanCardDigits.length > 0 && cleanCardDigits.length !== 16) {
      setErrorMessage("شماره کارت بانکی باید دقیقاً ۱۶ رقم باشد.");
      return;
    }

    if (cleanCardDigits.length === 16 && !isCardValid) {
      setErrorMessage("شماره کارت وارد شده با الگوریتم اعتبارسنجی شتاب همخوانی ندارد.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          cardNumber: cleanCardDigits || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ذخیره اطلاعات.");
      }

      setProfile(data.user);
      toast.success("اطلاعات پروفایل با موفقیت به‌روزرسانی شد.");
    } catch (err: any) {
      setErrorMessage(err.message);
      toast.error(err.message || "خطا در ذخیره اطلاعات پروفایل.");
    } finally {
      setIsSaving(false);
    }
  };

  // Determine dynamic gradient for bank card
  let cardGradient = "from-emerald-700 via-teal-800 to-slate-900";
  if (detectedBank?.includes("ملی")) {
    cardGradient = "from-amber-600 via-yellow-700 to-stone-900";
  } else if (detectedBank?.includes("ملت")) {
    cardGradient = "from-rose-600 via-red-700 to-slate-900";
  } else if (detectedBank?.includes("سامان")) {
    cardGradient = "from-sky-600 via-blue-700 to-indigo-950";
  } else if (detectedBank?.includes("پاسارگاد")) {
    cardGradient = "from-amber-500 via-stone-800 to-slate-950";
  } else if (detectedBank?.includes("تجارت") || detectedBank?.includes("سپه")) {
    cardGradient = "from-blue-700 via-indigo-800 to-slate-900";
  } else if (detectedBank?.includes("رسالت")) {
    cardGradient = "from-teal-600 via-cyan-800 to-slate-900";
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <CardSkeleton />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 12-Column Balanced Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Right Column: اطلاعات هویتی و فرم ویرایش حساب (lg:col-span-7) */}
        <div className="lg:col-span-7 h-full flex flex-col justify-between">
          <Card className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs h-full flex flex-col justify-between">
            {/* Card Header */}
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-xl flex items-center justify-center shadow-sm shrink-0">
                  {name ? name.charAt(0) : "ک"}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {name || "کاربر دنگ‌چی"}
                  </h2>
                  <p className="text-xs font-medium text-slate-500 tabular-nums mt-0.5">
                    {profile?.phone && toPersianDigits(profile.phone)}
                  </p>
                </div>
              </div>

              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                عضو رسمی دنگ‌چی
              </span>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between space-y-5">
              <div className="space-y-5">
                {/* Field 1: نام و نام خانوادگی */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    نام و نام خانوادگی
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: علی احمدی"
                      className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                      required
                    />
                    <div className="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    این نام در تراز دنگ‌ها، گزارش‌ها و فاکتورهای مشترک به همخانه‌ها نمایش داده می‌شود.
                  </p>
                </div>

                {/* Field 2: شماره موبایل (Read-only) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    شماره موبایل (شناسه یکتای حساب)
                  </label>
                  <div className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl px-4 flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <span className="font-mono text-xs tabular-nums tracking-wide font-bold" dir="ltr">
                        {profile?.phone ? toPersianDigits(profile.phone) : "۰۹-----------"}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>تأییدشده با پیامک</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    شماره همراه به عنوان شناسه امنیتی یکتا ثبت شده و قابل ویرایش نیست.
                  </p>
                </div>

                {/* Field 3: شماره کارت بانکی ۱۶ رقمی */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      شماره کارت بانکی ۱۶ رقمی (جهت تسویه‌حساب)
                    </label>
                    {detectedBank && (
                      <span className="text-[11px] font-bold text-emerald-700">
                        {detectedBank}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      dir="ltr"
                      value={cardNumber}
                      onChange={handleCardInputChange}
                      placeholder="6037 - 9971 - 0000 - 0000"
                      maxLength={25}
                      className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-4 pr-11 text-left font-mono tracking-wider text-sm sm:text-base text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold tabular-nums"
                    />
                    <div className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none">
                      <CreditCard className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Live validation feedback */}
                  {cleanCardDigits.length === 16 ? (
                    isCardValid ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          ✓ {detectedBank ? `کارت ${detectedBank}` : "کارت شتاب"} — شماره کارت معتبر است
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>شماره کارت نامعتبر است (کنترل رقم الگوریتم ساتنا/شتاب همخوانی ندارد)</span>
                      </div>
                    )
                  ) : cleanCardDigits.length >= 6 && detectedBank ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                      <span>بانک صادرکننده: <strong>{detectedBank}</strong> (در حال تکمیل ۱۶ رقم...)</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      همخانه‌ها می‌توانند برای تسویه بدهی‌های خود مستقیماً این شماره کارت را کپی کنند.
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Footer */}
              <div className="pt-5 mt-auto border-t border-slate-100 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-400">
                  تغییرات نام و شماره کارت بلافاصله در تمام گروه‌ها اعمال می‌شود.
                </p>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm inline-flex flex-row flex-nowrap items-center justify-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
                  leftIcon={<Save className="w-4 h-4 ml-1.5" />}
                >
                  ذخیره تغییرات پروفایل
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Left Column: پیش‌نمایش زنده کارت بانکی و وضعیت اشتراک (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          {/* Card A: پیش‌نمایش کارت بانکی شما در گروه‌ها (Live Shetab Bank Card) */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="font-extrabold text-slate-900">
                پیش‌نمایش کارت تسویه شما
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                قابل مشاهده برای همخانه‌ها
              </span>
            </div>

            {/* Realistic Bank Card Visual */}
            <div
              className={`aspect-[1.65/1] w-full rounded-2xl p-5 text-white shadow-lg relative overflow-hidden flex flex-col justify-between transition-all duration-300 bg-gradient-to-tr ${cardGradient}`}
            >
              {/* Background ambient lighting effects */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-black/20 rounded-full blur-2xl pointer-events-none" />

              {/* Top Row: Bank Name + Golden EMV Chip & Contactless */}
              <div className="flex items-center justify-between relative z-10">
                <span className="font-bold text-sm text-white/95 tracking-tight">
                  {detectedBank || "کارت بانکی عضو شتاب"}
                </span>

                <div className="flex items-center gap-2">
                  {/* Contactless Wave SVG */}
                  <svg
                    className="w-5 h-5 text-amber-200/80 rotate-90"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                    <path d="M12 19a8.5 8.5 0 0 1 0-14" />
                    <path d="M15.5 21.5a12 12 0 0 1 0-19" />
                  </svg>

                  {/* Golden EMV Chip SVG */}
                  <svg
                    className="w-9 h-7 rounded-sm shadow-xs"
                    viewBox="0 0 40 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="40" height="28" rx="4" fill="#EAB308" />
                    <rect x="2" y="2" width="36" height="24" rx="2" fill="#FACC15" />
                    <path
                      d="M0 14H12M28 14H40M14 0V28M26 0V28M12 9H28M12 19H28"
                      stroke="#B45309"
                      strokeWidth="1.2"
                    />
                  </svg>
                </div>
              </div>

              {/* Middle Row: 16-Digit Card Number */}
              <div className="relative z-10 py-1" dir="ltr">
                <div className="font-mono text-base sm:text-xl font-extrabold tracking-[0.18em] tabular-nums text-center drop-shadow-md">
                  {formattedCardNumber || "••••  ••••  ••••  ••••"}
                </div>
              </div>

              {/* Bottom Row: Cardholder Name + 1-Click Copy Glass Button */}
              <div className="flex items-center justify-between relative z-10 pt-1">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-white/70 block -mb-0.5">
                    نام صاحب کارت:
                  </span>
                  <span className="font-bold text-xs text-white truncate block">
                    {name || "کاربر دنگ‌چی"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCard}
                  disabled={!cleanCardDigits}
                  className="bg-white/15 hover:bg-white/25 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-xs px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-1.5 border border-white/20 shadow-xs cursor-pointer"
                  title="کپی شماره کارت ۱۶ رقمی"
                >
                  {isCardCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-white/90" />
                      <span>کپی شماره</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>

          {/* Card B: وضعیت اشتراک و امنیت حساب (Harmonized, balanced height) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            {/* Top Header Row */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4"/>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">وضعیت اشتراک و امنیت حساب</h3>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">سهمیه امکانات و نشست فعال شما</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                profile?.isPro
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}>
                {profile?.isPro ? 'نسخه حرفه‌ای (Pro)' : 'پلن پایه رایگان'}
              </span>
            </div>

            {/* 2 Equal Quota Tiles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <span className="text-[11px] font-semibold text-slate-400 block">سقف گروه‌های فعال</span>
                <span className="text-xs font-extrabold text-slate-800 mt-1 block">
                  {profile?.isPro ? 'نامحدود گروه' : 'حداکثر ۲ گروه'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <span className="text-[11px] font-semibold text-slate-400 block">صندوق مشترک خانه</span>
                <span className="text-xs font-extrabold text-slate-800 mt-1 block">
                  {profile?.isPro ? 'نامحدود کارت' : '۱ کارت در هر گروه'}
                </span>
              </div>
            </div>

            {/* Security Status Strip */}
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0"/>
                <span>نشست امن با رمزنگاری HttpOnly فعال است</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Balanced Action Buttons Row */}
            <div className="pt-2 grid grid-cols-12 gap-2.5 items-center">
              <Link
                className="col-span-7 h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex flex-row flex-nowrap items-center justify-center gap-2 whitespace-nowrap shadow-xs transition-all active:scale-[0.99]"
                href="/app/billing"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="leading-none">{profile?.isPro ? "مدیریت اشتراک ویژه" : "ارتقا به نسخه حرفه‌ای"}</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="col-span-5 h-11 px-3.5 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200/90 hover:border-red-200 text-xs font-bold inline-flex flex-row flex-nowrap items-center justify-center gap-2 whitespace-nowrap transition-all active:scale-[0.99] cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="leading-none">خروج از حساب</span>
              </button>
            </div>
          </div>

          {/* Card C: تنظیم و تغییر رمز عبور حساب کاربری */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {profile?.hasPassword ? "تغییر رمز عبور ورود" : "تنظیم رمز عبور ورود"}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    امکان ورود مستقیم با رمز عبور بدون نیاز به دریافت پیامک OTP
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                  profile?.hasPassword
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {profile?.hasPassword ? "رمز فعال است" : "فاقد رمز عبور"}
              </span>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-3">
              {profile?.hasPassword && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    رمز عبور فعلی
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  {profile?.hasPassword ? "رمز عبور جدید" : "تعیین رمز عبور جدید"}
                </label>
                <input
                  type="password"
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="حداقل ۶ نویسه"
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  تکرار رمز عبور جدید
                </label>
                <input
                  type="password"
                  dir="ltr"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تکرار رمز عبور"
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isUpdatingPassword}
                  className="w-full h-10 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {profile?.hasPassword ? "به‌روزرسانی رمز عبور" : "ثبت و فعال‌سازی رمز عبور"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
