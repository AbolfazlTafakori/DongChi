import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "credit" | "debt" | "warning" | "neutral" | "pro";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center gap-1.5 font-medium rounded-xl border select-none transition-colors";

  const variantStyles = {
    credit: "bg-emerald-50 text-emerald-700 border-emerald-200",
    debt: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    pro: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  const dotColorStyles = {
    credit: "bg-emerald-500",
    debt: "bg-red-500",
    warning: "bg-amber-500",
    neutral: "bg-slate-400",
    pro: "bg-indigo-500",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotColorStyles[variant]
          )}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
