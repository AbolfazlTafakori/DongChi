import { prisma } from "@/lib/prisma";
import { TxStatus, SubStatus, PrismaClient } from "@prisma/client";

export interface PaymentRequestParams {
  amountToman: bigint;
  description: string;
  callbackUrl: string;
  mobile?: string;
}

export interface PaymentRequestResult {
  authority: string;
  paymentUrl: string;
}

export interface PaymentVerifyParams {
  authority: string;
  amountToman: bigint;
}

export interface PaymentVerifyResult {
  verified: boolean;
  refId: string | null;
}

export interface PaymentCallbackProcessResult {
  success: boolean;
  alreadyVerified: boolean;
  refId?: string;
  expiresAt?: Date | null;
  subscription?: any;
  message?: string;
}

/**
 * Checks whether the payment system is operating in Local Sandbox mode.
 */
export function isSandboxMode(): boolean {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID;
  return (
    !merchantId ||
    merchantId.toLowerCase() === "sandbox" ||
    merchantId.trim().length < 10
  );
}

/**
 * Initiates a payment request with either the Sandbox Simulator or live Zarinpal gateway.
 */
export async function requestPayment(
  params: PaymentRequestParams
): Promise<PaymentRequestResult> {
  const { amountToman, description, callbackUrl, mobile } = params;

  if (isSandboxMode()) {
    // Generate deterministic & unique Sandbox authority
    const randomHex = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    const authority = `SBX_${randomHex}`;
    return {
      authority,
      paymentUrl: `/app/payment/sandbox?authority=${authority}`,
    };
  }

  // Live Zarinpal v4 Request
  const merchantId = process.env.ZARINPAL_MERCHANT_ID!;
  const response = await fetch("https://payment.zarinpal.com/pg/v4/payment/request.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      merchant_id: merchantId,
      amount: Number(amountToman), // In Tomans (currency: 'IRT')
      currency: "IRT",
      description,
      callback_url: callbackUrl,
      metadata: mobile ? { mobile } : {},
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (data?.data?.code === 100 && data?.data?.authority) {
    const authority = data.data.authority;
    return {
      authority,
      paymentUrl: `https://payment.zarinpal.com/pg/StartPay/${authority}`,
    };
  }

  throw new Error(
    data?.errors?.message || "خطا در برقراری ارتباط با درگاه پرداخت بانکی."
  );
}

/**
 * Verifies payment authority with either the Sandbox Simulator or live Zarinpal gateway.
 */
export async function verifyPayment(
  params: PaymentVerifyParams
): Promise<PaymentVerifyResult> {
  const { authority, amountToman } = params;

  if (isSandboxMode()) {
    // Sandbox authorities starting with SBX_ are automatically valid
    if (authority && authority.startsWith("SBX_")) {
      const pseudoRefId = String(
        Math.floor(100000000 + Math.random() * 900000000)
      );
      return {
        verified: true,
        refId: pseudoRefId,
      };
    }
    return { verified: false, refId: null };
  }

  // Live Zarinpal v4 Verification
  const merchantId = process.env.ZARINPAL_MERCHANT_ID!;
  const response = await fetch("https://payment.zarinpal.com/pg/v4/payment/verify.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      merchant_id: merchantId,
      amount: Number(amountToman),
      currency: "IRT",
      authority,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (data?.data?.code === 100 || data?.data?.code === 101) {
    return {
      verified: true,
      refId: String(data.data.ref_id),
    };
  }

  return { verified: false, refId: null };
}

/**
 * Idempotent, Atomic Payment Callback Processor:
 * 1. Checks transaction existence and idempotency.
 * 2. If already SUCCESS or FAILED, safely returns without double-crediting.
 * 3. Verifies bank payment.
 * 4. Implements Stackable Renewal: adds durationDays to the existing expiry date
 *    if the user already holds an active subscription.
 */
export async function processPaymentCallback(
  params: {
    authority: string;
    status: string;
  },
  db: PrismaClient = prisma
): Promise<PaymentCallbackProcessResult> {
  const { authority, status } = params;

  return await db.$transaction(async (txDb) => {
    // 1. Look up transaction
    const tx = await txDb.transaction.findUnique({
      where: { authority },
      include: {
        plan: true,
      },
    });

    if (!tx) {
      throw new Error("NOT_FOUND");
    }

    // 2. Idempotency Guards
    if (tx.status === TxStatus.SUCCESS) {
      const activeSub = await txDb.subscription.findFirst({
        where: {
          userId: tx.userId,
          status: SubStatus.ACTIVE,
        },
        include: { plan: true },
        orderBy: { expiresAt: "desc" },
      });

      return {
        success: true,
        alreadyVerified: true,
        refId: tx.refId || "",
        expiresAt: activeSub?.expiresAt || null,
        subscription: activeSub,
        message: "این تراکنش قبلاً با موفقیت تأیید و ثبت شده است.",
      };
    }

    if (tx.status === TxStatus.FAILED) {
      return {
        success: false,
        alreadyVerified: true,
        message: "این تراکنش قبلاً ناموفق ثبت شده است.",
      };
    }

    // 3. User cancellation or bank failure
    if (status !== "OK") {
      await txDb.transaction.update({
        where: { id: tx.id },
        data: { status: TxStatus.FAILED },
      });

      return {
        success: false,
        alreadyVerified: false,
        message: "پرداخت توسط کاربر لغو شد یا ناموفق بود.",
      };
    }

    // 4. Verify with Gateway
    const verification = await verifyPayment({
      authority: tx.authority,
      amountToman: tx.amount,
    });

    if (!verification.verified || !verification.refId) {
      await txDb.transaction.update({
        where: { id: tx.id },
        data: { status: TxStatus.FAILED },
      });

      return {
        success: false,
        alreadyVerified: false,
        message: "تراکنش توسط درگاه بانکی تأیید نشد.",
      };
    }

    // 5. Stackable Renewal Calculation
    const now = new Date();
    const existingActiveSub = await txDb.subscription.findFirst({
      where: {
        userId: tx.userId,
        status: SubStatus.ACTIVE,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "desc" },
    });

    // Base date: if already active, add to existing expiry; otherwise start from now
    const baseDate =
      existingActiveSub && existingActiveSub.expiresAt > now
        ? existingActiveSub.expiresAt
        : now;

    const durationMs = tx.plan.durationDays * 24 * 60 * 60 * 1000;
    const newExpiresAt = new Date(baseDate.getTime() + durationMs);

    // Update Transaction
    await txDb.transaction.update({
      where: { id: tx.id },
      data: {
        status: TxStatus.SUCCESS,
        refId: verification.refId,
      },
    });

    // Update or Create Subscription
    let resultingSub;
    if (existingActiveSub) {
      resultingSub = await txDb.subscription.update({
        where: { id: existingActiveSub.id },
        data: {
          expiresAt: newExpiresAt,
          planId: tx.planId,
        },
        include: { plan: true },
      });
    } else {
      resultingSub = await txDb.subscription.create({
        data: {
          userId: tx.userId,
          planId: tx.planId,
          status: SubStatus.ACTIVE,
          startsAt: now,
          expiresAt: newExpiresAt,
        },
        include: { plan: true },
      });
    }

    return {
      success: true,
      alreadyVerified: false,
      refId: verification.refId,
      expiresAt: newExpiresAt,
      subscription: resultingSub,
      message: "پرداخت با موفقیت انجام شد و اشتراک شما فعال گردید.",
    };
  });
}
