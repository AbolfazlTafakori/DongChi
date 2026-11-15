import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  secureCompareOtp,
  recordFailedAttempt,
  getFailedAttempts,
  resetFailedAttempts,
  generateOtpCode,
  isOtpRateLimited,
  MAX_OTP_ATTEMPTS,
} from "../lib/auth-security";
import { POST as sendOtpHandler } from "../app/api/auth/send-otp/route";
import { NextRequest } from "next/server";

describe("Auth Security & Hardening Tests", () => {
  const testPhone = "09129998877";

  beforeEach(() => {
    resetFailedAttempts(testPhone);
  });

  afterEach(() => {
    resetFailedAttempts(testPhone);
    vi.restoreAllMocks();
  });

  describe("1. Zero OTP Leakage in send-otp Response", () => {
    it("should never include code or devCode in the send-otp JSON response", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "09121234567" }),
      });

      const res = await sendOtpHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toBe("کد تأیید با موفقیت ارسال شد.");
      expect(json.expiresInSeconds).toBe(120);

      // STRICT SECURITY CHECK: No code or devCode properties allowed
      expect(json).not.toHaveProperty("code");
      expect(json).not.toHaveProperty("devCode");

      // Verify no 5-digit OTP string leaked anywhere in the JSON response
      const responseStr = JSON.stringify(json);
      expect(responseStr).not.toMatch(/\b\d{5}\b/);
    });
  });

  describe("2. Constant-Time OTP Comparison (secureCompareOtp)", () => {
    it("should return true for an exact match", () => {
      expect(secureCompareOtp("12345", "12345")).toBe(true);
      expect(secureCompareOtp("98765", "98765")).toBe(true);
    });

    it("should return false for different 5-digit codes", () => {
      expect(secureCompareOtp("12345", "12346")).toBe(false);
      expect(secureCompareOtp("12345", "54321")).toBe(false);
    });

    it("should return false for different string lengths", () => {
      expect(secureCompareOtp("12345", "1234")).toBe(false);
      expect(secureCompareOtp("12345", "123456")).toBe(false);
      expect(secureCompareOtp("12345", "")).toBe(false);
      expect(secureCompareOtp("", "12345")).toBe(false);
    });

    it("should handle non-string or malformed inputs safely without throwing", () => {
      expect(secureCompareOtp(null as any, "12345")).toBe(false);
      expect(secureCompareOtp("12345", undefined as any)).toBe(false);
    });
  });

  describe("3. Brute-Force Attempt Lockout Guard", () => {
    it("should track failed attempts and trigger lockout at MAX_OTP_ATTEMPTS (5)", () => {
      expect(getFailedAttempts(testPhone)).toBe(0);

      expect(recordFailedAttempt(testPhone)).toBe(1);
      expect(recordFailedAttempt(testPhone)).toBe(2);
      expect(recordFailedAttempt(testPhone)).toBe(3);
      expect(recordFailedAttempt(testPhone)).toBe(4);
      expect(getFailedAttempts(testPhone)).toBe(4);

      // 5th attempt hits MAX_OTP_ATTEMPTS
      const fifthAttempt = recordFailedAttempt(testPhone);
      expect(fifthAttempt).toBe(MAX_OTP_ATTEMPTS);
      expect(getFailedAttempts(testPhone)).toBe(5);
    });

    it("should reset failed attempts when resetFailedAttempts is invoked", () => {
      recordFailedAttempt(testPhone);
      recordFailedAttempt(testPhone);
      expect(getFailedAttempts(testPhone)).toBe(2);

      resetFailedAttempts(testPhone);
      expect(getFailedAttempts(testPhone)).toBe(0);
    });
  });

  describe("4. Static Test OTP vs Dynamic Crypto Generation", () => {
    it("should return DEV_STATIC_OTP when set to a 5-digit code", () => {
      const originalEnv = process.env.DEV_STATIC_OTP;
      process.env.DEV_STATIC_OTP = "12345";

      const code = generateOtpCode();
      expect(code).toBe("12345");

      process.env.DEV_STATIC_OTP = originalEnv;
    });

    it("should generate a secure 5-digit integer when DEV_STATIC_OTP is unset", () => {
      const originalEnv = process.env.DEV_STATIC_OTP;
      delete process.env.DEV_STATIC_OTP;

      const code = generateOtpCode();
      expect(code).toMatch(/^\d{5}$/);
      const num = parseInt(code, 10);
      expect(num).toBeGreaterThanOrEqual(10000);
      expect(num).toBeLessThan(100000);

      process.env.DEV_STATIC_OTP = originalEnv;
    });
  });

  describe("5. Rate Limiting Check", () => {
    it("should return true if requested within 30 seconds", () => {
      const now = new Date();
      expect(isOtpRateLimited(now, 30)).toBe(true);

      const twentySecondsAgo = new Date(Date.now() - 20 * 1000);
      expect(isOtpRateLimited(twentySecondsAgo, 30)).toBe(true);
    });

    it("should return false if requested after 30 seconds or if no previous request exists", () => {
      expect(isOtpRateLimited(null, 30)).toBe(false);

      const fortySecondsAgo = new Date(Date.now() - 40 * 1000);
      expect(isOtpRateLimited(fortySecondsAgo, 30)).toBe(false);
    });
  });
});
