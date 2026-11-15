import { describe, it, expect } from "vitest";
import {
  numberToPersianWords,
  formatLiveAmountInput,
} from "../lib/money";
import {
  formatBankCard,
  validateIranBankCard,
  detectIranBank,
} from "../lib/iran-banks";

describe("UX and Input Helpers (Financial Precision & Empathy)", () => {
  describe("numberToPersianWords", () => {
    it("should convert 0n to 'صفر تومان'", () => {
      expect(numberToPersianWords(0n)).toBe("صفر تومان");
      expect(numberToPersianWords(0n, { includeCurrency: false })).toBe("صفر");
    });

    it("should convert 50000n to 'پنجاه هزار تومان'", () => {
      expect(numberToPersianWords(50000n)).toBe("پنجاه هزار تومان");
      expect(numberToPersianWords(50000n, { includeCurrency: false })).toBe(
        "پنجاه هزار"
      );
    });

    it("should convert 1250000n to 'یک میلیون و دویست و پنجاه هزار تومان'", () => {
      expect(numberToPersianWords(1250000n)).toBe(
        "یک میلیون و دویست و پنجاه هزار تومان"
      );
    });

    it("should convert 100000000n to 'صد میلیون تومان'", () => {
      expect(numberToPersianWords(100000000n)).toBe("صد میلیون تومان");
    });

    it("should convert billions accurately", () => {
      expect(numberToPersianWords(15000000000n)).toBe(
        "پانزده میلیارد تومان"
      );
    });

    it("should handle negative amounts properly", () => {
      expect(numberToPersianWords(-50000n)).toBe("منفی پنجاه هزار تومان");
    });

    it("should accept string and number formats with Persian digits", () => {
      expect(numberToPersianWords("۵۰۰۰۰")).toBe("پنجاه هزار تومان");
      expect(numberToPersianWords(1250000)).toBe(
        "یک میلیون و دویست و پنجاه هزار تومان"
      );
    });
  });

  describe("Iran Bank Card Utilities", () => {
    // Valid 16-digit test card number passing Luhn checksum:
    // 6037991199999990 -> Luhn sum = 100, 100 % 10 == 0
    const validMelliCard = "6037991199999990";
    const invalidCardChecksum = "6037991199999991"; // sum = 101 -> invalid
    const shortCard = "60379911999";

    it("should validate a correct 16-digit card using Luhn algorithm", () => {
      expect(validateIranBankCard(validMelliCard)).toBe(true);
      expect(validateIranBankCard("۶۰۳۷۹۹۱۱۹۹۹۹۹۹۹۰")).toBe(true);
    });

    it("should reject an invalid checksum card", () => {
      expect(validateIranBankCard(invalidCardChecksum)).toBe(false);
    });

    it("should reject cards with invalid length or non-digits", () => {
      expect(validateIranBankCard(shortCard)).toBe(false);
      expect(validateIranBankCard("")).toBe(false);
      expect(validateIranBankCard("abcdefghijklmnop")).toBe(false);
      expect(validateIranBankCard(null)).toBe(false);
    });

    it("should detect bank names from 6-digit BIN prefix", () => {
      expect(detectIranBank("603799")).toBe("بانک ملی");
      expect(detectIranBank(validMelliCard)).toBe("بانک ملی");
      expect(detectIranBank("6104330000000000")).toBe("بانک ملت");
      expect(detectIranBank("6219860000000000")).toBe("بانک سامان");
      expect(detectIranBank("5892100000000000")).toBe("بانک سپه");
      expect(detectIranBank("6274120000000000")).toBe("بانک اقتصاد نوین");
      expect(detectIranBank("5022290000000000")).toBe("بانک پاسارگاد");
      expect(detectIranBank("5041720000000000")).toBe("بانک رسالت");
      expect(detectIranBank("6362140000000000")).toBe("بانک آینده");
      expect(detectIranBank("9999990000000000")).toBeNull();
      expect(detectIranBank("1234")).toBeNull();
    });

    it("should format bank card into 4-digit groups separated by ' - '", () => {
      expect(formatBankCard(validMelliCard)).toBe("6037 - 9911 - 9999 - 9990");
      expect(formatBankCard("۶۰۳۷۹۹۱۱۹۹۹۹۹۹۹۰")).toBe(
        "6037 - 9911 - 9999 - 9990"
      );
      expect(formatBankCard("60379911")).toBe("6037 - 9911");
    });
  });

  describe("formatLiveAmountInput", () => {
    it("should format mixed Persian, Arabic, and English digits with thousand separators and live words", () => {
      const result = formatLiveAmountInput("۱۲۵۰000");
      expect(result.raw).toBe("1250000");
      expect(result.value).toBe(1250000n);
      expect(result.formatted).toBe("۱,۲۵۰,۰۰۰");
      expect(result.words).toBe("یک میلیون و دویست و پنجاه هزار تومان");
    });

    it("should handle empty or zero input cleanly", () => {
      const emptyResult = formatLiveAmountInput("");
      expect(emptyResult.raw).toBe("");
      expect(emptyResult.value).toBe(0n);
      expect(emptyResult.formatted).toBe("");
      expect(emptyResult.words).toBe("");
    });
  });
});
