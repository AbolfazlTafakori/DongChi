export interface PaymentGatewayConfig {
  activeProvider: 'MOCK_SHAPARAK' | 'ZARINPAL' | 'ZIBAL' | 'IDPAY';
  sandboxMode: boolean;
  merchantId: string;
  callbackBaseUrl: string;
  vatPercent: number;
  allowPayments: boolean;
  enableP2pGatewaySettlement: boolean; // Phase 2: Direct Online P2P Debt Payment via Gateway
  p2pCommissionPercent: number; // Default: 0
  p2pSettlementMode: 'SPLIT_SHAPARAK' | 'ESCROW_PAYA'; // Default: SPLIT_SHAPARAK
}

export interface SmsProviderConfig {
  activeProvider: 'LOCAL_DEV' | 'KAVENEGAR' | 'MELIPAYAMAK' | 'FARAZSMS' | 'SMSIR';
  apiKey: string;
  senderLine: string;
  otpPatternCode: string;
  enableStaticDevOtp: boolean;
  staticDevOtpCode: string;
  otpExpirySeconds: number;
  maxVerifyAttempts: number;
}

export interface SiteCmsConfig {
  siteTitle: string;
  heroBadgeText: string;
  heroHeadline: string;
  heroSubtitle: string;
  primaryCtaText: string;
  footerTagline: string;
  supportTelegram: string;
  supportEmail: string;
  supportPhone: string;
}

export interface DeveloperFlagsConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowNewRegistrations: boolean;
  freeTierMaxGroups: number;
  freeTierMaxFundsPerGroup: number;
  enableAuditLogs: boolean;
  debugWebhookLogs: boolean;
}

export interface MobileAppReleaseConfig {
  latestVersionName: string; // e.g. "2.6.0"
  latestVersionCode: number; // e.g. 26
  minRequiredVersionCode: number; // e.g. 24 (if client versionCode < minRequiredVersionCode -> FORCE UPDATE!)
  forceUpdate: boolean; // Master switch for mandatory lock-screen update
  releaseTitle: string; // e.g. "بروزرسانی بزرگ نئوبانک دنگ‌چی (نسخه ۲.۶.۰)"
  releaseNotes: string; // Newline-separated changelog items
  apkFileSizeMb: string; // e.g. "۱۴.۸ مگابایت"
  apkSha256: string; // Checksum for security verification
  directApkUrl: string; // "/api/apk/download"
  cafeBazaarUrl: string; // "https://cafebazaar.ir/app/ir.dongchi.app"
  myketUrl: string; // "https://myket.ir/app/ir.dongchi.app"
  sibAppUrl: string; // "https://sibapp.com/applications/dongchi"
  otaBuildId: string; // Unique build hash for instant PWA/WebView cache refresh
}

export interface PlatformSystemConfig {
  payment: PaymentGatewayConfig;
  sms: SmsProviderConfig;
  cms: SiteCmsConfig;
  developer: DeveloperFlagsConfig;
  mobileApp: MobileAppReleaseConfig;
  updatedAt: string;
}

export const DEFAULT_SYSTEM_CONFIG: PlatformSystemConfig = {
  payment: {
    activeProvider: 'MOCK_SHAPARAK',
    sandboxMode: true,
    merchantId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    callbackBaseUrl: 'http://localhost:3000',
    vatPercent: 0,
    allowPayments: true,
    enableP2pGatewaySettlement: false, // Default: Phase 1 Pure Accounting Mode
    p2pCommissionPercent: 0,
    p2pSettlementMode: 'SPLIT_SHAPARAK',
  },
  sms: {
    activeProvider: 'LOCAL_DEV',
    apiKey: 'kv_live_xxxxxxxxxxxxxxxxxxxxxxxx',
    senderLine: '10008663',
    otpPatternCode: 'dongchi-otp-verify',
    enableStaticDevOtp: true,
    staticDevOtpCode: '12345',
    otpExpirySeconds: 120,
    maxVerifyAttempts: 5,
  },
  cms: {
    siteTitle: 'دنگ‌چی | سامانه هوشمند حسابداری و دنگ خانه',
    heroBadgeText: 'نسل جدید مدیریت مالی خانه، هم‌خانه‌ها و سفر',
    heroHeadline: 'مدیریت هوشمند خرج‌های خانه، بدون استرس و خطای حساب',
    heroSubtitle:
      'با دنگ‌بندی ۴ حالته بدون خطای ریالی، مدیریت کارت مشترک خانه و تسویه هوشمند با کمترین تراکنش، صمیمیت و شفافیت مالی را به جمع خود بیاورید.',
    primaryCtaText: 'ساخت گروه رایگان',
    footerTagline:
      'دنگ‌چی نسل جدید ابزارهای مالی خانواده، هم‌خانه‌ها و سفرهای گروهی با موتور محاسبات دقیق BigInt است.',
    supportTelegram: '@DongChiSupport',
    supportEmail: 'support@dongchi.ir',
    supportPhone: '۰۲۱-۹۱۰۰۱۲۳۴',
  },
  developer: {
    maintenanceMode: false,
    maintenanceMessage: 'سامانه در حال بروزرسانی زیرساخت مالی است. تا دقایقی دیگر بازمی‌گردیم.',
    allowNewRegistrations: true,
    freeTierMaxGroups: 2,
    freeTierMaxFundsPerGroup: 1,
    enableAuditLogs: true,
    debugWebhookLogs: true,
  },
  mobileApp: {
    latestVersionName: '2.6.0',
    latestVersionCode: 26,
    minRequiredVersionCode: 24,
    forceUpdate: false,
    releaseTitle: 'بروزرسانی بزرگ نئوبانک دنگ‌چی (نسخه ۲.۶.۰)',
    releaseNotes:
      'موتور بروزرسانی درون‌برنامه‌ای با دانلودر پیشرفته و درصد زنده\nتسویه مستقیم دوطرفه از طریق درگاه شاپرک (فاز ۲ فین‌تک)\nکیبورد عددی لمسی با بازخورد لرزشی و سرعت پردازش زیر ۵۰ میلی‌ثانیه\nبهبود الگوریتم ممیزی تراز کل و امنیت تراکنش‌ها با قفل Idempotency',
    apkFileSizeMb: '۱۴.۸ مگابایت',
    apkSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    directApkUrl: '/api/apk/download',
    cafeBazaarUrl: 'https://cafebazaar.ir/app/ir.dongchi.app',
    myketUrl: 'https://myket.ir/app/ir.dongchi.app',
    sibAppUrl: 'https://sibapp.com/applications/dongchi',
    otaBuildId: 'dc-build-2026-11-15-v26',
  },
  updatedAt: new Date().toISOString(),
};
