"use client";

import React, { useRef, useEffect } from "react";
import { normalizeDigits } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string | boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 5,
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split the value into individual box digits
  const cleanDigits = normalizeDigits(value).replace(/\D/g, "");
  const digits = Array.from({ length }, (_, i) => cleanDigits[i] || "");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleBoxChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = normalizeDigits(e.target.value).replace(/\D/g, "");
    if (!rawInput) {
      // Cleared the box
      const newDigits = [...digits];
      newDigits[index] = "";
      const combined = newDigits.join("");
      onChange(combined);
      return;
    }

    if (rawInput.length > 1) {
      // User pasted or typed multiple digits
      const pastedDigits = rawInput.slice(0, length);
      onChange(pastedDigits);

      if (pastedDigits.length === length && onComplete) {
        onComplete(pastedDigits);
      }

      const nextFocus = Math.min(pastedDigits.length, length - 1);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    // Single digit entered
    const singleDigit = rawInput.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    const combined = newDigits.join("");
    onChange(combined);

    if (combined.length === length && onComplete) {
      onComplete(combined);
    } else if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Current box is empty, jump to previous and delete its digit
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const normalized = normalizeDigits(pasted).replace(/\D/g, "").slice(0, length);
    if (!normalized) return;

    onChange(normalized);
    if (normalized.length === length && onComplete) {
      onComplete(normalized);
    }
    const focusIndex = Math.min(normalized.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center justify-center gap-2.5 sm:gap-3"
        dir="ltr"
      >
        {Array.from({ length }).map((_, idx) => {
          const digit = digits[idx] || "";
          const isFilled = digit.length > 0;

          return (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={idx === 0 ? "one-time-code" : "off"}
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={disabled}
              onChange={(e) => handleBoxChange(idx, e)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={cn(
                "w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-2xl border transition-all duration-150 select-none shadow-xs",
                "focus:outline-none focus:ring-2",
                isFilled
                  ? "border-emerald-600 bg-emerald-50/30 text-emerald-950 font-extrabold"
                  : "border-slate-200 bg-white text-slate-900 hover:border-slate-300",
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-red-400/20 text-red-600 bg-red-50/20"
                  : "focus:border-emerald-600 focus:ring-emerald-500/20",
                disabled && "opacity-50 cursor-not-allowed bg-slate-50"
              )}
            />
          );
        })}
      </div>
      {typeof error === "string" && (
        <p className="mt-2 text-xs text-red-600 font-medium text-center">
          {error}
        </p>
      )}
    </div>
  );
}
