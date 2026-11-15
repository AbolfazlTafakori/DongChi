"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OtpInput } from "@/components/ui/OtpInput";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Smartphone,
  KeyRound,
  User,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Wallet,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
} from "lucide-react";
import { isValidIranianPhone, normalizePhone, isValidOtp } from "@/lib/validation";
import { toPersianDigits } from "@/lib/money";

export default function LoginPage() {
  const router = useRouter();

  // Auth Method: OTP vs PASSWORD
  const [authMethod, setAuthMethod] = useState<"OTP" | "PASSWORD">("OTP");

  // OTP State: Step 1: enter phone | Step 2: enter code & name
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(120);

  // Password State
  const [passwordMode, setPasswordMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [passIdentifier, setPassIdentifier] = useState("");
  const [passPassword, setPassPassword] = useState("");
  const [passName, setPassName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanPhone = normalizePhone(phone);
    if (!isValidIranianPhone(cleanPhone)) {
      setError("شماره موبایل نامعتبر است. شماره ۱۱ رقمی را با ۰۹ وارد کنید.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در ارسال کد تأیید.");
        return;
      }

      setStep(2);
      setCountdown(data.expiresInSeconds || 120);
    } catch {
      setError("خطای ارتباط با سرور. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  const executeVerification = async (targetCode: string) => {
    setError(null);

    const cleanPhone = normalizePhone(phone);
    const cleanCode = normalizePhone(targetCode);

    if (!isValidOtp(cleanCode)) {
      setError("کد تأیید باید ۵ رقم باشد.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          code: cleanCode,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "کد تأیید نامعتبر است.");
        return;
      }

      // Consumer login ALWAYS redirects to /app workspace (never /admin)
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from");
      const target = from && from.startsWith("/app") ? from : "/app";
      router.push(target);
      router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با سرور.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeVerification(code);
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passPassword || passPassword.length < 6) {
      setError("رمز عبور باید حداقل ۶ نویسه باشد.");
      return;
    }

    if (!passIdentifier.trim()) {
      setError("لطفاً شماره موبایل یا نام کاربری را وارد کنید.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: passwordMode,
          identifier: passIdentifier.trim(),
          phone: passIdentifier.trim(),
          password: passPassword,
          name: passName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در احراز هویت با رمز عبور.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const from = params.get("from");
      const target = from && from.startsWith("/app") ? from : data.redirectUrl || "/app";
      router.push(target);
      router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با سرور.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formatted = `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
    return toPersianDigits(formatted);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4" dir="rtl">
      {/* Brand logo & header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="text-right">
            <span className="font-extrabold text-2xl text-slate-900 tracking-tight block">
              دنگ‌چی
            </span>
            <span className="text-xs text-emerald-600 font-medium block">
              حسابداری هوشمند و دانگ خانه
            </span>
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <Badge variant="pro" size="sm" dot>
                احراز هویت دوگانه امن
              </Badge>
            </div>
            <CardTitle className="text-xl">
              {authMethod === "OTP"
                ? step === 1
                  ? "ورود یا عضویت سریع"
                  : "تأیید شماره موبایل"
                : passwordMode === "LOGIN"
                ? "ورود با رمز عبور"
                : "ثبت‌نام حساب کاربری جدید"}
            </CardTitle>
            <CardDescription>
              {authMethod === "OTP"
                ? step === 1
                  ? "برای ورود به حساب کاربری یا ثبت‌نام، شماره موبایل خود را وارد کنید."
                  : `کد پیامک‌شده به شماره ${toPersianDigits(phone)} را وارد کنید.`
                : passwordMode === "LOGIN"
                ? "شماره موبایل یا شناسه کاربری و رمز عبور خود را وارد نمایید."
                : "اطلاعات خود را جهت ایجاد حساب کاربری وارد نمایید."}
            </CardDescription>

            {/* Segmented Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mt-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod("OTP");
                  setError(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMethod === "OTP"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>کد پیامکی (OTP)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod("PASSWORD");
                  setError(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMethod === "PASSWORD"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>ورود با رمز عبور</span>
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 1: OTP FLOW (PRESERVED 100%)           */}
            {/* ========================================== */}
            {authMethod === "OTP" ? (
              step === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <Input
                    label="شماره موبایل"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    numericOnly
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    rightIcon={<Smartphone className="w-4 h-4" />}
                    helperText="کد تأیید یک‌بارمصرف ۵ رقمی به این شماره ارسال خواهد شد."
                    autoFocus
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={isLoading}
                  >
                    ارسال کد تأیید
                  </Button>

                  <div className="pt-2 text-center">
                    <p className="text-[11px] text-slate-400">
                      شماره تستی ادمین: <code className="font-mono text-slate-700">09120000000</code> | کاربر: <code className="font-mono text-slate-700">09121111111</code>
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2 py-2">
                    <label className="block text-xs font-semibold text-slate-700 text-center">
                      کد تأیید ۵ رقمی پیامک‌شده
                    </label>
                    <OtpInput
                      length={5}
                      value={code}
                      onChange={setCode}
                      onComplete={(completedCode) => executeVerification(completedCode)}
                      disabled={isLoading}
                      error={error ? true : false}
                    />
                  </div>

                  <Input
                    label="نام و نام خانوادگی (اختیاری)"
                    placeholder="مثال: علی رضایی"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    rightIcon={<User className="w-4 h-4" />}
                    helperText="در صورت ثبت‌نام جدید، نام شما در گروه‌ها نمایش داده خواهد شد."
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={isLoading}
                  >
                    تأیید و ورود به برنامه
                  </Button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setCode("");
                        setError(null);
                      }}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      ویرایش شماره
                    </button>

                    {countdown > 0 ? (
                      <span className="text-slate-400 tabular-nums">
                        ارسال مجدد ({formatTimer(countdown)})
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={isLoading}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        ارسال دوباره کد
                      </button>
                    )}
                  </div>
                </form>
              )
            ) : (
              /* ========================================== */
              /* TAB 2: PASSWORD FLOW                       */
              /* ========================================== */
              <form onSubmit={handlePasswordAuth} className="space-y-4">
                {/* Sub-toggle for Login vs Register */}
                <div className="flex items-center justify-center gap-4 pb-2 border-b border-slate-100 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode("LOGIN");
                      setError(null);
                    }}
                    className={`pb-1 transition-all ${
                      passwordMode === "LOGIN"
                        ? "text-emerald-600 border-b-2 border-emerald-600"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    ورود به حساب موجود
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode("REGISTER");
                      setError(null);
                    }}
                    className={`pb-1 transition-all ${
                      passwordMode === "REGISTER"
                        ? "text-emerald-600 border-b-2 border-emerald-600"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    ثبت‌نام جدید با رمز
                  </button>
                </div>

                {passwordMode === "REGISTER" && (
                  <Input
                    label="نام و نام خانوادگی"
                    placeholder="مثال: علی رضایی"
                    value={passName}
                    onChange={(e) => setPassName(e.target.value)}
                    rightIcon={<User className="w-4 h-4" />}
                    required
                  />
                )}

                <Input
                  label={passwordMode === "LOGIN" ? "شماره موبایل یا شناسه کاربری" : "شماره موبایل"}
                  placeholder={passwordMode === "LOGIN" ? "۰۹۱۲۳۴۵۶۷۸۹ یا نام کاربری" : "۰۹۱۲۳۴۵۶۷۸۹"}
                  dir={passwordMode === "LOGIN" ? "ltr" : "ltr"}
                  value={passIdentifier}
                  onChange={(e) => setPassIdentifier(e.target.value)}
                  rightIcon={<Smartphone className="w-4 h-4" />}
                  required
                  autoFocus
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    رمز عبور
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      value={passPassword}
                      onChange={(e) => setPassPassword(e.target.value)}
                      placeholder="حداقل ۶ نویسه"
                      required
                      className="w-full h-10 px-3.5 pr-10 pl-10 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <div className="absolute right-3.5 top-3 text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                >
                  {passwordMode === "LOGIN" ? "ورود به سامانه" : "ثبت‌نام و ورود"}
                </Button>

                <div className="pt-2 text-center">
                  <p className="text-[11px] text-slate-400">
                    مدیر سیستم؟ می‌توانید با نام کاربری و رمز عبور مستقیم از اینجا یا از{" "}
                    <Link href="/admin/login" className="text-amber-600 font-bold hover:underline">
                      صفحه مدیریت
                    </Link>{" "}
                    وارد شوید.
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Security badge note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>امنیت نشست‌ها با توکن رمزنگاری‌شده و کوکی HttpOnly</span>
        </div>
      </div>
    </div>
  );
}
