import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { getSystemConfig } from '@/lib/system-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let storageStatus = 'ok';

  // 1. Verify Database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = `error: ${err.message || 'database unreachable'}`;
  }

  // 2. Verify Storage & Data Directory write access
  const dataDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const testFile = path.join(dataDir, '.health_check.tmp');
    fs.writeFileSync(testFile, 'ok', 'utf-8');
    fs.unlinkSync(testFile);
    storageStatus = 'writable';
  } catch {
    storageStatus = 'read-only-or-error';
  }

  // 3. Read current runtime configuration
  const config = getSystemConfig();
  const versionName = config.mobileApp?.latestVersionName || '2.6.0';
  const p2pSettlementEnabled = Boolean(config.payment?.enableP2pGatewaySettlement);

  const isHealthy = dbStatus === 'connected' && storageStatus === 'writable';

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      database: dbStatus,
      storage: storageStatus,
      versionName,
      versionCode: config.mobileApp?.latestVersionCode || 26,
      p2pSettlementEnabled,
      activePaymentProvider: config.payment?.activeProvider || 'MOCK_SHAPARAK',
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    },
    { status: isHealthy ? 200 : 503 }
  );
}
