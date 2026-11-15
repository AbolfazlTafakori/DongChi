'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Wallet,
  Scale,
  CreditCard,
  ArrowLeft,
  Crown,
  WifiOff,
  BellRing,
  Fingerprint,
  Share,
  PlusSquare,
  Bell,
  Plus,
  ArrowUpLeft,
  ArrowDownRight,
  Copy,
  Users,
  Check,
  Receipt,
  QrCode,
} from 'lucide-react';
import { toPersianDigits } from '@/lib/money';
import { useToast } from '@/components/ui/Toast';

export interface AppVersionData {
  versionName: string;
  versionCode: number;
  releaseNotes: string;
  directApkUrl: string;
  markets: {
    cafeBazaarUrl: string;
    myketUrl: string;
    sibAppUrl: string;
  };
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type PhoneScreenKey = 'WALLET' | 'KEYPAD' | 'CARD' | 'SETTLE';

/* ==========================================================================
   AUTHENTIC CUSTOM SVG BRAND LOGOS (Android, Apple, CafeBazaar, Myket, SibApp)
   ========================================================================== */

function AndroidLogoSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.523 15.3414C16.961 15.3414 16.504 14.8844 16.504 14.3224C16.504 13.7604 16.961 13.3034 17.523 13.3034C18.085 13.3034 18.542 13.7604 18.542 14.3224C18.542 14.8844 18.085 15.3414 17.523 15.3414ZM6.477 15.3414C5.915 15.3414 5.458 14.8844 5.458 14.3224C5.458 13.7604 5.915 13.3034 6.477 13.3034C7.039 13.3034 7.496 13.7604 7.496 14.3224C7.496 14.8844 7.039 15.3414 6.477 15.3414ZM17.887 10.1564L19.856 6.74643C19.97 6.54843 19.902 6.29543 19.704 6.18143C19.506 6.06643 19.253 6.13443 19.139 6.33243L17.145 9.78643C15.63 9.09443 13.884 8.70343 12 8.70343C10.116 8.70343 8.37 9.09443 6.855 9.78643L4.861 6.33243C4.747 6.13443 4.494 6.06643 4.296 6.18143C4.098 6.29543 4.03 6.54843 4.144 6.74643L6.113 10.1564C2.662 12.0274 0.349 15.5654 0 19.7414H24C23.651 15.5654 21.338 12.0274 17.887 10.1564Z" />
    </svg>
  );
}

function AppleLogoSvg({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.1 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
    </svg>
  );
}

function CafeBazaarLogoSvg({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="13" fill="url(#bazaar_bg)" />
      {/* Arch Handle in Pale Cream/Yellow */}
      <path
        d="M15.5 17V13C15.5 9.4 18.4 6.5 22 6.5C25.6 6.5 28.5 9.4 28.5 13V17"
        stroke="#FFF59D"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Handle Rivets */}
      <circle cx="15.5" cy="16.5" r="1.5" fill="#FDD835" />
      <circle cx="28.5" cy="16.5" r="1.5" fill="#FDD835" />
      {/* Tapered Basket Body */}
      <path
        d="M11 16H33L30 34C29.7 35.5 28.4 36.5 26.9 36.5H17.1C15.6 36.5 14.3 35.5 14 34L11 16Z"
        fill="#2E7D32"
      />
      {/* Basket Top Rim */}
      <rect x="9.5" y="15" width="25" height="2.8" rx="1.4" fill="#43A047" />
      {/* Basket Front Smile Arc */}
      <path
        d="M17 25C18.6 28 25.4 28 27 25"
        stroke="#FFF9C4"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="bazaar_bg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#43A047" />
          <stop offset="1" stopColor="#1B5E20" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MyketLogoSvg({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="13" fill="url(#myket_bg)" />
      {/* White Tote Bag Body */}
      <rect x="11" y="13" width="22" height="21" rx="5.5" fill="white" />
      {/* Top Cutout Handle Notch */}
      <path
        d="M17.5 13V16.5C17.5 19 19.5 21 22 21C24.5 21 26.5 19 26.5 16.5V13"
        stroke="#0284C7"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Myket Smile Arc */}
      <path
        d="M16.5 25C18.2 28.2 25.8 28.2 27.5 25"
        stroke="#0284C7"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Subtle Cyan Accent Dot */}
      <circle cx="22" cy="28.5" r="1.3" fill="#38BDF8" />
      <defs>
        <linearGradient id="myket_bg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#29B6F6" />
          <stop offset="0.5" stopColor="#0284C7" />
          <stop offset="1" stopColor="#01579B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SibAppLogoSvg({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="13" fill="url(#sibapp_bg)" />
      {/* Top Curved Leaf */}
      <path
        d="M24 9.5C24 9.5 26.5 12 24.5 14.5C22.5 14.5 21 12.8 21.5 10.5C22 8.5 24 9.5 24 9.5Z"
        fill="url(#sibapp_leaf)"
      />
      {/* Right Hemisphere Segment */}
      <path
        d="M22 15C24.5 15 30 16 31 21C32.2 26.5 27.5 33 23.5 35C22.5 35.5 22 35 22 35V15Z"
        fill="url(#sibapp_seg_right)"
      />
      {/* Left Hemisphere Segment */}
      <path
        d="M22 15C19.5 15 14 16 13 21C11.8 26.5 16.5 33 20.5 35C21.5 35.5 22 35 22 35V15Z"
        fill="url(#sibapp_seg_left)"
      />
      {/* Faceted Core Accent */}
      <path
        d="M22 17C24.8 20 24.8 27.5 22 31C19.2 27.5 19.2 20 22 17Z"
        fill="url(#sibapp_core)"
        opacity="0.9"
      />
      <circle cx="22" cy="24" r="1.8" fill="#F0F9FF" />
      <defs>
        <linearGradient id="sibapp_bg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E293B" />
          <stop offset="1" stopColor="#090D16" />
        </linearGradient>
        <linearGradient id="sibapp_leaf" x1="21" y1="9" x2="26" y2="15" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="sibapp_seg_right" x1="22" y1="15" x2="32" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06B6D4" />
          <stop offset="0.6" stopColor="#0284C7" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
        <linearGradient id="sibapp_seg_left" x1="12" y1="15" x2="22" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="0.6" stopColor="#2563EB" />
          <stop offset="1" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id="sibapp_core" x1="19" y1="17" x2="25" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BAE6FD" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function AppDownloadShowcase({
  versionInfo,
  isAuthenticated,
}: {
  versionInfo: AppVersionData;
  isAuthenticated: boolean;
}) {
  const { toast } = useToast();
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    toast[type](message);
  };

  const [activeScreen, setActiveScreen] = useState<PhoneScreenKey>('WALLET');
  const [activeOsGuide, setActiveOsGuide] = useState<'ANDROID' | 'IOS' | 'DESKTOP'>('ANDROID');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalledPwa, setIsInstalledPwa] = useState(false);
  const [demoAmount, setDemoAmount] = useState('450000');
  const [copiedCard, setCopiedCard] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      setIsInstalledPwa(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstallPwa() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalledPwa(true);
        showToast('اپلیکیشن دنگ‌چی با موفقیت روی دستگاه شما نصب شد!', 'success');
      }
      setDeferredPrompt(null);
    } else {
      setActiveOsGuide('IOS');
      const el = document.getElementById('install-guide-section');
      el?.scrollIntoView({ behavior: 'smooth' });
      showToast('راهنمای نصب فوری متناسب با دستگاه شما نمایش داده شد.', 'info');
    }
  }

  function handleKeypadPress(key: string) {
    if (key === 'BACK') {
      setDemoAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }
    if (key === '000') {
      setDemoAmount((prev) => (prev === '0' ? '0' : (prev + '000').slice(0, 9)));
      return;
    }
    setDemoAmount((prev) => (prev === '0' ? key : (prev + key).slice(0, 9)));
  }

  function handleCopyDemoCard() {
    setCopiedCard(true);
    showToast('شماره کارت شتاب در حافظه کپی شد.', 'success');
    setTimeout(() => setCopiedCard(false), 2000);
  }

  const formattedDemoAmount = toPersianDigits(
    Number(demoAmount || '0').toLocaleString('en-US')
  );
  const perPersonDemo = toPersianDigits(
    Math.round(Number(demoAmount || '0') / 3).toLocaleString('en-US')
  );

  const screenTabs: {
    key: PhoneScreenKey;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      key: 'WALLET',
      label: 'پیشخوان و کیف پول',
      subtitle: 'تراز لحظه‌ای و گروه‌ها',
      icon: Wallet,
    },
    {
      key: 'KEYPAD',
      label: 'ثبت خرج لمسی',
      subtitle: 'کیبورد عددی سریع',
      icon: Receipt,
    },
    {
      key: 'CARD',
      label: 'کارت مشترک خانه',
      subtitle: 'مدیریت صندوق شتاب',
      icon: CreditCard,
    },
    {
      key: 'SETTLE',
      label: 'تسویه هوشمند',
      subtitle: 'حداقل کارت‌به‌کارت',
      icon: Scale,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-16">
      {/* 1. HERO SHOWCASE BENTO CONTAINER */}
      <div className="p-1.5 sm:p-2 rounded-[36px] bg-slate-200/75 border border-slate-300/80 shadow-sm">
        <div className="bg-white rounded-[30px] border border-slate-200/90 p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative overflow-hidden">
          {/* Subtle Ambient Glows */}
          <div className="pointer-events-none absolute -top-28 -right-28 w-96 h-96 rounded-full bg-emerald-500/[0.06] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 w-96 h-96 rounded-full bg-teal-500/[0.06] blur-3xl" />

          {/* RIGHT COLUMN (7 Cols): Copy, Interactive Screen Switcher, Primary Downloads, Stores & QR */}
          <div className="lg:col-span-7 space-y-6 text-right relative z-10">
            {/* Top Status Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-extrabold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  نسخه رسمی {toPersianDigits(versionInfo.versionName)} • Build{' '}
                  {toPersianDigits(String(versionInfo.versionCode))}
                </span>
              </span>

              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-emerald-300 text-xs font-extrabold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>متصل و همگام با پنل وب در ۵۰ms</span>
              </span>
            </div>

            {/* Headline & Description */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl lg:text-[38px] font-extrabold text-slate-900 tracking-tight leading-[1.35]">
                اپلیکیشن موبایل دنگ‌چی؛ تجربه نئوبانک برای مدیریت خرج‌های خانه
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-[1.9] text-justify">
                نسخه نصبی اندروید (APK) و وب‌اپلیکیشن iOS دنگ‌چی مستقیماً به پایگاه داده ابری سایت
                متصل هستند؛ هر فاکتوری که روی موبایل ثبت کنید بدون نیاز به رفرش دستی روی دسکتاپ و
                گوشی تمام هم‌خانه‌ها به‌روزرسانی می‌شود.
              </p>
            </div>

            {/* Interactive 4-Screen Feature Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700">
                  پیش‌نمایش زنده صفحات داخل گوشی (کلیک کنید):
                </span>
                <span className="text-[11px] font-bold text-emerald-700">
                  ● شبیه‌ساز تعاملی iPhone 18 Pro
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {screenTabs.map((item) => {
                  const Icon = item.icon;
                  const active = activeScreen === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveScreen(item.key)}
                      className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        active
                          ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/15 shadow-2xs'
                          : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/90'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            active
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {active && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                      </div>
                      <div>
                        <span
                          className={`text-xs font-extrabold block whitespace-nowrap ${
                            active ? 'text-emerald-950' : 'text-slate-800'
                          }`}
                        >
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 whitespace-nowrap">
                          {item.subtitle}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Download CTAs with Real Android & Apple SVG Logos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <a
                href={versionInfo.directApkUrl || '/api/apk/download'}
                download
                className="h-16 px-4 sm:px-5 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-between gap-3 transition-all hover:-translate-y-0.5 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <AndroidLogoSvg className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right min-w-0">
                    <span className="text-sm font-extrabold block whitespace-nowrap">
                      دانلود مستقیم فایل APK
                    </span>
                    <span className="text-[11px] text-emerald-100 block mt-0.5 whitespace-nowrap">
                      نصب فوری اندروید • نسخه {toPersianDigits(versionInfo.versionName)}
                    </span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-emerald-100 group-hover:translate-y-0.5 transition-transform shrink-0" />
              </a>

              <button
                type="button"
                onClick={handleInstallPwa}
                className="h-16 px-4 sm:px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg flex items-center justify-between gap-3 transition-all hover:-translate-y-0.5 group text-right cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 text-white flex items-center justify-center shrink-0">
                    <AppleLogoSvg className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-extrabold block whitespace-nowrap">
                      {isInstalledPwa ? 'نسخه وب‌اپلیکیشن فعال است' : 'وب‌اپلیکیشن iOS و ویندوز'}
                    </span>
                    <span className="text-[11px] text-slate-300 block mt-0.5 whitespace-nowrap">
                      نصب آنی آیفون و دسکتاپ (PWA)
                    </span>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform shrink-0" />
              </button>
            </div>

            {/* Authentic Iranian App Stores (3 Spacious Columns with Official Vector Logos) + Full-Width QR Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800">
                  دریافت و بروزرسانی رسمی از مارکت‌های معتبر:
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md">
                  پشتیبانی از آپدیت خودکار
                </span>
              </div>

              {/* 3 Spacious Store Cards — Zero Text Clipping & Concise Subtitles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href={versionInfo.markets.cafeBazaarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-2xl bg-white hover:bg-emerald-50/60 border border-slate-200/90 hover:border-emerald-500/50 flex items-center gap-2.5 transition-all shadow-2xs group"
                >
                  <CafeBazaarLogoSvg className="w-10 h-10 shrink-0" />
                  <div className="min-w-0 text-right flex-1">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block whitespace-nowrap">
                      کافه‌بازار
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 whitespace-nowrap">
                      نسخه اندروید
                    </span>
                  </div>
                </a>

                <a
                  href={versionInfo.markets.myketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-2xl bg-white hover:bg-sky-50/60 border border-slate-200/90 hover:border-sky-500/50 flex items-center gap-2.5 transition-all shadow-2xs group"
                >
                  <MyketLogoSvg className="w-10 h-10 shrink-0" />
                  <div className="min-w-0 text-right flex-1">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block whitespace-nowrap">
                      مایکت
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 whitespace-nowrap">
                      نصب مستقیم
                    </span>
                  </div>
                </a>

                <a
                  href={versionInfo.markets.sibAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-2xl bg-white hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-400 flex items-center gap-2.5 transition-all shadow-2xs group"
                >
                  <SibAppLogoSvg className="w-10 h-10 shrink-0" />
                  <div className="min-w-0 text-right flex-1">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block whitespace-nowrap">
                      سیب‌اپ
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 whitespace-nowrap">
                      نسخه آیفون iOS
                    </span>
                  </div>
                </a>
              </div>

              {/* Dedicated Full-Width QR Scanner Bar (Never Clipped!) */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white p-1.5 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                    <QrCode className="w-8 h-8 text-slate-950" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-white block">
                      نصب سریع روی موبایل با اسکن بارکد (QR Code)
                    </span>
                    <span className="text-[11px] text-slate-300 block mt-0.5">
                      دوربین گوشی خود را باز کنید تا مستقیماً وارد صفحه نصب نسخه موبایل شوید
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-extrabold whitespace-nowrap self-start sm:self-center">
                  Android 7+ • iOS 15+
                </span>
              </div>
            </div>
          </div>

          {/* LEFT COLUMN (5 Cols): ULTRA-REALISTIC iPHONE 18 PRO TITANIUM HARDWARE SIMULATOR */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative z-10 py-2">
            {/* Ambient Backlight Behind iPhone 18 Pro */}
            <div className="pointer-events-none absolute w-80 h-[520px] rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-400/10 to-amber-400/15 blur-3xl" />

            {/* Outer Hardware Wrapper with Physical Side Buttons */}
            <div className="relative w-full max-w-[382px] px-[4px]">
              {/* Left Side Physical Titanium Buttons: Action Button + Volume Up + Volume Down */}
              <div className="absolute left-0 top-28 w-[4px] h-7 rounded-l-md bg-gradient-to-b from-slate-500 to-slate-700 shadow-xs" />
              <div className="absolute left-0 top-40 w-[4px] h-12 rounded-l-md bg-gradient-to-b from-slate-500 to-slate-700 shadow-xs" />
              <div className="absolute left-0 top-56 w-[4px] h-12 rounded-l-md bg-gradient-to-b from-slate-500 to-slate-700 shadow-xs" />

              {/* Right Side Physical Titanium Buttons: Power Button + Camera Control */}
              <div className="absolute right-0 top-44 w-[4px] h-16 rounded-r-md bg-gradient-to-b from-slate-500 to-slate-700 shadow-xs" />
              <div className="absolute right-0 top-80 w-[4px] h-10 rounded-r-md bg-gradient-to-b from-slate-600 to-slate-800 shadow-xs" />

              {/* iPhone 18 Pro Desert/Natural Titanium Outer Frame */}
              <div className="w-full rounded-[58px] bg-gradient-to-b from-[#475569] via-[#1E293B] to-[#0F172A] p-[3px] shadow-[0_35px_80px_-15px_rgba(15,23,42,0.6)]">
                {/* Inner Black Ceramic Shield Bezel (`p-[8px]`) */}
                <div className="rounded-[55px] bg-[#090D16] p-[8px] relative">
                  {/* Top Micro Speaker Slit */}
                  <div className="w-14 h-1 rounded-full bg-slate-800/90 mx-auto mb-1" />

                  {/* OLED Super Retina XDR Display (`h-[676px]`) */}
                  <div
                    dir="rtl"
                    className="h-[676px] rounded-[44px] bg-[#F3F6FA] text-slate-900 flex flex-col justify-between relative overflow-clip [transform:translateZ(0)]"
                  >
                    {/* 1. iOS Status Bar + Authentic Dynamic Island */}
                    <div className="pt-3.5 pb-2 px-7 bg-white rounded-t-[44px] flex items-center justify-between shrink-0 relative z-20">
                      {/* Right (RTL): Persian Time */}
                      <span className="text-[13px] font-extrabold text-slate-900 tabular-nums tracking-tight">
                        ۰۹:۴۱
                      </span>

                      {/* Center: Authentic iPhone 18 Pro Dynamic Island with Camera Lens */}
                      <div className="w-[104px] h-[26px] rounded-full bg-black flex items-center justify-between px-2.5 shadow-inner ring-1 ring-white/10">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[9px] font-extrabold text-emerald-300 tracking-wider">
                            SYNC
                          </span>
                        </div>
                        {/* Sapphire Front Camera Lens */}
                        <div className="w-3 h-3 rounded-full bg-[#111827] ring-1 ring-slate-700 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-400/60" />
                        </div>
                      </div>

                      {/* Left (RTL): Real iOS Signal, 5G & Battery Icons */}
                      <div className="flex items-center gap-1.5 text-slate-900" dir="ltr">
                        {/* Cellular Bars SVG */}
                        <svg className="w-3.5 h-3" viewBox="0 0 16 12" fill="currentColor">
                          <rect x="0" y="8" width="2.5" height="4" rx="0.8" />
                          <rect x="4" y="6" width="2.5" height="6" rx="0.8" />
                          <rect x="8" y="3" width="2.5" height="9" rx="0.8" />
                          <rect x="12" y="0" width="2.5" height="12" rx="0.8" />
                        </svg>
                        <span className="text-[10px] font-extrabold tracking-tighter">5G</span>
                        {/* iOS Battery Icon */}
                        <div className="flex items-center">
                          <div className="w-5 h-2.5 rounded-[3px] border border-slate-900 p-[1.5px] flex items-center">
                            <div className="w-full h-full bg-emerald-500 rounded-[1px]" />
                          </div>
                          <div className="w-[1.5px] h-1 bg-slate-900 rounded-r-xs ml-[0.5px]" />
                        </div>
                      </div>
                    </div>

                    {/* 2. Native App Top Bar Inside Display */}
                    <div className="px-4 py-3 bg-white border-b border-slate-200/70 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-extrabold text-slate-900">
                              دنگ‌چی
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-gradient-to-l from-amber-400 to-yellow-300 text-slate-950 text-[10px] font-extrabold">
                              پرو طلایی
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">
                            ● متصل به حساب وب شما
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          showToast('۲ اعلان جدید: شارژ صندوق و تسویه ماهانه', 'info')
                        }
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 text-slate-700 flex items-center justify-center relative transition-colors cursor-pointer"
                      >
                        <Bell className="w-4 h-4" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                          ۲
                        </span>
                      </button>
                    </div>

                    {/* 3. INTERACTIVE SCREEN BODY */}
                    <div className="flex-1 p-4 space-y-3.5 overflow-y-auto">
                      {/* SCREEN 1: WALLET & HOME DASHBOARD */}
                      {activeScreen === 'WALLET' && (
                        <>
                          {/* Luxury Neobank Emerald Card with Guaranteed RTL Margins & No Text Clipping */}
                          <div
                            dir="rtl"
                            className="rounded-[22px] bg-gradient-to-br from-[#063B30] via-[#052720] to-[#0B1528] text-white p-4 shadow-lg space-y-3 relative overflow-hidden border border-emerald-400/25"
                          >
                            <div className="flex items-center justify-between gap-2" dir="rtl">
                              <span className="text-xs font-bold text-emerald-200/90 text-right leading-tight">
                                تراز خالص شما در خانه‌ها
                              </span>
                              <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/35 text-emerald-300 text-[10px] font-extrabold whitespace-nowrap">
                                + بستانکار
                              </span>
                            </div>

                            <div className="flex items-baseline gap-1.5" dir="rtl">
                              <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                                ۱,۴۲۰,۰۰۰
                              </span>
                              <span className="text-xs font-bold text-emerald-300">تومان</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/10" dir="rtl">
                              <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/10 text-right">
                                <span className="text-[10px] sm:text-[11px] text-slate-300 block">
                                  مجموع طلب از اعضا
                                </span>
                                <span className="text-xs sm:text-sm font-extrabold text-emerald-300 tabular-nums mt-0.5 block">
                                  + ۱,۸۵۰,۰۰۰ ت
                                </span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/10 text-right">
                                <span className="text-[10px] sm:text-[11px] text-slate-300 block">
                                  مجموع بدهی من
                                </span>
                                <span className="text-xs sm:text-sm font-extrabold text-rose-300 tabular-nums mt-0.5 block">
                                  - ۴۳۰,۰۰۰ ت
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 4 Native Quick Launchers */}
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <button
                              type="button"
                              onClick={() => setActiveScreen('KEYPAD')}
                              className="p-2.5 rounded-2xl bg-white hover:bg-emerald-50 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                <Plus className="w-5 h-5" />
                              </div>
                              <span className="text-[11px] font-extrabold text-slate-800 whitespace-nowrap">
                                ثبت خرج
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveScreen('CARD')}
                              className="p-2.5 rounded-2xl bg-white hover:bg-amber-50 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                                <CreditCard className="w-5 h-5" />
                              </div>
                              <span className="text-[11px] font-extrabold text-slate-800 whitespace-nowrap">
                                کارت خانه
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveScreen('SETTLE')}
                              className="p-2.5 rounded-2xl bg-white hover:bg-teal-50 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
                                <Scale className="w-5 h-5" />
                              </div>
                              <span className="text-[11px] font-extrabold text-slate-800 whitespace-nowrap">
                                تسویه آنی
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                showToast('اطلاعات اپ و سایت در لحظه همگام هستند!', 'success')
                              }
                              className="p-2.5 rounded-2xl bg-white hover:bg-indigo-50 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                                <RefreshCw className="w-5 h-5" />
                              </div>
                              <span className="text-[11px] font-extrabold text-slate-800 whitespace-nowrap">
                                سینک ابری
                              </span>
                            </button>
                          </div>

                          {/* Active Group Card */}
                          <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-xs">
                                  <Users className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-xs font-extrabold text-slate-900 block">
                                    خانه الهیه (۴ هم‌خانه)
                                  </span>
                                  <span className="text-[11px] text-slate-500 block mt-0.5">
                                    موجودی صندوق: ۳,۲۰۰,۰۰۰ تومان
                                  </span>
                                </div>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold">
                                فعال
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-600">
                                آخرین خرید: سوپرمارکت و لبنیات
                              </span>
                              <span className="font-extrabold text-slate-900 tabular-nums">
                                ۴۵۰,۰۰۰ تومان
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* SCREEN 2: INTERACTIVE TOUCH KEYPAD */}
                      {activeScreen === 'KEYPAD' && (
                        <div className="space-y-3">
                          <div className="bg-white rounded-2xl border border-emerald-500/40 p-4 text-center shadow-2xs space-y-1.5">
                            <span className="text-xs font-bold text-slate-500 block">
                              مبلغ فاکتور جدید (با دکمه‌ها تغییر دهید)
                            </span>
                            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                              {formattedDemoAmount}{' '}
                              <span className="text-xs font-bold text-emerald-700">تومان</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold">
                              <span>سهم هر نفر (۳ عضو):</span>
                              <span className="tabular-nums">{perPersonDemo} تومان</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2" dir="ltr">
                            {[
                              '1',
                              '2',
                              '3',
                              '4',
                              '5',
                              '6',
                              '7',
                              '8',
                              '9',
                              '000',
                              '0',
                              'BACK',
                            ].map((k) => (
                              <button
                                key={k}
                                type="button"
                                onClick={() => handleKeypadPress(k)}
                                className="h-12 rounded-2xl bg-white hover:bg-emerald-50 active:scale-95 border border-slate-200/90 shadow-2xs text-base font-extrabold text-slate-900 transition-all cursor-pointer"
                              >
                                {k === 'BACK' ? '⌫' : toPersianDigits(k)}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              showToast('فاکتور نمونه ثبت و با وب‌سایت همگام شد!', 'success');
                              setActiveScreen('WALLET');
                            }}
                            className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer"
                          >
                            ✓ ثبت آنی فاکتور و همگام‌سازی با اعضا
                          </button>
                        </div>
                      )}

                      {/* SCREEN 3: SHARED HOUSE BANK CARD */}
                      {activeScreen === 'CARD' && (
                        <div className="space-y-3.5">
                          <div className="rounded-[24px] p-5 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white shadow-lg border border-emerald-500/30 space-y-4">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-amber-300">
                                کارت مشترک صندوق خانه
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-bold">
                                بانک سامان • شتاب
                              </span>
                            </div>

                            <div
                              dir="ltr"
                              className="text-base font-mono font-extrabold tracking-[0.16em] text-center text-emerald-100 py-1"
                            >
                              6219  8610  4491  7702
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                              <div>
                                <span className="text-[11px] text-slate-300 block">
                                  موجودی فعلی صندوق:
                                </span>
                                <span className="text-lg font-extrabold text-emerald-400 tabular-nums">
                                  ۳,۲۰۰,۰۰۰ تومان
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={handleCopyDemoCard}
                                className="h-8 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                {copiedCard ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                                    <span>کپی شد</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>کپی کارت</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
                            <span className="text-xs font-extrabold text-slate-800 block">
                              آخرین تراکنش‌های کارت خانه:
                            </span>
                            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                  <ArrowUpLeft className="w-4 h-4" />
                                </span>
                                <span className="font-bold text-slate-800">خرید میوه و پروتئین</span>
                              </div>
                              <span className="font-extrabold text-rose-600 tabular-nums">
                                - ۲۸۰,۰۰۰ ت
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                  <ArrowDownRight className="w-4 h-4" />
                                </span>
                                <span className="font-bold text-slate-800">
                                  شارژ صندوق توسط سارا
                                </span>
                              </div>
                              <span className="font-extrabold text-emerald-600 tabular-nums">
                                + ۱,۰۰۰,۰۰۰ ت
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SCREEN 4: SMART SETTLEMENT */}
                      {activeScreen === 'SETTLE' && (
                        <div className="space-y-3.5">
                          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1.5">
                            <span className="text-xs font-extrabold text-emerald-950 block">
                              ✓ الگوریتم حداقل تراکنش (Simplify Debts)
                            </span>
                            <p className="text-[11px] text-emerald-800 leading-relaxed">
                              ۶ بدهی متقاطع بین اعضای خانه به ۲ کارت‌به‌کارت مستقیم خلاصه شد:
                            </p>
                          </div>

                          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                              <div>
                                <span className="text-xs font-extrabold text-slate-900 block">
                                  رضا کاظمی ⬅ علی محمدی
                                </span>
                                <span
                                  className="text-[11px] text-slate-400 block mt-0.5"
                                  dir="ltr"
                                >
                                  6037 •••• •••• 1120
                                </span>
                              </div>
                              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-xs tabular-nums">
                                ۳۲۰,۰۰۰ تومان
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-extrabold text-slate-900 block">
                                  مریم رضایی ⬅ علی محمدی
                                </span>
                                <span
                                  className="text-[11px] text-slate-400 block mt-0.5"
                                  dir="ltr"
                                >
                                  6037 •••• •••• 1120
                                </span>
                              </div>
                              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-xs tabular-nums">
                                ۱۸۰,۰۰۰ تومان
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Authentic Curve-Matched iOS Tab Bar + Home Indicator (Zero Corner Bleed!) */}
                    <div className="pt-2.5 pb-3 px-7 bg-white rounded-b-[44px] border-t border-slate-200/80 shrink-0 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setActiveScreen('WALLET')}
                          className={`flex flex-col items-center gap-1 text-[10px] font-extrabold transition-colors whitespace-nowrap ${
                            activeScreen === 'WALLET' ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          <Wallet className="w-4 h-4 shrink-0" />
                          <span>پیشخوان</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveScreen('CARD')}
                          className={`flex flex-col items-center gap-1 text-[10px] font-extrabold transition-colors whitespace-nowrap ${
                            activeScreen === 'CARD' ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 shrink-0" />
                          <span>صندوق</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveScreen('KEYPAD')}
                          className="w-10 h-10 -mt-4 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center shadow-md ring-4 ring-white shrink-0"
                        >
                          <Plus className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveScreen('SETTLE')}
                          className={`flex flex-col items-center gap-1 text-[10px] font-extrabold transition-colors whitespace-nowrap ${
                            activeScreen === 'SETTLE' ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          <Scale className="w-4 h-4 shrink-0" />
                          <span>تسویه</span>
                        </button>

                        <Link
                          href={isAuthenticated ? '/app' : '/login'}
                          className="flex flex-col items-center gap-1 text-[10px] font-extrabold text-amber-600 whitespace-nowrap"
                        >
                          <Crown className="w-4 h-4 shrink-0" />
                          <span>پنل من</span>
                        </Link>
                      </div>

                      <div className="w-28 h-1 rounded-full bg-slate-300 mx-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 REAL-TIME CLOUD SYNC & NATIVE CAPABILITY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-1.5 rounded-[24px] bg-slate-200/60 border border-slate-200/90 flex">
          <div className="bg-white rounded-[18px] border border-slate-200/90 p-5 space-y-3 w-full">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              همگام‌سازی دوطرفه با سایت در ۵۰ms
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              تغییرات روی موبایل و دسکتاپ بدون نیاز به رفرش دستی و به صورت آنی در تمام دستگاه‌های
              اعضای خانه سینک می‌شوند.
            </p>
          </div>
        </div>

        <div className="p-1.5 rounded-[24px] bg-slate-200/60 border border-slate-200/90 flex">
          <div className="bg-white rounded-[18px] border border-slate-200/90 p-5 space-y-3 w-full">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              صف انتظار هوشمند آفلاین (Offline Queue)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              در سفر یا نقاط بدون آنتن، خرج‌ها را در اپ ثبت کنید؛ به محض وصل شدن اینترنت، اطلاعات
              خودکار به سرور منتقل می‌شود.
            </p>
          </div>
        </div>

        <div className="p-1.5 rounded-[24px] bg-slate-200/60 border border-slate-200/90 flex">
          <div className="bg-white rounded-[18px] border border-slate-200/90 p-5 space-y-3 w-full">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              بروزرسانی درون‌برنامه‌ای (OTA & Markets)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              قابلیت‌های جدید حسابداری به صورت ابری و بدون نیاز به دانلود مجدد به اپلیکیشن شما اضافه
              می‌شوند.
            </p>
          </div>
        </div>

        <div className="p-1.5 rounded-[24px] bg-slate-200/60 border border-slate-200/90 flex">
          <div className="bg-white rounded-[18px] border border-slate-200/90 p-5 space-y-3 w-full">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-600 flex items-center justify-center">
              <Fingerprint className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              نشست امن و بدون نیاز به فیلترشکن
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              سرورهای دنگ‌چی با اینترنت داخلی و بین‌الملل با بالاترین سرعت و امنیت رمزنگاری‌شده کار
              می‌کنند.
            </p>
          </div>
        </div>
      </div>

      {/* 3. STEP-BY-STEP PLATFORM INSTALLATION GUIDE */}
      <div id="install-guide-section" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              راهنمای گام‌به‌گام نصب بر اساس نوع دستگاه شما
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              نصب در کمتر از ۲۰ ثانیه روی گوشی‌های اندروید، آیفون (iOS) و کامپیوترهای ویندوز
            </p>
          </div>

          <div className="p-1.5 rounded-2xl bg-slate-200/70 border border-slate-200/90 inline-flex items-center gap-1.5 self-start">
            <button
              type="button"
              onClick={() => setActiveOsGuide('ANDROID')}
              className={`h-9 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeOsGuide === 'ANDROID'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              اندروید (APK و مارکت‌ها)
            </button>
            <button
              type="button"
              onClick={() => setActiveOsGuide('IOS')}
              className={`h-9 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeOsGuide === 'IOS'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              آیفون و آیپد (iOS)
            </button>
            <button
              type="button"
              onClick={() => setActiveOsGuide('DESKTOP')}
              className={`h-9 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeOsGuide === 'DESKTOP'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              نسخه دسکتاپ ویندوز
            </button>
          </div>
        </div>

        <div className="p-1.5 rounded-[26px] bg-slate-200/60 border border-slate-200/90">
          <div className="bg-white rounded-[20px] border border-slate-200/90 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeOsGuide === 'ANDROID' && (
              <>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-extrabold inline-block">
                    گام اول
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    دریافت فایل APK یا انتخاب مارکت
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    روی دکمه سبز «دانلود مستقیم فایل APK» در بالای همین صفحه کلیک کنید یا از طریق
                    کافه‌بازار و مایکت اقدام نمایید.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-extrabold inline-block">
                    گام دوم
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    نصب بسته نصبی روی گوشی
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    فایل دانلودشده (`dongchi-v{versionInfo.versionName}.apk`) را باز کرده و گزینه Install را بزنید تا
                    آیکون دنگ‌چی به صفحه اصلی گوشی اضافه شود.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-extrabold inline-block">
                    گام سوم
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    ورود با شماره موبایل و سینک خودکار
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    با همان شماره موبایلی که در سایت ثبت‌نام کرده‌اید وارد شوید؛ تمام گروه‌ها و
                    ترازهای شما بلافاصله بارگذاری می‌شوند.
                  </p>
                </div>
              </>
            )}

            {activeOsGuide === 'IOS' && (
              <>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-extrabold">
                      گام اول در Safari
                    </span>
                    <Share className="w-5 h-5 text-sky-600" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    لمس دکمه Share در مرورگر سافاری
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    سایت دنگ‌چی را در مرورگر Safari آیفون باز کنید و در نوار پایین روی آیکون
                    اشتراک‌گذاری (Share) بزنید.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-extrabold">
                      گام دوم
                    </span>
                    <PlusSquare className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    انتخاب گزینه Add to Home Screen
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    در منوی بازشده، گزینه «Add to Home Screen» را انتخاب کرده و در بالا دکمه Add را
                    لمس کنید.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-extrabold">
                      گام سوم
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    اجرای تمام‌صفحه بدون محدودیت اپل
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    اپلیکیشن دنگ‌چی با آیکون اختصاصی و به صورت تمام‌صفحه (Standalone) بدون نیاز به
                    گواهی‌های موقت و بدون کرش اجرا می‌شود.
                  </p>
                </div>
              </>
            )}

            {activeOsGuide === 'DESKTOP' && (
              <>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-extrabold inline-block">
                    گام اول در ویندوز
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    کلیک روی دکمه نصب در نوار آدرس Chrome / Edge
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    در سمت راست نوار آدرس مرورگر کروم یا اج، روی آیکون نصب (Open in app / Install) یا
                    دکمه «نصب آنی وب‌اپلیکیشن» کلیک کنید.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-extrabold inline-block">
                    گام دوم
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    افزودن به Taskbar و منوی Start ویندوز
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    برنامه در یک پنجره مستقل دسکتاپ باز شده و آیکون آن روی دسکتاپ و نوار وظیفه
                    ویندوز سنجاق می‌شود.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-extrabold inline-block">
                    گام سوم
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    دسترسی سریع به داشبورد عریض و خروجی اکسل
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    در نسخه ویندوز می‌توانید گزارش‌های مالی را در نمای ۱۲ ستونه بررسی کرده و با ۱ کلیک
                    خروجی اکسل فارسی بگیرید.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
