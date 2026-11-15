import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Wallet, ArrowLeft, Smartphone } from "lucide-react";
import MarketingFooter from "@/components/layout/MarketingFooter";

export const dynamic = "force-dynamic";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);
  const isLoggedIn = !!session;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] text-slate-900" dir="rtl">
      {/* Clean Floating Navbar */}
      <header className="sticky top-4 z-50 max-w-6xl w-full mx-auto px-4">
        <div className="h-16 px-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-sm flex items-center justify-between transition-all">
          {/* Right: Emerald logo icon + دنگ‌چی */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                دنگ‌چی
              </span>
            </Link>
            <span className="hidden sm:inline-flex text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-bold">
              v2.5
            </span>
          </div>

          {/* Center: 5 clean navigation links including featured download */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/#features"
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              امکانات
            </Link>
            <Link
              href="/pricing"
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              تعرفه‌ها
            </Link>
            <Link
              href="/download"
              className="px-3.5 py-2 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 transition-all inline-flex items-center gap-1.5 shadow-2xs group"
            >
              <Smartphone className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>دانلود اپلیکیشن</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-black leading-tight">
                جدید
              </span>
            </Link>
            <Link
              href="/faq"
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              سوالات متداول
            </Link>
            <Link
              href="/about"
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              درباره ما
            </Link>
          </nav>

          {/* Left: Auth CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/download"
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-emerald-800 bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100 transition-colors text-xs font-bold"
              title="دانلود اپلیکیشن دنگ‌چی"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>اپ</span>
            </Link>
            {isLoggedIn ? (
              <Link href="/app">
                <Button
                  variant="primary"
                  size="sm"
                  className="h-10 px-5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  rightIcon={<ArrowLeft className="w-4 h-4 mr-1" />}
                >
                  ورود به داشبورد
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-bold text-slate-700 hover:text-emerald-600 px-3 py-2 transition-colors"
                >
                  ورود
                </Link>
                <Link href="/login">
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm"
                    rightIcon={<ArrowLeft className="w-3.5 h-3.5 mr-1" />}
                  >
                    شروع رایگان
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1">{children}</main>

      {/* FULL-WIDTH ANCHORED FINTECH FOOTER */}
      <MarketingFooter isAuthenticated={isLoggedIn} />
    </div>
  );
}
