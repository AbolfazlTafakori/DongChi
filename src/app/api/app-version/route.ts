import { NextRequest, NextResponse } from 'next/server';
import { getSystemConfig } from '@/lib/system-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const config = getSystemConfig();
    const mobile = config.mobileApp;

    const { searchParams } = new URL(request.url);
    const clientVersionCodeParam = searchParams.get('clientVersionCode');
    const clientBuildId = searchParams.get('clientBuildId');

    const parsedClientVersionCode = clientVersionCodeParam
      ? parseInt(clientVersionCodeParam, 10)
      : undefined;

    const hasNativeUpdate =
      parsedClientVersionCode !== undefined
        ? parsedClientVersionCode < mobile.latestVersionCode
        : false;

    const isForceUpdate =
      mobile.forceUpdate ||
      (parsedClientVersionCode !== undefined
        ? parsedClientVersionCode < mobile.minRequiredVersionCode
        : false);

    const hasOtaWebUpdate = Boolean(clientBuildId && clientBuildId !== mobile.otaBuildId);
    const releaseNotesList = (mobile.releaseNotes || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    return NextResponse.json({
      versionName: mobile.latestVersionName,
      versionCode: mobile.latestVersionCode,
      minRequiredVersionCode: mobile.minRequiredVersionCode,
      forceUpdate: mobile.forceUpdate,
      releaseTitle:
        mobile.releaseTitle || `بروزرسانی جدید دنگ‌چی (نسخه ${mobile.latestVersionName})`,
      releaseNotes: mobile.releaseNotes,
      releaseNotesList,
      apkFileSizeMb: mobile.apkFileSizeMb || '۱۴.۸ مگابایت',
      apkSha256: mobile.apkSha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      directApkUrl: mobile.directApkUrl || '/api/apk/download',
      markets: {
        cafeBazaarUrl: mobile.cafeBazaarUrl,
        myketUrl: mobile.myketUrl,
        sibAppUrl: mobile.sibAppUrl,
      },
      otaBuildId: mobile.otaBuildId,
      hasNativeUpdate,
      isForceUpdate,
      hasOtaWebUpdate,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('GET /api/app-version error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت وضعیت نسخه اپلیکیشن', details: error.message },
      { status: 500 }
    );
  }
}
