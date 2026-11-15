"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Crown,
  Sparkles,
  Users,
  PiggyBank,
  FileSpreadsheet,
  CheckCircle2,
  X,
  ArrowLeft,
} from "lucide-react";

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  reason?: string;
  feature?: "UNLIMITED_GROUPS" | "EXPORT_CSV" | "MULTIPLE_FUNDS";
}

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
  isOpen,
  onClose,
  title = "ارتقا به اشتراک حرفه‌ای (Pro)",
  reason,
  feature,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-amber-100 flex flex-col max-h-[90vh]">
        {/* Header with gradient pro accent */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-100" />
            </div>
            <Badge variant="pro" size="sm" className="bg-white/25 text-white border-white/30 text-[10px]">
              دنگ‌چی Pro
            </Badge>
          </div>

          <h3 className="text-lg font-black text-white">{title}</h3>
          {reason ? (
            <p className="text-xs text-amber-100 mt-1 leading-relaxed">{reason}</p>
          ) : (
            <p className="text-xs text-amber-100 mt-1 leading-relaxed">
              با فعال‌سازی اشتراک، قفل امکانات پیشرفته برای شما باز می‌شود.
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Group Halo Effect Card */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-amber-900">
                قانون طلایی خانه (Group Halo)
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                با خرید اشتراک توسط <strong>حتی یک نفر</strong> در خانه، تمام اعضای آن گروه به امکانات ویژه دسترسی پیدا می‌کنند و نیازی نیست همه اشتراک بخرند!
              </p>
            </div>
          </div>

          {/* Pro Features Checklist */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-700 block">
              امکانات حرفه‌ای در دسترس:
            </span>

            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ایجاد و عضویت در گروه‌های نامحدود</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>صندوق‌های مشترک نامحدود (کارت‌های بانکی خانه)</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>خروجی اکسل (CSV) با کدگذاری استاندارد و بدون خطا</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>پشتیبانی اولویت‌دار و دسترسی به تمام آپدیت‌های آینده</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            شاید بعداً
          </Button>

          <Link href="/app/billing" className="flex-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              rightIcon={<ArrowLeft className="w-3.5 h-3.5 mr-1" />}
            >
              مشاهده پلن‌ها و ارتقا
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
