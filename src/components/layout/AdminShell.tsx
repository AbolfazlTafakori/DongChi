'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Crown,
  Users,
  FolderTree,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
  Bell,
  Sliders,
  LogOut,
  Search,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { toPersianDigits } from '@/lib/money';

interface AdminShellProps {
  children: React.ReactNode;
  user?: {
    id?: string;
    name?: string;
    phone?: string;
    role?: string;
  };
  adminName?: string;
  adminPhone?: string;
}

const adminNavSections = [
  {
    title: 'نظارت و آمار کلان',
    items: [
      { href: '/admin', label: 'پیشخوان کلان', icon: LayoutDashboard, exact: true },
      { href: '/admin/billing', label: 'گزارش مالی و پلن‌ها', icon: Crown },
    ],
  },
  {
    title: 'مدیریت عملیات',
    items: [
      { href: '/admin/users', label: 'مدیریت کاربران', icon: Users },
      { href: '/admin/groups', label: 'مدیریت گروه‌ها و خانه‌ها', icon: FolderTree },
      { href: '/admin/categories', label: 'دسته‌بندی‌های پایه', icon: Sliders },
      { href: '/admin/faqs', label: 'سوالات متداول (FAQ)', icon: HelpCircle },
      { href: '/admin/messages', label: 'پیام‌ها و پیشنهادات', icon: MessageSquare },
    ],
  },
  {
    title: 'امنیت، درگاه و پیکربندی',
    items: [
      { href: '/admin/admins', label: 'مدیران و سطوح دسترسی', icon: ShieldCheck },
      { href: '/admin/notifications', label: 'ارسال نوتیفیکیشن همگانی', icon: Bell },
      { href: '/admin/settings', label: 'تنظیمات درگاه، پیامک و سایت', icon: Sliders },
      { href: '/admin/logs', label: 'لاگ امنیتی و ممیزی اسناد', icon: ShieldAlert },
    ],
  },
];

export function AdminShell({
  children,
  user,
  adminName: propAdminName,
  adminPhone: propAdminPhone,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const adminName = user?.name || propAdminName || 'مدیر سیستم';
  const adminPhone = user?.phone || propAdminPhone || '09120000000';

  const todayPersian = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const adminInitial = adminName.trim().charAt(0) || 'م';

  // Find active navigation item for breadcrumb
  const allNavItems = adminNavSections.flatMap((s) => s.items);
  const currentItem =
    allNavItems.find((item) =>
      item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
    ) || { label: 'پیشخوان کلان', href: '/admin' };

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/admin/login');
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/admin/users?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-row select-none" dir="rtl">
      {/* 1. FIXED DESKTOP RIGHT SIDEBAR */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:right-0 bg-slate-950 text-slate-200 border-l border-slate-800/80 z-40">
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-xs">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-white tracking-tight block">
                اتاق فرمان ادمین
              </span>
              <span className="text-[10px] font-medium text-amber-400 block">
                سطح دسترسی کلان (ADMIN)
              </span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {adminNavSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              <h3 className="px-3 text-[11px] font-bold text-slate-400 tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-2xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 font-extrabold'
                            : 'bg-slate-900 text-slate-400 group-hover:bg-slate-800 group-hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Switch to User App Button */}
        <div className="px-3 py-3 border-t border-slate-800/80 shrink-0">
          <Link
            className="w-full h-10 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border border-white/10 text-xs font-extrabold inline-flex items-center justify-between transition-all group"
            href="/app"
          >
            <span>ورود به محیط کاربری (/app)</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
          </Link>
        </div>

        {/* Bottom Admin User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 shrink-0">
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shrink-0">
                {adminInitial}
              </div>
              <div className="min-w-0 flex-1 text-right">
                <p className="text-xs font-extrabold text-white truncate leading-tight">
                  {adminName}
                </p>
                <p className="text-[11px] font-medium text-slate-400 tabular-nums truncate mt-0.5 leading-tight">
                  {toPersianDigits(adminPhone)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="خروج از حساب مدیریت"
              aria-label="خروج از حساب مدیریت"
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-800 flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT COLUMN (PUSHED 256px RIGHT OF FIXED SIDEBAR) */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-64">
        {/* Pristine Clean Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-2xs">
          {/* Right: Breadcrumb / Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
              aria-label="منوی ناوبری مدیریت"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span>اتاق فرمان ادمین</span>
                <span>/</span>
                <span className="text-slate-700 font-bold">{currentItem.label}</span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {currentItem.label}
              </h1>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden md:flex items-center max-w-sm w-full">
            <div className="relative w-full">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="جستجوی سریع کاربر، شماره موبایل یا کد گروه..."
                className="w-full h-10 pr-10 pl-4 rounded-xl bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-amber-500 focus:outline-none text-xs font-medium text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Left: Date Badge + Quick Settings Link + Admin Chip */}
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600 tabular-nums">
              {todayPersian}
            </span>

            <Link
              className="h-9 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              href="/admin/settings"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">تنظیمات سیستم</span>
              <span className="sm:hidden">تنظیمات</span>
            </Link>

            <div className="hidden md:flex items-center gap-2 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-[11px]">
                {adminInitial}
              </div>
              <span className="text-xs font-bold text-slate-800">{adminName}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-slate-950 text-white flex flex-col justify-between p-4 z-10 shadow-2xl border-l border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="font-extrabold text-sm">منوی مدیریت ادمین</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
                {adminNavSections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 px-2 block">
                      {section.title}
                    </span>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.exact
                        ? pathname === item.href
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-amber-400" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <Link
                href="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-amber-400 font-bold hover:underline"
              >
                ورود به /app ←
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold border border-red-800/80 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminShell;
