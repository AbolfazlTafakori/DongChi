"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useId,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    (message: string, options?: Partial<Omit<ToastItem, "id" | "message">>): void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (
      message: string,
      options?: Partial<Omit<ToastItem, "id" | "message">>
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const duration = options?.duration ?? 4000;
      const newToast: ToastItem = {
        id,
        message,
        title: options?.title,
        type: options?.type || "info",
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toastMethods = Object.assign(
    (message: string, options?: Partial<Omit<ToastItem, "id" | "message">>) =>
      addToast(message, options),
    {
      success: (message: string, title?: string) =>
        addToast(message, { type: "success", title }),
      error: (message: string, title?: string) =>
        addToast(message, { type: "error", title }),
      warning: (message: string, title?: string) =>
        addToast(message, { type: "warning", title }),
      info: (message: string, title?: string) =>
        addToast(message, { type: "info", title }),
    }
  );

  return (
    <ToastContext.Provider value={{ toast: toastMethods, removeToast }}>
      {children}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 items-center w-full max-w-sm px-4 pointer-events-none"
        dir="rtl"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback for non-provider contexts or tests
    return {
      toast: Object.assign(
        (msg: string) => console.log(msg),
        {
          success: (msg: string) => console.log("[Success]", msg),
          error: (msg: string) => console.error("[Error]", msg),
          warning: (msg: string) => console.warn("[Warning]", msg),
          info: (msg: string) => console.info("[Info]", msg),
        }
      ),
      removeToast: () => {},
    };
  }
  return context;
}

function ToastCard({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: () => void;
}) {
  const { type = "info", message, title } = item;

  const styles = {
    success: {
      bg: "bg-white border-emerald-200 text-slate-800 shadow-md",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
      bar: "bg-emerald-600",
    },
    error: {
      bg: "bg-white border-red-200 text-slate-800 shadow-md",
      icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
      bar: "bg-red-600",
    },
    warning: {
      bg: "bg-white border-amber-200 text-slate-800 shadow-md",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
      bar: "bg-amber-600",
    },
    info: {
      bg: "bg-white border-indigo-200 text-slate-800 shadow-md",
      icon: <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />,
      bar: "bg-indigo-600",
    },
  }[type];

  return (
    <div
      className={cn(
        "pointer-events-auto w-full rounded-2xl border p-3.5 flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-top-3",
        styles.bg
      )}
    >
      {styles.icon}
      <div className="flex-1 min-w-0 text-right">
        {title && (
          <h4 className="font-bold text-xs text-slate-900 mb-0.5 leading-snug">
            {title}
          </h4>
        )}
        <p className="text-xs font-medium text-slate-700 leading-relaxed break-words">
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 p-1 -m-1 rounded-lg transition-colors shrink-0"
        aria-label="بستن"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
