import { describe, it, expect, vi, beforeEach } from "vitest";

// Set sandbox environment for testing
process.env.ZARINPAL_MERCHANT_ID = "sandbox";

import {
  isSandboxMode,
  requestPayment,
  verifyPayment,
  processPaymentCallback,
} from "../lib/payment/gateway";

describe("Phase 5: Payment Gateway, Idempotency & Stackable Renewal", () => {
  describe("Sandbox Mode Detection & Payment Request", () => {
    it("should detect sandbox mode when merchant id is sandbox or unset", () => {
      expect(isSandboxMode()).toBe(true);
    });

    it("should generate a valid SBX_ authority and local paymentUrl in sandbox mode", async () => {
      const result = await requestPayment({
        amountToman: 49000n,
        description: "تست خرید اشتراک ماهانه",
        callbackUrl: "http://localhost:3000/app/payment/callback",
        mobile: "09120000000",
      });

      expect(result.authority.startsWith("SBX_")).toBe(true);
      expect(result.paymentUrl).toContain("/app/payment/sandbox?authority=" + result.authority);
    });

    it("should verify SBX_ authorities and generate 9-digit numeric refId", async () => {
      const valid = await verifyPayment({
        authority: "SBX_abcdef1234567890abcdef12",
        amountToman: 49000n,
      });

      expect(valid.verified).toBe(true);
      expect(valid.refId).toBeDefined();
      expect(valid.refId?.length).toBe(9);

      const invalid = await verifyPayment({
        authority: "INVALID_AUTH",
        amountToman: 49000n,
      });

      expect(invalid.verified).toBe(false);
      expect(invalid.refId).toBeNull();
    });
  });

  describe("processPaymentCallback with In-Memory Mock Transaction DB", () => {
    // In-memory state
    let mockTx: any;
    let mockSubscriptions: any[];
    let mockPrisma: any;

    beforeEach(() => {
      mockTx = {
        id: "tx_123",
        userId: "user_buyer",
        planId: "plan_monthly",
        amount: 49000n,
        authority: "SBX_test_authority_unique",
        refId: null,
        status: "PENDING",
        plan: {
          id: "plan_monthly",
          title: "حرفه‌ای ماهانه",
          durationDays: 30,
          price: 49000n,
        },
      };

      mockSubscriptions = [];

      mockPrisma = {
        $transaction: async (cb: any) => {
          return await cb({
            transaction: {
              findUnique: vi.fn(async ({ where }: any) => {
                if (where.authority === mockTx.authority) return mockTx;
                return null;
              }),
              update: vi.fn(async ({ where, data }: any) => {
                Object.assign(mockTx, data);
                return mockTx;
              }),
            },
            subscription: {
              findFirst: vi.fn(async ({ where }: any) => {
                const now = new Date();
                const found = mockSubscriptions
                  .filter((s) => s.userId === where.userId && s.status === "ACTIVE")
                  .find((s) => !where.expiresAt?.gt || s.expiresAt > where.expiresAt.gt);
                return found || null;
              }),
              create: vi.fn(async ({ data }: any) => {
                const sub = {
                  id: "sub_" + Math.random(),
                  ...data,
                };
                mockSubscriptions.push(sub);
                return sub;
              }),
              update: vi.fn(async ({ where, data }: any) => {
                const sub = mockSubscriptions.find((s) => s.id === where.id);
                if (sub) {
                  Object.assign(sub, data);
                }
                return sub;
              }),
            },
          });
        },
      };
    });

    it("should successfully verify first payment, set SUCCESS and create 30-day subscription", async () => {
      const result = await processPaymentCallback(
        {
          authority: "SBX_test_authority_unique",
          status: "OK",
        },
        mockPrisma as any
      );

      expect(result.success).toBe(true);
      expect(result.alreadyVerified).toBe(false);
      expect(result.refId).toBeDefined();
      expect(mockTx.status).toBe("SUCCESS");
      expect(mockSubscriptions).toHaveLength(1);

      const sub = mockSubscriptions[0];
      expect(sub.status).toBe("ACTIVE");
      const durationDays = Math.round(
        (sub.expiresAt.getTime() - sub.startsAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(durationDays).toBe(30);
    });

    it("IDEMPOTENCY TEST: second callback with same authority must NOT add extra days", async () => {
      // 1. First verification
      const res1 = await processPaymentCallback(
        { authority: "SBX_test_authority_unique", status: "OK" },
        mockPrisma as any
      );
      expect(res1.success).toBe(true);
      expect(res1.alreadyVerified).toBe(false);

      const firstExpiry = mockSubscriptions[0].expiresAt;

      // 2. Second verification (simulating browser reload on callback page)
      const res2 = await processPaymentCallback(
        { authority: "SBX_test_authority_unique", status: "OK" },
        mockPrisma as any
      );

      expect(res2.success).toBe(true);
      expect(res2.alreadyVerified).toBe(true);
      expect(res2.refId).toBe(mockTx.refId);
      // Expiration MUST NOT change
      expect(mockSubscriptions[0].expiresAt.getTime()).toBe(firstExpiry.getTime());
      // No duplicate subscription created
      expect(mockSubscriptions).toHaveLength(1);
    });

    it("STACKABLE RENEWAL: purchasing 30 days while 15 days remain adds 30 days to existing expiry", async () => {
      const now = new Date();
      // Pre-seed an existing active subscription expiring in 15 days
      const existingExpiry = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      mockSubscriptions.push({
        id: "existing_sub_1",
        userId: "user_buyer",
        status: "ACTIVE",
        startsAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        expiresAt: existingExpiry,
        planId: "plan_monthly",
      });

      // Buy another 30-day plan
      const result = await processPaymentCallback(
        { authority: "SBX_test_authority_unique", status: "OK" },
        mockPrisma as any
      );

      expect(result.success).toBe(true);
      // Stackable renewal: 15 days existing + 30 days new = 45 days from now
      const finalExpiry = result.expiresAt!;
      const totalRemainingDays = Math.round(
        (finalExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(totalRemainingDays).toBe(45);
      // Existing subscription date was extended
      expect(mockSubscriptions[0].expiresAt.getTime()).toBe(finalExpiry.getTime());
    });

    it("CANCELED / FAILED: user cancel (status=NOK) marks transaction as FAILED without granting Pro", async () => {
      const result = await processPaymentCallback(
        { authority: "SBX_test_authority_unique", status: "NOK" },
        mockPrisma as any
      );

      expect(result.success).toBe(false);
      expect(result.alreadyVerified).toBe(false);
      expect(mockTx.status).toBe("FAILED");
      expect(mockSubscriptions).toHaveLength(0);
    });
  });
});
