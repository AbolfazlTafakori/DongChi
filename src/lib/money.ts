/**
 * Persian & Arabic digit maps
 */
const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

const UNITS_WORDS: Record<number, string> = {
  1: "یک",
  2: "دو",
  3: "سه",
  4: "چهار",
  5: "پنج",
  6: "شش",
  7: "هفت",
  8: "هشت",
  9: "نه",
};

const TEENS_WORDS: Record<number, string> = {
  10: "ده",
  11: "یازده",
  12: "دوازده",
  13: "سیزده",
  14: "چهارده",
  15: "پانزده",
  16: "شانزده",
  17: "هفده",
  18: "هجده",
  19: "نوزده",
};

const TENS_WORDS: Record<number, string> = {
  20: "بیست",
  30: "سی",
  40: "چهل",
  50: "پنجاه",
  60: "شصت",
  70: "هفتاد",
  80: "هشتاد",
  90: "نود",
};

const HUNDREDS_WORDS: Record<number, string> = {
  100: "صد",
  200: "دویست",
  300: "سیصد",
  400: "چهارصد",
  500: "پانصد",
  600: "ششصد",
  700: "هفتصد",
  800: "هشتصد",
  900: "نهصد",
};

const SCALES = [
  "",
  "هزار",
  "میلیون",
  "میلیارد",
  "تریلیون",
  "کوادریلیون",
];

function threeDigitGroupToWords(num: number): string {
  if (num === 0) return "";
  const parts: string[] = [];

  const hundreds = Math.floor(num / 100) * 100;
  if (hundreds > 0 && HUNDREDS_WORDS[hundreds]) {
    parts.push(HUNDREDS_WORDS[hundreds]);
  }

  const remainder = num % 100;
  if (remainder >= 10 && remainder <= 19) {
    parts.push(TEENS_WORDS[remainder]);
  } else {
    const tens = Math.floor(remainder / 10) * 10;
    const units = remainder % 10;
    if (tens > 0 && TENS_WORDS[tens]) {
      parts.push(TENS_WORDS[tens]);
    }
    if (units > 0 && UNITS_WORDS[units]) {
      parts.push(UNITS_WORDS[units]);
    }
  }

  return parts.join(" و ");
}

/**
 * Normalizes Persian and Arabic numerals to standard English (ASCII) digits.
 * Useful for normalizing phone numbers, verification codes, and currency inputs.
 */
export function normalizeDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  let str = String(input);

  for (let i = 0; i < 10; i++) {
    const persianRegex = new RegExp(PERSIAN_DIGITS[i], "g");
    const arabicRegex = new RegExp(ARABIC_DIGITS[i], "g");
    str = str.replace(persianRegex, String(i)).replace(arabicRegex, String(i));
  }

  return str;
}

/**
 * Converts English digits to Persian digits.
 */
export function toPersianDigits(input: string | number | bigint | null | undefined): string {
  if (input === null || input === undefined) return "";
  const str = String(input);
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}

/**
 * Formats a BigInt or number amount in Tomans with Persian digits and 3-digit comma separators.
 * e.g. 1250000n -> "۱,۲۵۰,۰۰۰ تومان"
 * Handles negative amounts properly (e.g. -50000n -> "-۵۰,۰۰۰ تومان").
 */
export function formatToman(
  amount: bigint | number | string | null | undefined,
  options: { includeCurrency?: boolean } = { includeCurrency: true }
): string {
  if (amount === null || amount === undefined) {
    return options.includeCurrency ? "۰ تومان" : "۰";
  }

  let bigVal: bigint;
  if (typeof amount === "bigint") {
    bigVal = amount;
  } else {
    const normalized = normalizeDigits(String(amount)).replace(/[^\d-]/g, "");
    if (!normalized || normalized === "-") {
      return options.includeCurrency ? "۰ تومان" : "۰";
    }
    bigVal = BigInt(normalized);
  }

  const isNegative = bigVal < 0n;
  const absVal = isNegative ? -bigVal : bigVal;
  const strVal = absVal.toString();

  // Add thousand separators from right to left
  const parts: string[] = [];
  let remaining = strVal;
  while (remaining.length > 3) {
    parts.unshift(remaining.slice(-3));
    remaining = remaining.slice(0, -3);
  }
  if (remaining.length > 0) {
    parts.unshift(remaining);
  }

  const separated = parts.join(",");
  const persianSeparated = toPersianDigits(separated);
  const formatted = isNegative ? `-${persianSeparated}` : persianSeparated;

  return options.includeCurrency ? `${formatted} تومان` : formatted;
}

/**
 * Converts a Toman monetary value to Persian words.
 * e.g. 0n -> "صفر تومان"
 * e.g. 50000n -> "پنجاه هزار تومان"
 * e.g. 1250000n -> "یک میلیون و دویست و پنجاه هزار تومان"
 * e.g. 100000000n -> "صد میلیون تومان"
 */
export function numberToPersianWords(
  amount: bigint | number | string | null | undefined,
  options: { includeCurrency?: boolean } = { includeCurrency: true }
): string {
  if (amount === null || amount === undefined) {
    return options.includeCurrency ? "صفر تومان" : "صفر";
  }

  let bigVal: bigint;
  if (typeof amount === "bigint") {
    bigVal = amount;
  } else {
    const normalized = normalizeDigits(String(amount)).replace(/[^\d-]/g, "");
    if (!normalized || normalized === "-") {
      return options.includeCurrency ? "صفر تومان" : "صفر";
    }
    try {
      bigVal = BigInt(normalized);
    } catch {
      return options.includeCurrency ? "صفر تومان" : "صفر";
    }
  }

  if (bigVal === 0n) {
    return options.includeCurrency ? "صفر تومان" : "صفر";
  }

  const isNegative = bigVal < 0n;
  const absVal = isNegative ? -bigVal : bigVal;
  const strVal = absVal.toString();

  // Group into 3-digit chunks from right to left
  const chunks: number[] = [];
  let remaining = strVal;
  while (remaining.length > 3) {
    chunks.unshift(parseInt(remaining.slice(-3), 10));
    remaining = remaining.slice(0, -3);
  }
  if (remaining.length > 0) {
    chunks.unshift(parseInt(remaining, 10));
  }

  const words: string[] = [];
  const totalChunks = chunks.length;

  for (let i = 0; i < totalChunks; i++) {
    const chunkVal = chunks[i];
    if (chunkVal === 0) continue;

    const scaleIndex = totalChunks - 1 - i;
    const chunkWord = threeDigitGroupToWords(chunkVal);

    if (scaleIndex > 0 && SCALES[scaleIndex]) {
      words.push(`${chunkWord} ${SCALES[scaleIndex]}`);
    } else {
      words.push(chunkWord);
    }
  }

  if (words.length === 0) {
    return options.includeCurrency ? "صفر تومان" : "صفر";
  }

  let result = words.join(" و ");
  if (isNegative) {
    result = `منفی ${result}`;
  }

  return options.includeCurrency ? `${result} تومان` : result;
}

/**
 * Live formatter for monetary input fields.
 * Handles mixed Persian/Arabic/English input, strips invalid characters,
 * creates 3-digit separated Persian representation and live Persian words.
 */
export function formatLiveAmountInput(input: string | number | null | undefined): {
  raw: string;
  formatted: string;
  value: bigint;
  words: string;
} {
  if (input === null || input === undefined) {
    return { raw: "", formatted: "", value: 0n, words: "" };
  }

  const normalized = normalizeDigits(String(input)).replace(/\D/g, "");
  if (!normalized) {
    return { raw: "", formatted: "", value: 0n, words: "" };
  }

  const value = BigInt(normalized);

  // Group 3 digits for formatted display
  const parts: string[] = [];
  let remaining = normalized;
  while (remaining.length > 3) {
    parts.unshift(remaining.slice(-3));
    remaining = remaining.slice(0, -3);
  }
  if (remaining.length > 0) {
    parts.unshift(remaining);
  }

  const formatted = toPersianDigits(parts.join(","));
  const words = numberToPersianWords(value, { includeCurrency: true });

  return {
    raw: normalized,
    formatted,
    value,
    words,
  };
}

/**
 * Parses a user input string into a BigInt of Tomans.
 * Returns 0n if invalid.
 */
export function parseToman(input: string | null | undefined): bigint {
  if (!input) return 0n;
  const cleaned = normalizeDigits(input).replace(/[^\d-]/g, "");
  if (!cleaned || cleaned === "-") return 0n;
  try {
    return BigInt(cleaned);
  } catch {
    return 0n;
  }
}

/**
 * Validates an Iranian IBAN (Sheba / شماره شبا).
 * Format: IR + 24 digits (total 26 characters).
 * Implements ISO 7064 Mod 97-10 algorithm.
 */
export function validateIranianSheba(sheba: string | null | undefined): boolean {
  if (!sheba) return false;
  const normalized = normalizeDigits(sheba).replace(/\s+/g, "").toUpperCase();
  if (!/^IR\d{24}$/.test(normalized)) {
    return false;
  }

  // Move the first 4 characters (IR + 2 check digits) to the end
  const rearranged = normalized.slice(4) + normalized.slice(0, 4);

  // Replace letters with numbers: I = 18, R = 27
  const numericString = rearranged
    .replace(/I/g, "18")
    .replace(/R/g, "27");

  try {
    const remainder = BigInt(numericString) % 97n;
    return remainder === 1n;
  } catch {
    return false;
  }
}

/**
 * Formats an Iranian IBAN (Sheba) into standard 4-character blocks:
 * e.g. "IR12 3456 7890 1234 5678 9012 34"
 */
export function formatSheba(sheba: string | null | undefined): string {
  if (!sheba) return "";
  const cleaned = normalizeDigits(sheba).replace(/\s+/g, "").toUpperCase();
  const raw = cleaned.startsWith("IR") ? cleaned.slice(2) : cleaned;
  
  if (!raw) return "IR";
  const chunks: string[] = [];
  for (let i = 0; i < raw.length; i += 4) {
    chunks.push(raw.slice(i, i + 4));
  }
  return `IR ${chunks.join(" ")}`.trim();
}
