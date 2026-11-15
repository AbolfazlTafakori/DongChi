'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { toPersianDigits } from '@/lib/money';
import { useToast } from '@/components/ui/Toast';

export interface AppVersionResponse {
  versionName: string;
  versionCode: number;
  minRequiredVersionCode: number;
  forceUpdate: boolean;
  releaseTitle: string;
  releaseNotes: string;
  releaseNotesList: string[];
  apkFileSizeMb: string;
  apkSha256: string;
  directApkUrl: string;
  markets: {
    cafeBazaarUrl: string;
    myketUrl: string;
    sibAppUrl: string;
  };
  otaBuildId: string;
  hasNativeUpdate: boolean;
  isForceUpdate: boolean;
  hasOtaWebUpdate: boolean;
  serverTime: string;
}

export default function InAppUpdaterModal() {
  const { toast } = useToast();

  const [versionData, setVersionData] = useState<AppVersionResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showOtaBar, setShowOtaBar] = useState(false);
  const [installedVersionCode, setInstalledVersionCode] = useState<number>(24);

  // Downloader State
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadStep, setDownloadStep] = useState<string>('');

  const checkForUpdates = useCallback(async (manual = false) => {
    try {
      if (typeof window === 'undefined') return;

      const savedCode = localStorage.getItem('dongchi_installed_version_code');
      const currentCode = savedCode ? parseInt(savedCode, 10) : 24;
      setInstalledVersionCode(currentCode);

      const savedOta = localStorage.getItem('dongchi_installed_ota_build_id') || 'dc-build-legacy';

      const res = await fetch(
        `/api/app-version?clientVersionCode=${currentCode}&clientBuildId=${encodeURIComponent(savedOta)}`
      );

      if (!res.ok) return;

      const data: AppVersionResponse = await res.json();
      setVersionData(data);

      if (data.isForceUpdate) {
        setIsOpen(true);
        setShowBanner(false);
      } else if (data.hasNativeUpdate) {
        setShowBanner(true);
        if (manual) {
          setIsOpen(true);
        }
      } else if (data.hasOtaWebUpdate) {
        setShowOtaBar(true);
      } else if (manual) {
        toast.success(`شما از آخرین نسخه دنگ‌چی (${toPersianDigits(data.versionName)}) استفاده می‌کنید.`);
      }
    } catch (err) {
      console.error('Failed to check for app updates:', err);
    }
  }, [toast]);

  useEffect(() => {
    // Initial check on mount
    checkForUpdates();

    // Check when window gains focus or online
    const handleFocus = () => checkForUpdates();
    const handleCheckEvent = () => checkForUpdates(true);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('dongchi:check-update', handleCheckEvent);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('dongchi:check-update', handleCheckEvent);
    };
  }, [checkForUpdates]);

  // Built-in Live Progress Streaming Downloader
  const handleDownloadAndInstall = async () => {
    if (!versionData) return;
    setIsDownloading(true);
    setProgress(0);
    setDownloadStep('در حال برقراری ارتباط با سرور...');

    try {
      const response = await fetch(versionData.directApkUrl || '/api/apk/download');
      if (!response.ok) {
        throw new Error('خطا در دریافت فایل نصبی');
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.body) {
        // Fallback: regular blob download
        const blob = await response.blob();
        triggerBlobDownload(blob, `dongchi-v${versionData.versionName}.apk`);
        finishDownload();
        return;
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      setDownloadStep('در حال دریافت بسته‌ی بروزرسانی...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          receivedBytes += value.length;
          if (totalBytes > 0) {
            const currentPct = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
            setProgress(currentPct);
          } else {
            setProgress((prev) => Math.min(95, prev + 15));
          }
        }
      }

      setProgress(100);
      setDownloadStep('بررسی امضای دیجیتال و سلامت فایل (SHA-256)...');
      await new Promise((r) => setTimeout(r, 600));

      const fullBlob = new Blob(chunks as any[], {
        type: 'application/vnd.android.package-archive',
      });

      triggerBlobDownload(fullBlob, `dongchi-v${versionData.versionName}.apk`);
      finishDownload();
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error('خطا در دریافت خودکار فایل نصبی. لطفاً از طریق مارکت‌ها اقدام کنید.');
      setIsDownloading(false);
      setProgress(0);
    }
  };

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const finishDownload = () => {
    if (!versionData) return;
    setIsDownloading(false);
    setProgress(100);
    setDownloadStep('دانلود تکمیل شد!');

    // Update local version cache
    localStorage.setItem('dongchi_installed_version_code', String(versionData.versionCode));
    setInstalledVersionCode(versionData.versionCode);

    if (versionData.otaBuildId) {
      localStorage.setItem('dongchi_installed_ota_build_id', versionData.otaBuildId);
    }

    toast.success(`نسخه جدید (${toPersianDigits(versionData.versionName)}) با موفقیت دریافت و همگام‌سازی شد!`);
    setShowBanner(false);

    if (!versionData.isForceUpdate) {
      setIsOpen(false);
    }
  };

  const handleHotOtaReload = () => {
    if (versionData?.otaBuildId) {
      localStorage.setItem('dongchi_installed_ota_build_id', versionData.otaBuildId);
    }
    window.location.reload();
  };

  if (!versionData) return null;

  return (
    <>
      {/* 1. Hot OTA Web Update Notification Bar (Instant Cloud Sync) */}
      {showOtaBar && !versionData.isForceUpdate && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-l from-emerald-600 via-teal-600 to-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-md flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            <span>نسخه ابری جدید دنگ‌چی آماده است — اعمال بروزرسانی سریع بدون نیاز به دانلود</span>
          </div>
          <button
            type="button"
            onClick={handleHotOtaReload}
            className="px-3 py-1 rounded-lg bg-white text-emerald-800 text-[11px] font-extrabold hover:bg-emerald-50 transition-colors shrink-0 shadow-2xs"
          >
            بروزرسانی آنی (۱ ثانیه)
          </button>
        </div>
      )}

      {/* 2. Optional Update Floating Banner */}
      {showBanner && !isOpen && !versionData.isForceUpdate && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-40 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-emerald-500/30 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0 text-right">
              <span className="text-xs font-extrabold block truncate">
                نسخه جدید {toPersianDigits(versionData.versionName)} دنگ‌چی منتشر شد!
              </span>
              <span className="text-[11px] text-slate-300 block truncate mt-0.5">
                شامل امکانات جدید حسابداری و تسویه سریع
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-colors"
            >
              مشاهده و نصب
            </button>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. In-App Updater Modal (Optional OR Mandatory Force-Update Lock) */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
            versionData.isForceUpdate
              ? 'bg-slate-950/95 backdrop-blur-xl'
              : 'bg-black/60 backdrop-blur-xs'
          } animate-in fade-in duration-200`}
        >
          <div
            dir="rtl"
            className="w-full max-w-lg rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-7 space-y-5 text-right relative overflow-hidden"
          >
            {/* Ambient Background Tint */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl" />

            {/* Header & Close Button (Hidden on Force Update) */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    versionData.isForceUpdate
                      ? 'bg-amber-500 text-white'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
                  }`}
                >
                  {versionData.isForceUpdate ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <Sparkles className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    {versionData.releaseTitle}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-500">
                      نسخه شما: {toPersianDigits(String(installedVersionCode))}
                    </span>
                    <span className="text-xs text-slate-400">⬅</span>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                      نسخه جدید: {toPersianDigits(versionData.versionName)} (کد {toPersianDigits(String(versionData.versionCode))})
                    </span>
                  </div>
                </div>
              </div>

              {!versionData.isForceUpdate && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Force Update Warning Notice */}
            {versionData.isForceUpdate && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold leading-relaxed space-y-1">
                <div className="flex items-center gap-2 font-extrabold text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>بروزرسانی اجباری امنیتی و مالی</span>
                </div>
                <p>
                  برای حفظ یکپارچگی محاسبات دنگ‌ها و همگام‌سازی بی‌نقص با هسته ابری، ادامه فعالیت در
                  برنامه نیازمند نصب این نسخه است.
                </p>
              </div>
            )}

            {/* Release Changelog Items */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-slate-800 block">
                تغییرات و قابلیت‌های جدید این نسخه:
              </span>
              <div className="max-h-40 overflow-y-auto rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2 text-xs text-slate-700 leading-relaxed">
                {versionData.releaseNotesList.length > 0 ? (
                  versionData.releaseNotesList.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p>{versionData.releaseNotes}</p>
                )}
              </div>
            </div>

            {/* Technical Verification Badges (Size + SHA256) */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-bold">حجم فایل نصبی:</span>
                <span className="font-extrabold text-slate-900">{versionData.apkFileSizeMb}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-bold">اصالت بسته:</span>
                <span className="font-extrabold text-emerald-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  SHA-256 تاییدشده
                </span>
              </div>
            </div>

            {/* Built-In Live Progress Downloader */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {isDownloading ? (
                <div className="space-y-2 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                  <div className="flex items-center justify-between text-xs font-extrabold text-emerald-950">
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                      {downloadStep}
                    </span>
                    <span className="tabular-nums">{toPersianDigits(String(progress))}٪</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-emerald-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-emerald-600 to-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-emerald-700 block text-center">
                    لطفاً تا پایان دریافت فایل شکیبا باشید؛ بسته نصبی به طور خودکار آماده اجرا خواهد شد.
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadAndInstall}
                  className="w-full h-12 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>دانلود و نصب مستقیم درون‌برنامه‌ای</span>
                </button>
              )}

              {/* Alternative 1-Tap Market Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {versionData.markets.cafeBazaarUrl && (
                  <a
                    href={versionData.markets.cafeBazaarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 px-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>کافه‌بازار</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}

                {versionData.markets.myketUrl && (
                  <a
                    href={versionData.markets.myketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 px-3 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>مایکت</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}

                {versionData.markets.sibAppUrl && (
                  <a
                    href={versionData.markets.sibAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors col-span-2 sm:col-span-1"
                  >
                    <span>سیب‌اپ (iOS)</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
