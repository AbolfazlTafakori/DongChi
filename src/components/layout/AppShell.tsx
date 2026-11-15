"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Wallet,
  Users,
  User,
  Crown,
  Plus,
  Calendar,
  LogOut,
  Headphones,
  ChevronLeft,
  Bell,
  Smartphone,
  LayoutDashboard,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toPersianDigits } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useMobileSync } from "@/hooks/useMobileSync";
import { MobileQuickActionSheet } from "@/components/mobile/MobileQuickActionSheet";
import InAppUpdaterModal from "@/components/mobile/InAppUpdaterModal";

interface AppShellProps {
  user: {
    id: string;
    name: string;
    phone: string;
    role: string;
    isPro?: boolean;
  };
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [todayPersian, setTodayPersian] = useState<string>("");
  const [groups, setGroups] = useState<Array<{ id: string; title: string }>>([]);
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  // Live Mobile & Web Synchronization Hook
  const { syncStatus, lastSyncedAt, pendingQueueCount, triggerSync } = useMobileSync();

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
    try {
      const formatted = new Intl.DateTimeFormat("fa-IR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date());
      setTodayPersian(formatted);
    } catch {
      setTodayPersian("");
    }
  }, []);

  const fetchGroups = () => {
    fetch("/api/groups")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.groups) {
          setGroups(data.groups.map((g: any) => ({ id: g.id, title: g.title })));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchGroups();
  }, [pathname]);

  // Listen to cross-tab or mobile sync events to refresh groups
  useEffect(() => {
    const handleDataSynced = () => {
      fetchGroups();
      fetchUserNotifications();
    };
    window.addEventListener("dongchi:data-synced", handleDataSynced);
    return () => {
      window.removeEventListener("dongchi:data-synced", handleDataSynced);
    };
  }, []);

  // Notifications State & Fetch
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchUserNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchUserNotifications();
  }, [pathname]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifId: "ALL" }),
      });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readByUserIds: [...(n.readByUserIds || []), user.id] }))
      );
    } catch {}
  };

  const handleMarkOneRead = async (notifId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifId }),
      });
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notifId ? { ...n, readByUserIds: [...(n.readByUserIds || []), user.id] } : n
        )
      );
    } catch {}
  };

  const isHomeTab = pathname === "/app";
  const isBillingTab = pathname === "/app/billing";
  const isProfileTab = pathname === "/app/profile";
  const isSupportTab = pathname.startsWith("/app/support");
  const isGroupDetailPage = pathname.startsWith("/app/groups/");

  const desktopNavItems = [
    {
      href: "/app",
      label: "پیشخوان مالی",
      icon: Wallet,
      isActive: isHomeTab || isGroupDetailPage,
    },
    {
      href: "/app/billing",
      label: "اشتراک ویژه و صورتحساب",
      icon: Crown,
      isActive: isBillingTab,
      badge: "Pro",
    },
    {
      href: "/app/profile",
      label: "پروفایل و شماره کارت",
      icon: User,
      isActive: isProfileTab,
    },
    {
      href: "/app/support",
      label: "پشتیبانی و راهنما",
      icon: Headphones,
      isActive: isSupportTab,
    },
  ];

  // Resolve section name for top orientation bar
  let currentSection = "پیشخوان مالی";
  let sectionSubtitle = "مدیریت حساب‌ها و تراز دنگ‌های خانه";
  if (isBillingTab) {
    currentSection = "اشتراک ویژه و صورتحساب";
    sectionSubtitle = "مشاهده وضعیت پلن و دسترسی به امکانات ویژه";
  }
  if (isProfileTab) {
    currentSection = "پروفایل و شماره کارت";
    sectionSubtitle = "اطلاعات حساب کاربری و کارت بانکی پیش‌فرض";
  }
  if (isSupportTab) {
    currentSection = "پشتیبانی و مرکز راهنما";
    sectionSubtitle = "ارسال مستقیم تیکت به تیم فنی، پیگیری درخواست‌ها و راهنمای استفاده";
  }
  if (isGroupDetailPage) {
    currentSection = "فضای گروه خانه";
    sectionSubtitle = "مشاهده و مدیریت فاکتورها و صندوق مشترک";
  }

  const userInitial = user.name ? user.name.charAt(0) : "ک";
  const userName = user.name || "کاربر دنگ‌چی";
  const userPhone = user.phone || "";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex" dir="rtl">
      {/* 1. Desktop Fixed Right Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col fixed inset-y-0 right-0 h-screen overflow-hidden justify-between bg-white border-l border-slate-200/90 z-30 select-none">
        {/* Scrollable Upper Section */}
        <div className="space-y-4 p-4 overflow-y-auto flex-1">
          {/* Brand Header */}
          <div className="h-12 px-2 flex items-center justify-between">
            <Link href="/app" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 tracking-tight block">
                  دنگ‌چی
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block -mt-1">
                  حسابدار هوشمند خانه
                </span>
              </div>
            </Link>

            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full font-bold">
              v2.5
            </span>
          </div>

          {/* Primary Action Button: + ثبت خرج جدید */}
          <button
            type="button"
            onClick={() => setQuickActionOpen(true)}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ ثبت خرج جدید</span>
          </button>

          {/* Clean Consumer Navigation List */}
          <nav className="space-y-1 pt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-1.5">
              ناوبری اصلی
            </span>

            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                    item.isActive
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4", item.isActive ? "text-emerald-600" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300/80">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Groups Switcher */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                خانه‌های من
              </span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full tabular-nums">
                {toPersianDigits(groups.length)}
              </span>
            </div>

            {groups.length > 0 ? (
              <div className="space-y-1">
                {groups.slice(0, 4).map((g) => {
                  const isCurrent = pathname === `/app/groups/${g.id}`;
                  return (
                    <Link
                      key={g.id}
                      href={`/app/groups/${g.id}`}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors",
                        isCurrent
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <span className="truncate">{g.title}</span>
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-right space-y-1">
                <span className="text-xs text-slate-500 font-semibold block">هنوز گروهی نساخته‌اید</span>
                <Link
                  href="/app?action=create"
                  className="text-[11px] font-extrabold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                >
                  <span>ساخت اولین گروه ←</span>
                </Link>
              </div>
            )}
          </div>

          {/* Subtle Mobile App Showcase Link */}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/download"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/80 border border-transparent hover:border-emerald-200/60 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span>دانلود اپلیکیشن موبایل</span>
              </div>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                APK
              </span>
            </Link>
          </div>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-slate-200/90 bg-slate-50/80 space-y-2">
          {/* In-App Update Trigger Button */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('dongchi:check-update'))}
            className="w-full py-1.5 px-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200/80 text-[11px] font-bold text-slate-600 hover:text-emerald-700 flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
            title="بررسی آنلاین نسخه جدید اپلیکیشن"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>بروزرسانی برنامه</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              چک نسخه
            </span>
          </button>

          {/* Live Sync Status indicator in desktop sidebar */}
          <div className="flex items-center justify-between px-2 text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  syncStatus === "SYNCED" && "bg-emerald-500",
                  syncStatus === "SYNCING" && "bg-amber-500 animate-ping",
                  syncStatus === "OFFLINE" && "bg-slate-400",
                  syncStatus === "ERROR" && "bg-rose-500"
                )}
              />
              <span>
                {syncStatus === "SYNCED" && "همگام با سرور"}
                {syncStatus === "SYNCING" && "در حال همگام‌سازی..."}
                {syncStatus === "OFFLINE" && "آفلاین"}
                {syncStatus === "ERROR" && "خطای اتصال"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => triggerSync(true)}
              title="همگام‌سازی دستی"
              className="text-slate-400 hover:text-emerald-600 cursor-pointer"
            >
              <RefreshCw className={cn("w-3 h-3", syncStatus === "SYNCING" && "animate-spin")} />
            </button>
          </div>

          <div className="p-2 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1 text-right">
                <p className="text-xs font-extrabold text-slate-900 truncate leading-tight">
                  {userName}
                </p>
                <p className="text-[11px] font-medium text-slate-400 tabular-nums truncate mt-0.5 leading-tight">
                  {toPersianDigits(userPhone)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="خروج از حساب کاربری"
              aria-label="خروج از حساب کاربری"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200 flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Column */}
      <div className="flex-1 lg:mr-64 flex flex-col min-w-0">
        {/* Desktop Top Header (hidden on mobile) */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-6 sm:px-8 items-center justify-between shadow-2xs">
          {/* Right Side: Breadcrumb & Title */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span>فضای کاربری دنگ‌چی</span>
                <span>/</span>
                <span className="text-slate-700 font-bold">{currentSection}</span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                {currentSection}
              </h1>
            </div>
          </div>

          {/* Left Side: Sync Status + Date + Pro Badge + User Chip + Notifications */}
          <div className="flex items-center gap-2.5">
            {/* Live Sync Status Pill */}
            <button
              type="button"
              onClick={() => triggerSync(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-xs font-medium text-slate-600 transition-colors cursor-pointer"
              title="کلیک برای همگام‌سازی دستی با سرور"
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  syncStatus === "SYNCED" && "bg-emerald-500",
                  syncStatus === "SYNCING" && "bg-amber-500 animate-ping",
                  syncStatus === "OFFLINE" && "bg-slate-400",
                  syncStatus === "ERROR" && "bg-rose-500"
                )}
              />
              <span className="text-[11px] font-bold">
                {syncStatus === "SYNCED" && "همگام با سایت"}
                {syncStatus === "SYNCING" && "در حال همگام‌سازی..."}
                {syncStatus === "OFFLINE" && "حالت آفلاین"}
                {syncStatus === "ERROR" && "تلاش مجدد اتصال"}
              </span>
            </button>

            {todayPersian && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600 tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{todayPersian}</span>
              </span>
            )}

            {user.isPro ? (
              <Link
                href="/app/billing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/20 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-2xs"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>اشتراک ویژه فعال</span>
              </Link>
            ) : (
              <Link
                href="/app/billing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/80 hover:border-emerald-300 text-xs font-bold transition-colors"
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>ارتقا به پرو</span>
              </Link>
            )}

            {/* Notification Bell Button & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                title="صندوق اعلان‌ها و پیام‌های سیستم"
                aria-label="اعلان‌ها"
                className="w-9 h-9 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-slate-700 flex items-center justify-center transition-all relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
                    {toPersianDigits(unreadCount)}
                  </span>
                )}
              </button>

              {/* Popover Dropdown Drawer */}
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden text-right">
                    <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-black text-slate-900">
                          اعلان‌ها و پیام‌های سیستم
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                        >
                          خواندن همه
                        </button>
                      )}
                    </div>

                    <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          هیچ اعلان جدیدی وجود ندارد.
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const isUnread = !n.readByUserIds?.includes(user.id);
                          return (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (isUnread) handleMarkOneRead(n.id);
                              }}
                              className={cn(
                                "p-3.5 transition-colors cursor-pointer space-y-1.5",
                                isUnread
                                  ? "bg-emerald-50/40 hover:bg-emerald-50/70"
                                  : "hover:bg-slate-50"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  {isUnread && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                  )}
                                  <span className="text-xs font-black text-slate-900 leading-tight">
                                    {n.title}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {toPersianDigits(
                                    new Date(n.createdAt).toLocaleDateString("fa-IR")
                                  )}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed">{n.body}</p>
                              {n.actionUrl && (
                                <Link
                                  href={n.actionUrl}
                                  onClick={() => setNotifOpen(false)}
                                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 hover:text-emerald-800 pt-0.5"
                                >
                                  <span>{n.actionLabel || "مشاهده بیشتر"} ←</span>
                                </Link>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 3. Mobile Top App Bar (Native Neobank Header on < lg screens) */}
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-3.5 flex items-center justify-between">
          {/* Right: User Avatar circle + Greeting + Live sync dot */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/app/profile"
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0"
              title="پروفایل کاربری"
            >
              {userInitial}
            </Link>

            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-slate-900 leading-tight">
                سلام، {userName}
              </span>
              <button
                type="button"
                onClick={() => triggerSync(true)}
                className="flex items-center gap-1 text-[10px] text-slate-500 font-medium cursor-pointer"
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    syncStatus === "SYNCED" && "bg-emerald-500",
                    syncStatus === "SYNCING" && "bg-amber-500 animate-ping",
                    syncStatus === "OFFLINE" && "bg-slate-400",
                    syncStatus === "ERROR" && "bg-rose-500"
                  )}
                />
                <span className="text-emerald-700 font-bold">همگام با سایت</span>
              </button>
            </div>
          </div>

          {/* Left: Notif Bell + Android APK Badge */}
          <div className="flex items-center gap-2">
            <Link
              href="/download"
              className="h-7 px-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 text-[10px] font-black inline-flex items-center gap-1 transition-colors"
              title="دریافت نسخه نصبی اندروید و iOS"
            >
              <Smartphone className="w-3 h-3 text-emerald-600" />
              <span>نصب APK</span>
            </Link>

            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center relative cursor-pointer"
              title="اعلان‌ها"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {toPersianDigits(unreadCount)}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* 4. Main Workspace Container */}
        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 lg:pb-10">
            {children}
          </div>
        </main>
      </div>

      {/* 5. Floating Glassmorphic Bottom Pill Dock (Dark Luxury Neobank Style) */}
      <nav className="lg:hidden fixed bottom-3 inset-x-3 z-40 h-16 rounded-[24px] bg-slate-950/95 text-white backdrop-blur-xl border border-white/10 shadow-2xl px-2 flex items-center justify-around select-none">
        {/* Slot 1: خانه */}
        <Link
          href="/app"
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold transition-all",
            isHomeTab || isGroupDetailPage ? "text-emerald-400" : "text-slate-400 hover:text-white"
          )}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>خانه</span>
        </Link>

        {/* Slot 2: پرو طلایی */}
        <Link
          href="/app/billing"
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold transition-all",
            isBillingTab ? "text-amber-400" : "text-slate-400 hover:text-amber-300"
          )}
        >
          <Crown className="w-5 h-5 mb-0.5 text-amber-400" />
          <span>پرو طلایی</span>
        </Link>

        {/* Slot 3: Center Floating Emerald Orb (+ ثبت فوری) */}
        <div className="relative -mt-6 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setQuickActionOpen(true)}
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/40 flex items-center justify-center ring-4 ring-[#F8FAFC] active:scale-95 transition-transform cursor-pointer"
            title="ثبت خرج سریع"
          >
            <Plus className="w-7 h-7 stroke-[2.8]" />
          </button>
        </div>

        {/* Slot 4: دانلود اپ */}
        <Link
          href="/download"
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold transition-all",
            pathname === "/download" ? "text-emerald-400" : "text-slate-400 hover:text-white"
          )}
        >
          <Smartphone className="w-5 h-5 mb-0.5" />
          <span>دانلود اپ</span>
        </Link>

        {/* Slot 5: پروفایل */}
        <Link
          href="/app/profile"
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold transition-all",
            isProfileTab ? "text-emerald-400" : "text-slate-400 hover:text-white"
          )}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>پروفایل</span>
        </Link>
      </nav>

      {/* Slide-Up Quick Action Bottom Sheet with Native Touch Keypad */}
      <MobileQuickActionSheet
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
        userGroups={groups}
      />

      {/* Dual-Layer In-App Auto-Updater Engine (Native APK Progress + Hot OTA) */}
      <InAppUpdaterModal />
    </div>
  );
}

export default AppShell;
