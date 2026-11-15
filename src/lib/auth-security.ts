import crypto from "crypto";

export const MAX_OTP_ATTEMPTS = 5;
export const OTP_RATE_LIMIT_SECONDS = 30;

// In-memory failed attempts tracker per phone
const failedAttemptsMap = new Map<string, { count: number; lastFailedAt: number }>();

/**
 * Constant-time comparison between two OTP strings to prevent timing attacks.
 */
export function secureCompareOtp(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a.trim());
  const bufB = Buffer.from(b.trim());

  if (bufA.length === 0 || bufB.length === 0 || bufA.length !== bufB.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Generates an OTP code.
 * If DEV_STATIC_OTP is set and is a 5-digit number, returns it for local testing.
 * Otherwise, uses crypto.randomInt to generate a cryptographically secure 5-digit integer.
 */
export function generateOtpCode(): string {
  const staticOtp = process.env.DEV_STATIC_OTP?.trim();
  if (staticOtp && /^\d{5}$/.test(staticOtp)) {
    return staticOtp;
  }
  return crypto.randomInt(10000, 100000).toString();
}

/**
 * Records a failed verification attempt for a phone number.
 */
export function recordFailedAttempt(phone: string): number {
  const current = failedAttemptsMap.get(phone);
  const newCount = (current?.count || 0) + 1;
  failedAttemptsMap.set(phone, {
    count: newCount,
    lastFailedAt: Date.now(),
  });
  return newCount;
}

/**
 * Gets current failed verification attempts for a phone number.
 */
export function getFailedAttempts(phone: string): number {
  return failedAttemptsMap.get(phone)?.count || 0;
}

/**
 * Clears failed verification attempts for a phone number upon successful verification.
 */
export function resetFailedAttempts(phone: string): void {
  failedAttemptsMap.delete(phone);
}

/**
 * Checks if a new OTP request is rate-limited (requested within 30 seconds).
 */
export function isOtpRateLimited(
  lastCreatedAt: Date | null | undefined,
  windowSeconds = OTP_RATE_LIMIT_SECONDS
): boolean {
  if (!lastCreatedAt) return false;
  const elapsedMs = Date.now() - new Date(lastCreatedAt).getTime();
  return elapsedMs < windowSeconds * 1000;
}
