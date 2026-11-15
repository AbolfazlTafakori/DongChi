import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  normalizeDigits,
  formatToman,
  numberToPersianWords,
} from "@/lib/money";
import {
  formatBankCard,
  detectIranBank,
  validateIranBankCard,
} from "@/lib/iran-banks";
import { CheckCircle2, AlertCircle, CreditCard } from "lucide-react";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  numericOnly?: boolean;
  currencyPreview?: boolean;
  bankCardMode?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      numericOnly = false,
      currencyPreview = false,
      bankCardMode = false,
      value,
      defaultValue,
      onChange,
      onValueChange,
      id,
      dir,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.replace(/\s+/g, "-") : undefined);
    const [currentVal, setCurrentVal] = useState<string>(
      String(value ?? defaultValue ?? "")
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let rawVal = e.target.value;

      if (bankCardMode) {
        // Format as XXXX - XXXX - XXXX - XXXX
        rawVal = formatBankCard(rawVal);
        e.target.value = rawVal;
      } else if (numericOnly) {
        // Convert Persian/Arabic digits and filter out non-numeric characters
        rawVal = normalizeDigits(rawVal).replace(/[^\d]/g, "");
        e.target.value = rawVal;
      }

      setCurrentVal(rawVal);
      onChange?.(e);
      onValueChange?.(rawVal);
    };

    // Keep internal currentVal synchronized if controlled
    React.useEffect(() => {
      if (value !== undefined) {
        setCurrentVal(String(value));
      }
    }, [value]);

    const displayVal = value !== undefined ? String(value) : currentVal;
    const cleanDigits = normalizeDigits(displayVal).replace(/[^\d]/g, "");

    // Currency calculations
    const formattedCurrency =
      currencyPreview && cleanDigits
        ? formatToman(BigInt(cleanDigits))
        : null;

    const persianWords =
      currencyPreview && cleanDigits && BigInt(cleanDigits) > 0n
        ? numberToPersianWords(BigInt(cleanDigits), { includeCurrency: true })
        : null;

    // Bank card calculations
    const detectedBank = bankCardMode ? detectIranBank(cleanDigits) : null;
    const isFullCard = bankCardMode && cleanDigits.length === 16;
    const isCardValid = isFullCard ? validateIranBankCard(cleanDigits) : null;

    return (
      <div className="w-full text-right" dir="rtl">
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={inputId}
              className="block text-xs font-semibold text-slate-700"
            >
              {label}
            </label>
            {detectedBank && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
                <CreditCard className="w-3 h-3 text-emerald-600" />
                <span>{detectedBank}</span>
              </span>
            )}
          </div>
        )}

        <div className="relative flex items-center">
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            value={value}
            defaultValue={defaultValue}
            onChange={handleInputChange}
            dir={bankCardMode ? "ltr" : dir || "rtl"}
            className={cn(
              "w-full h-11 min-h-[44px] rounded-xl border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:opacity-50 disabled:bg-slate-50",
              rightIcon ? "pr-10" : "pr-3.5",
              leftIcon || isFullCard ? "pl-10" : "pl-3.5",
              (numericOnly || bankCardMode) && "tabular-nums tracking-wide",
              bankCardMode && "font-mono text-center tracking-widest text-base",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 hover:border-slate-300",
              className
            )}
            {...props}
          />

          {leftIcon && !isFullCard && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}

          {isFullCard && (
            <div className="absolute left-3.5 flex items-center pointer-events-none">
              {isCardValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          )}
        </div>

        {/* Live Currency & Words preview badge to prevent missing or extra zeros */}
        {formattedCurrency && persianWords && (
          <div className="mt-1.5 p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-right flex flex-col gap-0.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold tabular-nums">
              <span className="text-emerald-600 font-normal">مبلغ:</span>
              <span>{formattedCurrency}</span>
            </div>
            <div className="text-xs text-emerald-700 font-medium leading-relaxed">
              <span className="text-emerald-600 font-normal ml-1">به حروف:</span>
              <span>{persianWords}</span>
            </div>
          </div>
        )}

        {/* Bank card validation feedback */}
        {bankCardMode && cleanDigits.length > 0 && cleanDigits.length < 16 && (
          <p className="mt-1 text-[11px] text-slate-500 font-mono">
            {16 - cleanDigits.length} رقم دیگر باقی مانده است
          </p>
        )}
        {bankCardMode && isFullCard && !isCardValid && (
          <p className="mt-1 text-xs text-red-600 font-medium">
            شماره کارت نامعتبر است (کنترل ارقام بانک همخوانی ندارد).
          </p>
        )}

        {/* Error or Helper Message */}
        {error ? (
          <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
