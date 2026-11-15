"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldAlert,
  ShieldCheck,
  Server,
  Lock,
  Database,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  RotateCcw,
  AlertTriangle,
  Activity,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  User,
} from "lucide-react";
import { isValidIranianPhone, normalizePhone, isValidOtp } from "@/lib/validation";
import { toPersianDigits } from "@/lib/money";

export default function AdminLoginPage() {
  const router = useRouter();

  // Mode: PASSWORD (default for system admins) or OTP
  const [loginMethod, setLoginMethod] = useState<"PASSWORD" | "OTP">("PASSWORD");

  // Password Login State
  const [adminIdentifier, setAdminIdentifier] = useState("admin");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login State
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("09120000000");
  const [code, setCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(120);

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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminIdentifier.trim()) {
      setError("لطفاً نام کاربری یا شماره موبایل مدیر را وارد نمایید.");
      return;
    }

    if (!adminPassword || adminPassword.length < 6) {
      setError("رمز عبور مدیر باید حداقل ۶ نویسه باشد.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: adminIdentifier.trim(),
          password: adminPassword,
          mode: "LOGIN",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "شناسه کاربری یا رمز عبور اشتباه است.");
        return;
      }

      if (data.role !== "ADMIN") {
        await fetch("/api/auth/logout", { method: "POST" });
        setError("دسترسی غیرمجاز: این حساب فاقد دسترسی مدیریت سیستم است.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با هسته امنیتی سیستم.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanPhone = normalizePhone(phone);
    if (!isValidIranianPhone(cleanPhone)) {
      setError("شماره موبایل نامعتبر است. فرمت صحیح: ۰۹۱۲۰۰۰۰۰۰۰");
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
        setError(data.error || "خطا در ارسال کد تأیید مدیریت.");
        return;
      }

      setStep(2);
      setCountdown(data.expiresInSeconds || 120);
    } catch {
      setError("خطای ارتباط با سرور امنیتی. لطفاً مجدداً تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  const executeVerification = async (targetCode: string) => {
    setError(null);

    const cleanPhone = normalizePhone(phone);
    const cleanCode = normalizePhone(targetCode);

    if (!isValidOtp(cleanCode)) {
      setError("کد احراز هویت باید ۵ رقم عددی باشد.");
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "کد تأیید نامعتبر است.");
        return;
      }

      // STRICT ADMIN ROLE CHECK:
      if (data.user.role !== "ADMIN") {
        await fetch("/api/auth/logout", { method: "POST" });
        setError(
          "دسترسی غیرمجاز: این شماره موبایل فاقد سطح دسترسی مدیریت (ADMIN) است."
        );
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("خطای احراز هویت با هسته امنیتی سیستم.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return toPersianDigits(
      `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    );
  };

  return (
    <div
      className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-950 text-white selection:bg-amber-500 selection:text-slate-950"
      dir="rtl"
    >
      {/* Right Side: Security Telemetry & System Status Panel */}
      <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border-b lg:border-b-0 lg:border-l border-slate-800 p-8 lg:p-12 flex flex-col justify-between">
        {/* Top Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-xl text-white tracking-tight">
                دنگ‌چی • پنل مدیریت کلان
              </h1>
              <span className="text-xs text-amber-400 font-semibold block">
                Enterprise Security & Financial Ops Portal
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300">
            <Lock className="w-3.5 h-3.5" />
            <span>RESTRICTED ACCESS • ADMIN ONLY</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pt-2">
            ورود به این بخش نیازمند مجوز سطح دسترسی مدیریت ارشد (ROLE: ADMIN) و احراز هویت ایزوله است. تمامی درخواست‌ها ثبت و رصد امنیتی می‌شوند.
          </p>
        </div>

        {/* Middle: Live System Telemetry Cards */}
        <div className="my-8 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            وضعیت زنده مولفه‌های حیاتی سرور
          </span>

          <div className="grid grid-cols-1 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>دیتابیس ایزوله ادمین (Scrypt KDF)</span>
              </div>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active & Synced
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>رمزنگاری جلسات (JWT HS256)</span>
              </div>
              <span className="text-slate-300 font-mono text-[11px]">
                HttpOnly Secure
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>پل ارتباطی هویت (Identity Bridge)</span>
              </div>
              <span className="text-cyan-400 font-bold text-[11px]">
                Shadow Sync Online
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>سپر بروت‌فورس (Brute-Force Shield)</span>
              </div>
              <span className="text-purple-300 font-bold text-[11px]">
                TimingSafe Active
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Link */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <Link
            href="/"
            className="hover:text-white flex items-center gap-1.5 transition-colors font-medium"
          >
            <span>بازگشت به وبسایت عمومی</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <span className="text-[11px] text-slate-500 font-mono">DongChi Core v2.4</span>
        </div>
      </div>

      {/* Left Side: Dark-Themed Authentication Form */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12 bg-slate-950">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6">
          <div className="space-y-1.5 text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Badge
                variant="warning"
                size="sm"
                className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]"
              >
                ورود امن مدیران سامانه
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {loginMethod === "PASSWORD"
                ? "ورود با شناسه و رمز عبور"
                : step === 1
                ? "شناسایی مدیر با پیامک"
                : "تأیید کد پیامکی مدیر"}
            </h2>
            <p className="text-xs text-slate-400">
              {loginMethod === "PASSWORD"
                ? "نام کاربری و رمز عبور حساب مدیریت خود را وارد فرمایید."
                : step === 1
                ? "شماره موبایل ثبت‌شده مدیر سامانه را وارد نمایید."
                : `کد پیامک‌شده به شماره ${toPersianDigits(phone)} را وارد کنید.`}
            </p>

            {/* Method Toggle Buttons */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("PASSWORD");
                  setError(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === "PASSWORD"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>رمز عبور مدیریت</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMethod("OTP");
                  setError(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === "OTP"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>کد تأیید پیامکی</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* METHOD 1: PASSWORD LOGIN */}
          {loginMethod === "PASSWORD" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  نام کاربری یا شماره موبایل مدیر
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    placeholder="admin یا 09120000000"
                    required
                    autoFocus
                    className="w-full h-12 bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 pr-10 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-4 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رمز عبور حساب مدیریت
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="حداقل ۶ نویسه"
                    required
                    className="w-full h-12 bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 pr-10 pl-10 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-4 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>اکانت پیش‌فرض:</span>
                <span className="font-mono text-amber-400 font-bold">admin / admin123456</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm h-12 rounded-xl shadow-lg shadow-amber-500/20"
                isLoading={isLoading}
              >
                ورود به اتاق فرمان مدیریت
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  کاربر عادی هستید؟ ورود به پنل کاربری ←
                </Link>
              </div>
            </form>
          ) : (
            /* METHOD 2: OTP LOGIN */
            step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    شماره موبایل مدیر ارشد
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      dir="ltr"
                      maxLength={11}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09120000000"
                      required
                      autoFocus
                      className="w-full h-12 bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                    <Smartphone className="w-4 h-4 text-slate-500 absolute right-3.5 top-4 pointer-events-none" />
                  </div>
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>شماره مدیر پیش‌فرض تستی:</span>
                    <button
                      type="button"
                      onClick={() => setPhone("09120000000")}
                      className="font-mono text-amber-400 font-bold hover:underline"
                    >
                      09120000000
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm h-12 rounded-xl shadow-lg shadow-amber-500/20"
                  isLoading={isLoading}
                >
                  ارسال کد تأیید امنیتی
                </Button>

                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    کاربر عادی هستید؟ ورود به پنل کاربری ←
                  </Link>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeVerification(code);
                }}
                className="space-y-5"
              >
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300 text-center">
                    کد تأیید ۵ رقمی مدیر
                  </label>
                  <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                    <OtpInput
                      length={5}
                      value={code}
                      onChange={setCode}
                      onComplete={(c) => executeVerification(c)}
                      disabled={isLoading}
                      error={!!error}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm h-12 rounded-xl shadow-lg shadow-amber-500/20"
                  isLoading={isLoading}
                >
                  تأیید هویت و ورود به پنل ادمین
                </Button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setCode("");
                      setError(null);
                    }}
                    className="text-slate-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    ویرایش شماره
                  </button>

                  {countdown > 0 ? (
                    <span className="text-slate-500 tabular-nums font-mono">
                      ارسال مجدد ({formatTimer(countdown)})
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={isLoading}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      ارسال دوباره
                    </button>
                  )}
                </div>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}
