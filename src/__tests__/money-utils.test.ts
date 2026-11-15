import { describe, it, expect } from "vitest";
import {
  normalizeDigits,
  formatToman,
  toPersianDigits,
  parseToman,
} from "../lib/money";

describe("Money and Digits Utility Functions", () => {
  describe("normalizeDigits", () => {
    it("should convert Persian digits to English digits", () => {
      expect(normalizeDigits("۱۲۳۴۵۶۷۸۹۰")).toBe("1234567890");
    });

    it("should convert Arabic digits to English digits", () => {
      expect(normalizeDigits("١٢٣٤٥٦٧٨٩٠")).toBe("1234567890");
    });

    it("should handle mixed Persian, Arabic, and English digits", () => {
      // Persian: ۱۲۳, Arabic: ٤٥٦, English: 789
      expect(normalizeDigits("۱۲۳٤٥٦789")).toBe("123456789");
    });

    it("should preserve non-digit characters", () => {
      expect(normalizeDigits("تلفن: ۰۹۱۲۳۴۵۶۷۸۹")).toBe("تلفن: 09123456789");
    });

    it("should handle empty or null values gracefully", () => {
      expect(normalizeDigits(null)).toBe("");
      expect(normalizeDigits(undefined)).toBe("");
      expect(normalizeDigits("")).toBe("");
    });
  });

  describe("toPersianDigits", () => {
    it("should convert English digits to Persian digits", () => {
      expect(toPersianDigits("1234567890")).toBe("۱۲۳۴۵۶۷۸۹۰");
      expect(toPersianDigits(123)).toBe("۱۲۳");
    });
  });

  describe("formatToman with BigInt", () => {
    it("should format 0n correctly", () => {
      expect(formatToman(0n)).toBe("۰ تومان");
      expect(formatToman(0n, { includeCurrency: false })).toBe("۰");
    });

    it("should format 50000n correctly with thousand separators", () => {
      expect(formatToman(50000n)).toBe("۵۰,۰۰۰ تومان");
      expect(formatToman(50000n, { includeCurrency: false })).toBe("۵۰,۰۰۰");
    });

    it("should format 12500000n without any floating-point errors", () => {
      expect(formatToman(12500000n)).toBe("۱۲,۵۰۰,۰۰۰ تومان");
    });

    it("should format large BigInt values (e.g. 1000000000000n - 1 trillion)", () => {
      expect(formatToman(1000000000000n)).toBe("۱,۰۰۰,۰۰۰,۰۰۰,۰۰۰ تومان");
    });

    it("should format negative BigInt values correctly for debts", () => {
      expect(formatToman(-50000n)).toBe("-۵۰,۰۰۰ تومان");
    });

    it("should handle string and number inputs cleanly", () => {
      expect(formatToman("50000")).toBe("۵۰,۰۰۰ تومان");
      expect(formatToman(50000)).toBe("۵۰,۰۰۰ تومان");
      expect(formatToman("۵۰۰۰۰")).toBe("۵۰,۰۰۰ تومان");
    });
  });

  describe("parseToman", () => {
    it("should parse Persian string into BigInt", () => {
      expect(parseToman("۵۰,۰۰۰")).toBe(50000n);
      expect(parseToman("۱,۲۵۰,۰۰۰")).toBe(1250000n);
    });

    it("should parse English string into BigInt", () => {
      expect(parseToman("50000")).toBe(50000n);
    });

    it("should return 0n for invalid inputs", () => {
      expect(parseToman("")).toBe(0n);
      expect(parseToman("abc")).toBe(0n);
    });
  });
});
