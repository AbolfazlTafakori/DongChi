import React from 'react';
import { Metadata } from 'next';
import { getSystemConfig } from '@/lib/system-config';
import { getSession } from '@/lib/session';
import AppDownloadShowcase from '@/components/marketing/AppDownloadShowcase';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'دانلود اپلیکیشن موبایل دنگ‌چی | اندروید (APK) و iOS',
  description:
    'دانلود مستقیم اپلیکیشن دنگ‌چی برای اندروید و آیفون؛ حسابداری هوشمند خانه و هم‌خانه‌ها با قابلیت همگام‌سازی ابری و کارکرد آفلاین.',
};

export default async function PublicDownloadPage() {
  const session = await getSession();
  const config = getSystemConfig();
  const mobile = config.mobileApp || {
    latestVersionName: '2.5.0',
    latestVersionCode: 25,
    releaseNotes: 'نسخه نئوبانک دنگ‌چی با همگام‌سازی لحظه‌ای ابری',
    directApkUrl: '/api/apk/download',
    cafeBazaarUrl: 'https://cafebazaar.ir/app/ir.dongchi.app',
    myketUrl: 'https://myket.ir/app/ir.dongchi.app',
    sibAppUrl: 'https://sibapp.com/applications/dongchi',
  };

  return (
    <AppDownloadShowcase
      versionInfo={{
        versionName: mobile.latestVersionName,
        versionCode: mobile.latestVersionCode,
        releaseNotes: mobile.releaseNotes,
        directApkUrl: mobile.directApkUrl,
        markets: {
          cafeBazaarUrl: mobile.cafeBazaarUrl,
          myketUrl: mobile.myketUrl,
          sibAppUrl: mobile.sibAppUrl,
        },
      }}
      isAuthenticated={Boolean(session)}
    />
  );
}
