"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  MessageSquare,
  Globe,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Zap,
  Send,
  Download,
  ShieldCheck,
  RefreshCw,
  Save,
  Lock,
  Building,
  Smartphone,
  Server,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { PlatformSystemConfig, DEFAULT_SYSTEM_CONFIG } from "@/lib/system-config-types";
import { toPersianDigits } from "@/lib/money";

type TabKey = "PAYMENT" | "SMS" | "CMS" | "DEVELOPER" | "MOBILE";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("PAYMENT");
  const [config, setConfig] = useState<PlatformSystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingGateway, setTestingGateway] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [testSmsPhone, setTestSmsPhone] = useState("09121234567");
  const [broadcastingUpdate, setBroadcastingUpdate] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch {
      toast.error("خطا در بارگذاری تنظیمات سیستم.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (section?: keyof Omit<PlatformSystemConfig, "updatedAt">) => {
    try {
      setSaving(true);
      const payload = section ? { [section]: config[section] } : config;
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ذخیره تنظیمات.");
      }
      if (data.config) {
        setConfig(data.config);
      }
      toast.success("تنظیمات با موفقیت ذخیره شدند و روی سرور اعمال گردیدند.");
    } catch (err: any) {
      toast.error(err.message || "خطای ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  const handleTestGateway = async () => {
    try {
      setTestingGateway(true);
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TEST_GATEWAY" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "اتصال به درگاه بانکی با موفقیت تایید شد.");
      } else {
        toast.error(data.error || "تست اتصال به درگاه ناموفق بود.");
      }
    } catch {
      toast.error("خطا در تست اتصال به درگاه.");
    } finally {
      setTestingGateway(false);
    }
  };

  const handleTestSms = async () => {
    try {
      setTestingSms(true);
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TEST_SMS", phone: testSmsPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "پیامک تست تحویل مخابرات شد.");
      } else {
        toast.error(data.error || "تست ارسال پیامک ناموفق بود.");
      }
    } catch {
      toast.error("خطا در تست ارسال پیامک.");
    } finally {
      setTestingSms(false);
    }
  };

  const handleBroadcastRelease = async () => {
    try {
      setBroadcastingUpdate(true);
      await handleSave("mobileApp");

      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `🚀 انتشار نسخه ${config.mobileApp?.latestVersionName || "جدید"} دنگ‌چی`,
          message: `${config.mobileApp?.releaseTitle || "بروزرسانی جدید دنگ‌چی منتشر شد."} برای نصب مستقیم یا مشاهده تغییرات کلیک کنید.`,
          type: "SYSTEM",
          targetAudience: "ALL",
        }),
      }).catch(() => {});

      toast.success(
        `نسخه ${toPersianDigits(config.mobileApp?.latestVersionName || "جدید")} با موفقیت ذخیره و به تمام کاربران اعلان گردید!`
      );
    } catch {
      toast.error("خطا در ارسال اعلان انتشار نسخه جدید.");
    } finally {
      setBroadcastingUpdate(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dongchi-system-config-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.info("فایل تنظیمات سیستم با موفقیت دانلود شد.");
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">در حال بارگذاری مرکز پیکربندی سیستم...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-white">مرکز پیکربندی زیرساخت، درگاه‌ها و محتوا</h1>
          </div>
          <p className="text-xs text-slate-400">
            مدیریت زنده درگاه‌های پرداخت، وب‌سرویس پیامک، متون صفحه اصلی و سوئیچ‌های فیچرفلگ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportJson}
            className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>دانلود Backup تنظیمات</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave()}
            className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black inline-flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "در حال ذخیره..." : "ذخیره سراسری"}</span>
          </button>
        </div>
      </div>

      {/* 4 Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/80">
        <button
          type="button"
          onClick={() => setActiveTab("PAYMENT")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all inline-flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "PAYMENT"
              ? "bg-white text-slate-950 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>درگاه‌های پرداخت بانکی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SMS")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all inline-flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "SMS"
              ? "bg-white text-slate-950 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <span>پنل پیامک و OTP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CMS")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all inline-flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "CMS"
              ? "bg-white text-slate-950 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Globe className="w-4 h-4 text-teal-600" />
          <span>متون و محتوای سایت (CMS)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DEVELOPER")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all inline-flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "DEVELOPER"
              ? "bg-white text-slate-950 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-600" />
          <span>ابزارهای فنی و فیچرفلگ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("MOBILE")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all inline-flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "MOBILE"
              ? "bg-white text-slate-950 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Smartphone className="w-4 h-4 text-sky-600" />
          <span>نسخه موبایل و مارکت‌ها (APK)</span>
        </button>
      </div>

      {/* TAB 1: PAYMENT GATEWAYS */}
      {activeTab === "PAYMENT" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">تنظیمات درگاه پرداخت و شاپرک</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                پیکربندی ارائه‌دهنده فعال، کدهای پذیرنده و حالت آزمایشی یا پروداکشن
              </p>
            </div>
            <button
              type="button"
              disabled={testingGateway}
              onClick={handleTestGateway}
              className="h-9 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>{testingGateway ? "در حال تست..." : "⚡ تست زنده اتصال به درگاه"}</span>
            </button>
          </div>

          {/* Provider Selection Grid */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 block">ارائه‌دهنده درگاه فعال:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { key: "MOCK_SHAPARAK", title: "شبیه‌ساز شاپرک", desc: "محیط تست و دیباگ توسعه" },
                { key: "ZARINPAL", title: "زرین‌پال (ZarinPal)", desc: "درگاه پرداخت واسط شاپرک" },
                { key: "ZIBAL", title: "زیبال (Zibal)", desc: "درگاه واسط و شناسه واریز" },
                { key: "IDPAY", title: "آیدی‌پی (IDPay)", desc: "درگاه و خدمات پرداخت الکترونیک" },
              ].map((provider) => {
                const isActive = config.payment.activeProvider === provider.key;
                return (
                  <button
                    key={provider.key}
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        payment: { ...config.payment, activeProvider: provider.key as any },
                      })
                    }
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 ${
                      isActive
                        ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs"
                        : "bg-slate-50/80 hover:bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">{provider.title}</span>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isActive ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                        }`}
                      >
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">{provider.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">کد پذیرنده / Merchant ID:</label>
              <input
                type="text"
                dir="ltr"
                value={config.payment.merchantId}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    payment: { ...config.payment, merchantId: e.target.value },
                  })
                }
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-left"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">آدرس بازگشت (Callback Base URL):</label>
              <input
                type="text"
                dir="ltr"
                value={config.payment.callbackBaseUrl}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    payment: { ...config.payment, callbackBaseUrl: e.target.value },
                  })
                }
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-left"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">مالیات بر ارزش افزوده (درصد VAT):</label>
              <input
                type="number"
                value={config.payment.vatPercent}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    payment: { ...config.payment, vatPercent: Number(e.target.value) || 0 },
                  })
                }
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">حالت آزمایشی (Sandbox):</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  تراکنش‌های واقعی ثبت نمی‌شوند و تست بانکی بدون کارت شتاب انجام می‌گیرد
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    payment: { ...config.payment, sandboxMode: !config.payment.sandboxMode },
                  })
                }
                className="p-1 cursor-pointer"
              >
                {config.payment.sandboxMode ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Phase 2: P2P Direct Gateway Settlement Configuration */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
              <div>
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  موتور تسویه مستقیم بدهی کاربران از درگاه (فاز ۲ — P2P FinTech)
                </span>
                <span className="text-[11px] text-emerald-800 block mt-0.5">
                  امکان واریز مستقیم بدهی از طریق درگاه بانکی به حساب/شبای کاربر طلبکار با تقسیم خودکار شاپرک
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    payment: {
                      ...config.payment,
                      enableP2pGatewaySettlement: !config.payment.enableP2pGatewaySettlement,
                    },
                  })
                }
                className="p-1 cursor-pointer"
              >
                {config.payment.enableP2pGatewaySettlement ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">حالت تسویه بین بانکی:</label>
                <select
                  value={config.payment.p2pSettlementMode || 'SPLIT_SHAPARAK'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      payment: {
                        ...config.payment,
                        p2pSettlementMode: e.target.value as any,
                      },
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                >
                  <option value="SPLIT_SHAPARAK">تسهیم آنی شاپرک (Split Payment)</option>
                  <option value="ESCROW_PAYA">صندوق امانی و تسویه پایا (Escrow)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">درصد کارمزد زیرساخت (درصد):</label>
                <input
                  type="number"
                  value={config.payment.p2pCommissionPercent ?? 0}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      payment: {
                        ...config.payment,
                        p2pCommissionPercent: Number(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("payment")}
              className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره تنظیمات درگاه پرداخت</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SMS & OTP PROVIDER */}
      {activeTab === "SMS" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">تنظیمات پنل پیامک و ورود با OTP</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                انتخاب ارائه‌دهنده پیامک خدماتی، کدهای پترن و کنترل کدهای تستی
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                dir="ltr"
                value={testSmsPhone}
                onChange={(e) => setTestSmsPhone(e.target.value)}
                placeholder="09121234567"
                className="w-32 h-9 px-2 rounded-xl border border-slate-200 font-mono text-xs font-bold text-center"
              />
              <button
                type="button"
                disabled={testingSms}
                onClick={handleTestSms}
                className="h-9 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-indigo-600" />
                <span>{testingSms ? "در حال ارسال..." : "ارسال پیامک تست"}</span>
              </button>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 block">ارائه‌دهنده وب‌سرویس پیامک:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {[
                { key: "LOCAL_DEV", title: "حالت تست لوکال", desc: "کنسول سرور (بدون هزینه)" },
                { key: "KAVENEGAR", title: "کاوه نگار", desc: "وب‌سرویس اعتبارسنجی OTP" },
                { key: "MELIPAYAMAK", title: "ملی پیامک", desc: "ارسال سریع بر اساس پترن" },
                { key: "FARAZSMS", title: "فراز اس‌ام‌اس", desc: "سامانه پیامک خدماتی" },
                { key: "SMSIR", title: "SMS.ir", desc: "خطوط خدماتی و وریفای" },
              ].map((prov) => {
                const isActive = config.sms.activeProvider === prov.key;
                return (
                  <button
                    key={prov.key}
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        sms: { ...config.sms, activeProvider: prov.key as any },
                      })
                    }
                    className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-1.5 ${
                      isActive
                        ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs"
                        : "bg-slate-50/80 hover:bg-slate-50 border-slate-200"
                    }`}
                  >
                    <span className="text-xs font-black text-slate-900">{prov.title}</span>
                    <span className="text-[10px] text-slate-500">{prov.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SMS Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">کلید API / WebService Key:</label>
              <input
                type="text"
                dir="ltr"
                value={config.sms.apiKey}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    sms: { ...config.sms, apiKey: e.target.value },
                  })
                }
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white text-left"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">شماره خط اختصاصی یا خدماتی:</label>
              <input
                type="text"
                dir="ltr"
                value={config.sms.senderLine}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    sms: { ...config.sms, senderLine: e.target.value },
                  })
                }
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white text-left"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">کد پترن اعتبارسنجی (Template ID):</label>
              <input
                type="text"
                dir="ltr"
                value={config.sms.otpPatternCode}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    sms: { ...config.sms, otpPatternCode: e.target.value },
                  })
                }
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white text-left"
              />
            </div>
          </div>

          {/* OTP Security Tuning */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">کد تایید ثابت تستی:</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">پذیرش کد ۱۲۳۴۵ برای تست سریع</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    sms: { ...config.sms, enableStaticDevOtp: !config.sms.enableStaticDevOtp },
                  })
                }
              >
                {config.sms.enableStaticDevOtp ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">زمان انقضای کد OTP (ثانیه):</label>
              <input
                type="number"
                value={config.sms.otpExpirySeconds}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    sms: { ...config.sms, otpExpirySeconds: Number(e.target.value) || 120 },
                  })
                }
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">حداکثر تلاش مجاز قبل از قفل:</label>
              <input
                type="number"
                value={config.sms.maxVerifyAttempts}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    sms: { ...config.sms, maxVerifyAttempts: Number(e.target.value) || 5 },
                  })
                }
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("sms")}
              className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره تنظیمات پیامک</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SITE CMS */}
      {activeTab === "CMS" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900">مدیریت محتوای متنی و برندینگ سایت (CMS)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تغییر زنده متون تیتر اصلی صفحه اول، بج، توضیحات فوتر و اطلاعات تماس بدون دست زدن به سورس‌کد
            </p>
          </div>

          {/* Live Preview Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block">پیش‌نمایش زنده در صفحه اول (Hero Preview):</span>
            <div className="space-y-2 text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                {config.cms.heroBadgeText}
              </span>
              <h3 className="text-lg font-black text-slate-900">{config.cms.heroHeadline}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{config.cms.heroSubtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">عنوان سئو و تب مرورگر (Site Title):</label>
              <input
                type="text"
                value={config.cms.siteTitle}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cms: { ...config.cms, siteTitle: e.target.value },
                  })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">متن بج بالای صفحه اول:</label>
              <input
                type="text"
                value={config.cms.heroBadgeText}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cms: { ...config.cms, heroBadgeText: e.target.value },
                  })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">متن دکمه اصلی شروع (Primary CTA):</label>
              <input
                type="text"
                value={config.cms.primaryCtaText}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cms: { ...config.cms, primaryCtaText: e.target.value },
                  })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">تیتر اصلی صفحه اول (Hero Headline):</label>
              <input
                type="text"
                value={config.cms.heroHeadline}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cms: { ...config.cms, heroHeadline: e.target.value },
                  })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">زیرعنوان توضیحی صفحه اول:</label>
              <textarea
                rows={2}
                value={config.cms.heroSubtitle}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cms: { ...config.cms, heroSubtitle: e.target.value },
                  })
                }
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">آیدی تلگرام پشتیبانی:</label>
              <input
                type="text"
                dir="ltr"
                value={config.cms.supportTelegram}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cms: { ...config.cms, supportTelegram: e.target.value },
                  })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-800 text-left"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">ایمیل پشتیبانی رسمی:</label>
              <input
                type="text"
                dir="ltr"
                value={config.cms.supportEmail}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cms: { ...config.cms, supportEmail: e.target.value },
                  })
                }
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-800 text-left"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("cms")}
              className="h-11 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره و انتشار متون در سایت</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: DEVELOPER & FEATURE FLAGS */}
      {activeTab === "DEVELOPER" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900">ابزارهای توسعه‌دهنده، سقف پلن رایگان و فیچرفلگ</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              کنترل حالت تعمیرات اضطراری، سقف گروه‌های رایگان و تنظیمات فنی پلتفرم
            </p>
          </div>

          {/* Feature Switches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-rose-950 block">حالت تعمیرات سامانه (Maintenance):</span>
                <span className="text-[11px] text-rose-800/80 block mt-0.5">
                  قطع دسترسی عمومی به اپلیکیشن جهت به‌روزرسانی دیتابیس
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    developer: { ...config.developer, maintenanceMode: !config.developer.maintenanceMode },
                  })
                }
              >
                {config.developer.maintenanceMode ? (
                  <ToggleRight className="w-9 h-9 text-rose-600" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-400" />
                )}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">مجوز ثبت‌نام کاربر جدید:</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  در صورت غیرفعال بودن، فقط کاربران ثبت‌نام‌شده می‌توانند لاگین کنند
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    developer: { ...config.developer, allowNewRegistrations: !config.developer.allowNewRegistrations },
                  })
                }
              >
                {config.developer.allowNewRegistrations ? (
                  <ToggleRight className="w-9 h-9 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-400" />
                )}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">ثبت لاگ‌های ممیزی امنیتی (Audit):</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  ردیابی تمام تراکنش‌ها، ویرایش اسناد و نشست‌ها در جدول ممیزی
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    developer: { ...config.developer, enableAuditLogs: !config.developer.enableAuditLogs },
                  })
                }
              >
                {config.developer.enableAuditLogs ? (
                  <ToggleRight className="w-9 h-9 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-400" />
                )}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">لاگ وبهوک‌های بانکی در ترمینال:</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  نمایش متادیتا و جزئیات تایید تراکنش در کنسول نود
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    developer: { ...config.developer, debugWebhookLogs: !config.developer.debugWebhookLogs },
                  })
                }
              >
                {config.developer.debugWebhookLogs ? (
                  <ToggleRight className="w-9 h-9 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Quota Limits for Free Tier */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-900 mb-3">محدودیت‌های پلن پایه رایگان (Tier Tuning):</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">سقف تعداد گروه‌های پلن رایگان:</label>
                <input
                  type="number"
                  value={config.developer.freeTierMaxGroups}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      developer: { ...config.developer, freeTierMaxGroups: Number(e.target.value) || 2 },
                    })
                  }
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">سقف تعداد صندوق مشترک در هر گروه رایگان:</label>
                <input
                  type="number"
                  value={config.developer.freeTierMaxFundsPerGroup}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      developer: { ...config.developer, freeTierMaxFundsPerGroup: Number(e.target.value) || 1 },
                    })
                  }
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("developer")}
              className="h-11 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره سوئیچ‌ها و محدودیت‌ها</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: MOBILE APP & MARKETS RELEASE */}
      {activeTab === "MOBILE" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                مدیریت انتشار نسخه موبایل، مارکت‌ها و فایل نصبی APK
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تنظیم شماره نسخه پایدار، لینک‌های کافه‌بازار و مایکت، قابلیت بروزرسانی اجباری (OTA) و مسیر دانلود مستقیم
              </p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("mobileApp")}
              className="h-9 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>ذخیره نسخه موبایل</span>
            </button>
          </div>

          {/* Status highlight badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-sky-700 block">نسخه فعال منتشرشده:</span>
                <span className="text-base font-black text-sky-950 mt-0.5 block" dir="ltr">
                  v{config.mobileApp?.latestVersionName || "2.5.0"}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 block">کد نسخه و بیلد (Build Code):</span>
                <span className="text-base font-black text-emerald-950 mt-0.5 block">
                  {toPersianDigits(config.mobileApp?.latestVersionCode || 25)}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-700 block">وضعیت آپدیت اجباری (OTA):</span>
                <span className="text-xs font-black text-amber-950 mt-1 block">
                  {config.mobileApp?.forceUpdate ? "فعال (مسدودسازی نسخه‌های زیر حد)" : "غیرفعال (بروزرسانی اختیاری)"}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-extrabold text-slate-900">مشخصات نسخه و سیاست بروزرسانی:</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">نام نسخه نمایشی (Version Name):</label>
                <input
                  type="text"
                  dir="ltr"
                  value={config.mobileApp?.latestVersionName || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      mobileApp: { ...config.mobileApp, latestVersionName: e.target.value },
                    })
                  }
                  placeholder="2.5.0"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                />
                <span className="text-[10px] text-slate-500">شماره نسخه نمایشی که کاربر در اپلیکیشن مشاهده می‌کند</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">کد عددی نسخه (Version Code):</label>
                <input
                  type="number"
                  dir="ltr"
                  value={config.mobileApp?.latestVersionCode || 25}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      mobileApp: { ...config.mobileApp, latestVersionCode: Number(e.target.value) || 25 },
                    })
                  }
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                />
                <span className="text-[10px] text-slate-500">عدد صحیح فزاینده (مطابق versionCode در گریدل اندروید)</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">حداقل نسخه مجاز (Min Required Code):</label>
                <input
                  type="number"
                  dir="ltr"
                  value={config.mobileApp?.minRequiredVersionCode || 20}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      mobileApp: { ...config.mobileApp, minRequiredVersionCode: Number(e.target.value) || 20 },
                    })
                  }
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                />
                <span className="text-[10px] text-slate-500">نسخه‌های کمتر از این مقدار، پیغام بروزرسانی اجباری دریافت می‌کنند</span>
              </div>
            </div>

            {/* Force Update Switch */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">اجبار کاربران به بروزرسانی (Force Update Mode):</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  در صورت فعال بودن، کاربران نسخه‌های پایین‌تر بدون ارتقا امکان ثبت تراکنش یا همگام‌سازی نخواهند داشت
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    mobileApp: { ...config.mobileApp, forceUpdate: !config.mobileApp?.forceUpdate },
                  })
                }
              >
                {config.mobileApp?.forceUpdate ? (
                  <ToggleRight className="w-9 h-9 text-rose-600 cursor-pointer" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-400 cursor-pointer" />
                )}
              </button>
            </div>

            {/* Release Title & Versioning Details */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700 block">عنوان اطلاعیه بروزرسانی (Release Title):</label>
              <input
                type="text"
                value={config.mobileApp?.releaseTitle || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    mobileApp: { ...config.mobileApp, releaseTitle: e.target.value },
                  })
                }
                placeholder="بروزرسانی بزرگ نئوبانک دنگ‌چی (نسخه ۲.۶.۰)"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
              />
            </div>

            {/* Technical Verification Info (File size, SHA256, OTA Build ID) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">حجم بسته نصبی (APK Size):</label>
                <input
                  type="text"
                  value={config.mobileApp?.apkFileSizeMb || "۱۴.۸ مگابایت"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      mobileApp: { ...config.mobileApp, apkFileSizeMb: e.target.value },
                    })
                  }
                  placeholder="۱۴.۸ مگابایت"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">کد اعتبارسنجی SHA-256:</label>
                <input
                  type="text"
                  dir="ltr"
                  value={config.mobileApp?.apkSha256 || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      mobileApp: { ...config.mobileApp, apkSha256: e.target.value },
                    })
                  }
                  placeholder="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">شناسه بیلد ابری وب (OTA Build ID):</label>
                <input
                  type="text"
                  dir="ltr"
                  value={config.mobileApp?.otaBuildId || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      mobileApp: { ...config.mobileApp, otaBuildId: e.target.value },
                    })
                  }
                  placeholder="dc-build-2026-11-15-v26"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Release Notes */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700 block">یادداشت تغییرات و امکانات نسخه جدید (Release Notes):</label>
              <textarea
                rows={3}
                value={config.mobileApp?.releaseNotes || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    mobileApp: { ...config.mobileApp, releaseNotes: e.target.value },
                  })
                }
                placeholder="تغییرات این نسخه: بازطراحی رابط نئوبانک، کیپد لمسی عددی، تولید خودکار فایل APK..."
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 leading-relaxed"
              />
              <span className="text-[10px] text-slate-500">این توضیحات در مودال نوتیفیکیشن آپدیت اپ موبایل نمایش داده می‌شود</span>
            </div>

            {/* Distribution URLs */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-900 mb-3">آدرس‌های انتشار و مارکت‌های ایرانی:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">مسیر یا لینک دانلود مستقیم فایل APK:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={config.mobileApp?.directApkUrl || "/api/apk/download"}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        mobileApp: { ...config.mobileApp, directApkUrl: e.target.value },
                      })
                    }
                    placeholder="/api/apk/download"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">لینک صفحه برنامه در کافه‌بازار (Cafe Bazaar):</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={config.mobileApp?.cafeBazaarUrl || ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        mobileApp: { ...config.mobileApp, cafeBazaarUrl: e.target.value },
                      })
                    }
                    placeholder="https://cafebazaar.ir/app/ir.dongchi.app"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">لینک صفحه برنامه در مایکت (Myket):</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={config.mobileApp?.myketUrl || ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        mobileApp: { ...config.mobileApp, myketUrl: e.target.value },
                      })
                    }
                    placeholder="https://myket.ir/app/ir.dongchi.app"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">لینک سیب‌اپ یا نسخه iOS (SibApp):</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={config.mobileApp?.sibAppUrl || ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        mobileApp: { ...config.mobileApp, sibAppUrl: e.target.value },
                      })
                    }
                    placeholder="https://sibapp.com/applications/dongchi"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Quick Testing Actions */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-900 mb-2">تست سریع سرویس‌های موبایل و دانلود:</h3>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/api/app-version"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>تست خروجی JSON وب‌سرویس /api/app-version</span>
                </a>

                <a
                  href="/api/apk/download"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-sky-600" />
                  <span>تست دانلود مستقیم فایل APK از سرور</span>
                </a>

                <a
                  href="/app/install"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>مشاهده صفحه لندینگ نصب اپلیکیشن (/app/install)</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              با کلیک روی انتشار، نسخه جدید ذخیره شده و اعلان درون‌برنامه‌ای به کاربران ارسال می‌شود.
            </span>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                disabled={saving || broadcastingUpdate}
                onClick={() => handleSave("mobileApp")}
                className="h-11 px-5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold inline-flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره بدون اعلان</span>
              </button>

              <button
                type="button"
                disabled={saving || broadcastingUpdate}
                onClick={handleBroadcastRelease}
                className="h-11 px-6 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {broadcastingUpdate ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال انتشار و ارسال اعلان...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>🚀 انتشار نسخه جدید و ارسال اعلان درون‌برنامه‌ای</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
