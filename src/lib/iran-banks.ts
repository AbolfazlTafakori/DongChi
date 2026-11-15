import { normalizeDigits } from "./money";

export interface IranBankInfo {
  name: string;
  bin: string;
  color?: string;
}

export const IRAN_BANKS: Record<string, string> = {
  "603799": "بانک ملی",
  "610433": "بانک ملت",
  "621986": "بانک سامان",
  "589210": "بانک سپه",
  "603769": "بانک صادرات",
  "627412": "بانک اقتصاد نوین",
  "622106": "بانک پارسیان",
  "502229": "بانک پاسارگاد",
  "627353": "بانک تجارت",
  "585983": "بانک تجارت",
  "603770": "بانک کشاورزی",
  "639599": "بانک قوامین",
  "504172": "بانک رسالت",
  "636214": "بانک آینده",
  "505416": "بانک گردشگری",
  "627760": "پست بانک",
  "502908": "بانک توسعه تعاون",
  "639346": "بانک سینا",
  "628023": "بانک مسکن",
  "636949": "بانک حکمت ایرانیان",
  "505785": "بانک ایران زمین",
  "606373": "بانک قرض‌الحسنه مهر ایران",
  "639607": "بانک سرمایه",
  "504706": "بانک شهر",
  "502938": "بانک دی",
  "627381": "بانک انصار",
  "639370": "بانک مهر اقتصاد",
  "636795": "بانک مرکزی",
  "628157": "موسسه اعتباری توسعه",
  "589463": "بانک رفاه",
  // Additional common prefixes
  "627961": "بانک صنعت و معدن",
  "606256": "موسسه اعتباری ملل",
  "505801": "موسسه اعتباری کوثر",
  "991975": "بانک ملت",
};

/**
 * Validates a 16-digit Iranian bank card number using standard Luhn checksum algorithm.
 */
export function validateIranBankCard(cardNumber: string | null | undefined): boolean {
  if (!cardNumber) return false;
  const digits = normalizeDigits(cardNumber).replace(/\D/g, "");
  if (digits.length !== 16) return false;

  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let d = parseInt(digits[i], 10);
    // Odd positions (even indices: 0, 2, 4, ...) are multiplied by 2
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * Detects issuing Iranian bank name from card number's 6-digit BIN prefix.
 * e.g. "603799" -> "بانک ملی"
 */
export function detectIranBank(cardNumber: string | null | undefined): string | null {
  if (!cardNumber) return null;
  const digits = normalizeDigits(cardNumber).replace(/\D/g, "");
  if (digits.length < 6) return null;

  const bin = digits.slice(0, 6);
  return IRAN_BANKS[bin] || null;
}

/**
 * Formats a bank card number into groups of 4 separated by ' - '
 * e.g. "6037991234567890" -> "6037 - 9912 - 3456 - 7890"
 */
export function formatBankCard(cardNumber: string | null | undefined): string {
  if (!cardNumber) return "";
  const digits = normalizeDigits(cardNumber).replace(/\D/g, "").slice(0, 16);
  if (!digits) return "";

  const chunks: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    chunks.push(digits.slice(i, i + 4));
  }
  return chunks.join(" - ");
}
