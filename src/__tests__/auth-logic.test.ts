import { describe, it, expect } from "vitest";
import {
  isValidIranianPhone,
  isValidOtp,
  normalizePhone,
} from "../lib/validation";
import { signSession, verifySession } from "../lib/session";

describe("Auth Logic & Security Validation", () => {
  describe("Iranian Phone Number Validation", () => {
    it("should accept valid 11-digit Iranian mobile numbers starting with 09", () => {
      expect(isValidIranianPhone("09123456789")).toBe(true);
      expect(isValidIranianPhone("09351234567")).toBe(true);
      expect(isValidIranianPhone("09901234567")).toBe(true);
    });

    it("should accept valid phone numbers with Persian/Arabic digits after normalization", () => {
      expect(isValidIranianPhone("۰۹۱۲۳۴۵۶۷۸۹")).toBe(true);
      expect(isValidIranianPhone("٠٩١٢٣٤٥٦٧٨٩")).toBe(true);
    });

    it("should reject invalid mobile numbers as per specifications", () => {
      // 9123456789 (missing leading zero)
      expect(isValidIranianPhone("9123456789")).toBe(false);
      // 08123456789 (does not start with 09)
      expect(isValidIranianPhone("08123456789")).toBe(false);
      // 123 (too short)
      expect(isValidIranianPhone("123")).toBe(false);
      // Extra digits
      expect(isValidIranianPhone("091234567890")).toBe(false);
      // Characters
      expect(isValidIranianPhone("0912345678a")).toBe(false);
      // Empty
      expect(isValidIranianPhone("")).toBe(false);
    });
  });

  describe("OTP Code Validation", () => {
    it("should accept valid 5-digit numeric codes", () => {
      expect(isValidOtp("12345")).toBe(true);
      expect(isValidOtp("99999")).toBe(true);
      expect(isValidOtp("۰۰۰۰۰")).toBe(true);
    });

    it("should reject codes with wrong length or non-digits", () => {
      expect(isValidOtp("1234")).toBe(false);
      expect(isValidOtp("123456")).toBe(false);
      expect(isValidOtp("1234a")).toBe(false);
      expect(isValidOtp("")).toBe(false);
    });
  });

  describe("JWT Session with Jose", () => {
    const testPayload = {
      userId: "user_test_cuid_123",
      phone: "09123456789",
      role: "USER" as const,
    };

    it("should successfully sign and verify session JWT roundtrip", async () => {
      const token = await signSession(testPayload);
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);

      const verified = await verifySession(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(testPayload.userId);
      expect(verified?.phone).toBe(testPayload.phone);
      expect(verified?.role).toBe(testPayload.role);
    });

    it("should handle ADMIN role sessions correctly", async () => {
      const adminPayload = {
        userId: "admin_test_cuid_999",
        phone: "09120000000",
        role: "ADMIN" as const,
      };

      const token = await signSession(adminPayload);
      const verified = await verifySession(token);
      expect(verified?.role).toBe("ADMIN");
      expect(verified?.userId).toBe("admin_test_cuid_999");
    });

    it("should return null for tampered JWT tokens", async () => {
      const token = await signSession(testPayload);
      // Tamper signature by appending a character
      const tamperedToken = `${token}x`;
      const verified = await verifySession(tamperedToken);
      expect(verified).toBeNull();

      // Tamper payload part
      const parts = token.split(".");
      const tamperedPayloadToken = `${parts[0]}.eyJob2dnd2FydHMiOiJpbnZhbGlkIn0.${parts[2]}`;
      const verified2 = await verifySession(tamperedPayloadToken);
      expect(verified2).toBeNull();
    });

    it("should return null for expired JWT tokens", async () => {
      // Sign with -1s expiration
      const expiredToken = await signSession(testPayload, "-1s");
      const verified = await verifySession(expiredToken);
      expect(verified).toBeNull();
    });

    it("should return null for empty or invalid token formats", async () => {
      expect(await verifySession("")).toBeNull();
      expect(await verifySession(null)).toBeNull();
      expect(await verifySession(undefined)).toBeNull();
      expect(await verifySession("invalid.token")).toBeNull();
    });
  });
});
