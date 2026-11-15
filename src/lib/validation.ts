import { normalizeDigits } from "./money";

/**
 * Validates an Iranian mobile phone number.
 * Must start with 09 and contain exactly 11 digits (e.g. 09123456789).
 */
export function isValidIranianPhone(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizeDigits(phone).trim();
  const iranianMobileRegex = /^09\d{9}$/;
  return iranianMobileRegex.test(normalized);
}

/**
 * Normalizes phone number input by converting Persian/Arabic digits and trimming.
 */
export function normalizePhone(phone: string): string {
  if (!phone) return "";
  return normalizeDigits(phone).trim();
}

/**
 * Validates a 5-digit numeric OTP code.
 */
export function isValidOtp(code: string): boolean {
  if (!code) return false;
  const normalized = normalizeDigits(code).trim();
  return /^\d{5}$/.test(normalized);
}
