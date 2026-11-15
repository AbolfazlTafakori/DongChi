import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getAppVersionHandler } from '../app/api/app-version/route';
import { GET as getApkDownloadHandler } from '../app/api/apk/download/route';
import { GET as getHealthHandler } from '../app/api/health/route';
import { POST as p2pInitiateHandler } from '../app/api/groups/[groupId]/settlements/p2p-initiate/route';
import { POST as p2pVerifyHandler } from '../app/api/groups/[groupId]/settlements/p2p-verify/route';
import { validateIranianSheba, formatSheba } from '../lib/money';
import { checkLedgerZeroSumIntegrity } from '../lib/accounting/balance-engine';
import {
  createP2pPaymentIntent,
  getP2pPaymentIntent,
  completeP2pPaymentIntent,
} from '../lib/p2p-settlement-store';
import * as authGuard from '../lib/auth-guard';
import * as systemConfig from '../lib/system-config';
import { prisma } from '../lib/prisma';

describe('In-App Auto-Updater, P2P FinTech & Zero-Sum Ledger Engine Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. In-App Version & Update Detection Engine (/api/app-version)', () => {
    it('should detect hasNativeUpdate=true when clientVersionCode is less than latestVersionCode', async () => {
      const req = new NextRequest('http://localhost:3000/api/app-version?clientVersionCode=24');
      const res = await getAppVersionHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.hasNativeUpdate).toBe(true);
      expect(json.versionCode).toBe(26);
      expect(json.versionName).toBe('2.6.0');
      expect(json.releaseTitle).toBeDefined();
      expect(Array.isArray(json.releaseNotesList)).toBe(true);
      expect(json.releaseNotesList.length).toBeGreaterThan(0);
      expect(json.markets.cafeBazaarUrl).toBeDefined();
      expect(json.markets.myketUrl).toBeDefined();
      expect(json.markets.sibAppUrl).toBeDefined();
    });

    it('should trigger isForceUpdate=true when clientVersionCode is lower than minRequiredVersionCode', async () => {
      const req = new NextRequest('http://localhost:3000/api/app-version?clientVersionCode=10');
      const res = await getAppVersionHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.hasNativeUpdate).toBe(true);
      expect(json.isForceUpdate).toBe(true);
    });

    it('should report hasNativeUpdate=false when client is on latest version', async () => {
      const req = new NextRequest('http://localhost:3000/api/app-version?clientVersionCode=26');
      const res = await getAppVersionHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.hasNativeUpdate).toBe(false);
      expect(json.isForceUpdate).toBe(false);
    });
  });

  describe('2. Streaming APK Download Package (/api/apk/download)', () => {
    it('should serve valid Android APK with proper MIME type, filename, and Content-Length', async () => {
      const res = await getApkDownloadHandler();
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/vnd.android.package-archive');
      expect(res.headers.get('content-disposition')).toContain('.apk');
      expect(res.headers.get('content-length')).toBeDefined();
      expect(res.headers.get('x-apk-sha256')).toBeDefined();
    });
  });

  describe('3. Production Health Telemetry Endpoint (/api/health)', () => {
    it('should report database connection and healthy system status', async () => {
      vi.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([{ '?column?': 1 }] as any);

      const res = await getHealthHandler();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe('healthy');
      expect(json.database).toBe('connected');
      expect(json.storage).toBe('writable');
      expect(json.versionName).toBeDefined();
      expect(typeof json.uptimeSeconds).toBe('number');
    });
  });

  describe('4. Iranian IBAN (Sheba) Validation & Formatting', () => {
    it('should validate genuine Iranian Sheba with correct ISO 7064 Mod 97-10 check', () => {
      // Valid Sheba with correct check digits (27):
      const validSheba = 'IR270170000000100324200001';
      expect(validateIranianSheba(validSheba)).toBe(true);

      // Invalid checksum
      const invalidSheba = 'IR280170000000100324200001';
      expect(validateIranianSheba(invalidSheba)).toBe(false);

      // Wrong length
      expect(validateIranianSheba('IR12345')).toBe(false);
      expect(validateIranianSheba(null)).toBe(false);
    });

    it('should format Sheba into 4-character blocks', () => {
      const formatted = formatSheba('IR270170000000100324200001');
      expect(formatted).toContain('IR');
      expect(formatted).toBe('IR 2701 7000 0000 1003 2420 0001');
    });
  });

  describe('5. Zero-Sum Ledger Integrity Check Engine', () => {
    it('should return isValid=true when sum of debts and credits perfectly balance out', () => {
      const memberBalances = [
        { userId: 'user-1', netBalance: 50000n }, // Creditor +50,000
        { userId: 'user-2', netBalance: -30000n }, // Debtor -30,000
        { userId: 'user-3', netBalance: -20000n }, // Debtor -20,000
      ];

      const result = checkLedgerZeroSumIntegrity(memberBalances, []);
      expect(result.isValid).toBe(true);
      expect(result.discrepancy).toBe(0n);
      expect(result.totalCredits).toBe(50000n);
      expect(result.totalDebits).toBe(50000n);
    });

    it('should account for house funds balance in zero-sum ledger', () => {
      const memberBalances = [
        { userId: 'user-1', netBalance: 100000n }, // Creditor +100,000
        { userId: 'user-2', netBalance: -40000n }, // Debtor -40,000
      ];
      const funds = [{ currentBalance: 60000n }]; // Shared house fund +60,000

      const result = checkLedgerZeroSumIntegrity(memberBalances, funds);
      expect(result.isValid).toBe(true);
      expect(result.discrepancy).toBe(0n);
      expect(result.fundsBalance).toBe(60000n);
    });

    it('should flag discrepancy if financial leakage exists', () => {
      const leakedBalances = [
        { userId: 'user-1', netBalance: 50000n },
        { userId: 'user-2', netBalance: -40000n }, // Leakage of 10,000
      ];

      const result = checkLedgerZeroSumIntegrity(leakedBalances, []);
      expect(result.isValid).toBe(false);
      expect(result.discrepancy).toBe(10000n);
    });
  });

  describe('6. Dual-Mode P2P Settlement Backend & Idempotency Guard', () => {
    it('should block P2P initiate in Phase 1 Pure Accounting Mode (enableP2pGatewaySettlement=false)', async () => {
      vi.spyOn(authGuard, 'getCurrentSession').mockResolvedValueOnce({
        userId: 'user-payer',
        phone: '09121111111',
        role: 'MEMBER',
      } as any);

      vi.spyOn(systemConfig, 'getSystemConfig').mockReturnValueOnce({
        ...systemConfig.DEFAULT_SYSTEM_CONFIG,
        payment: {
          ...systemConfig.DEFAULT_SYSTEM_CONFIG.payment,
          enableP2pGatewaySettlement: false, // Phase 1 Mode
        },
      });

      const req = new NextRequest(
        'http://localhost:3000/api/groups/group-123/settlements/p2p-initiate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toUserId: 'user-payee',
            amount: '250000',
          }),
        }
      );

      const res = await p2pInitiateHandler(req, { params: { groupId: 'group-123' } });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain('تسویه آنلاین از طریق درگاه در حال حاضر غیرفعال است');
    });

    it('should initiate P2P intent and return paymentUrl in Phase 2 FinTech Mode', async () => {
      vi.spyOn(authGuard, 'getCurrentSession').mockResolvedValueOnce({
        userId: 'user-payer',
        phone: '09121111111',
        role: 'MEMBER',
      } as any);

      vi.spyOn(systemConfig, 'getSystemConfig').mockReturnValueOnce({
        ...systemConfig.DEFAULT_SYSTEM_CONFIG,
        payment: {
          ...systemConfig.DEFAULT_SYSTEM_CONFIG.payment,
          enableP2pGatewaySettlement: true, // Phase 2 Mode
          p2pCommissionPercent: 0,
        },
      });

      vi.spyOn(prisma.groupMember, 'findUnique')
        .mockResolvedValueOnce({
          id: 'gm-1',
          groupId: 'group-123',
          userId: 'user-payer',
        } as any)
        .mockResolvedValueOnce({
          id: 'gm-2',
          groupId: 'group-123',
          userId: 'user-payee',
          user: { id: 'user-payee', name: 'علی محمدی', phone: '09122222222' },
        } as any);

      const req = new NextRequest(
        'http://localhost:3000/api/groups/group-123/settlements/p2p-initiate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toUserId: 'user-payee',
            amount: '350000',
            idempotencyKey: 'idem_test_key_001',
          }),
        }
      );

      const res = await p2pInitiateHandler(req, { params: { groupId: 'group-123' } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.authority).toBeDefined();
      expect(json.paymentUrl).toContain('/p2p-gateway?authority=');
    });

    it('should enforce idempotency by returning existing intent on duplicate submission within 30s', () => {
      const intent1 = createP2pPaymentIntent({
        idempotencyKey: 'idem_duplicate_test_123',
        groupId: 'grp-1',
        fromUserId: 'u-1',
        toUserId: 'u-2',
        creditorName: 'رضا',
        amount: '150000',
      });

      const intent2 = createP2pPaymentIntent({
        idempotencyKey: 'idem_duplicate_test_123',
        groupId: 'grp-1',
        fromUserId: 'u-1',
        toUserId: 'u-2',
        creditorName: 'رضا',
        amount: '150000',
      });

      expect(intent1.authority).toBe(intent2.authority);
    });

    it('should verify P2P settlement and record it in Prisma transaction', async () => {
      vi.spyOn(authGuard, 'getCurrentSession').mockResolvedValueOnce({
        userId: 'u-1',
        phone: '09121111111',
        role: 'MEMBER',
      } as any);

      const testIntent = createP2pPaymentIntent({
        groupId: 'grp-verify',
        fromUserId: 'u-1',
        toUserId: 'u-2',
        creditorName: 'سارا',
        amount: '400000',
      });

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          settlement: {
            create: vi.fn().mockResolvedValue({
              id: 'settle-999',
              groupId: 'grp-verify',
              fromUserId: 'u-1',
              toUserId: 'u-2',
              amount: 400000n,
              note: 'تسویه مستقیم آنلاین',
              settledAt: new Date(),
              fromUser: { id: 'u-1', name: 'علی', phone: '09121111111' },
              toUser: { id: 'u-2', name: 'سارا', phone: '09123333333' },
            }),
          },
          auditLog: {
            create: vi.fn().mockResolvedValue({ id: 'audit-999' }),
          },
        };
        return callback(txMock);
      });

      const req = new NextRequest(
        'http://localhost:3000/api/groups/grp-verify/settlements/p2p-verify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authority: testIntent.authority,
            status: 'OK',
          }),
        }
      );

      const res = await p2pVerifyHandler(req, { params: { groupId: 'grp-verify' } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.refId).toBeDefined();

      const updatedIntent = getP2pPaymentIntent(testIntent.authority);
      expect(updatedIntent?.status).toBe('COMPLETED');
    });
  });
});
