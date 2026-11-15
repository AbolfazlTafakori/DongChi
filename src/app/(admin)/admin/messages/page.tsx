"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { toPersianDigits } from "@/lib/money";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  RotateCcw,
  Lightbulb,
  Bug,
  Crown,
  Building2,
  Mail,
  Phone,
  Calendar,
  Check,
} from "lucide-react";
import type { ContactMessageItem, ContactTopic, ContactStatus } from "@/lib/contact-store";

const TOPIC_MAP: Record<
  ContactTopic,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  FEATURE: {
    label: "پیشنهاد قابلیت",
    icon: Lightbulb,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  BUG: {
    label: "گزارش خطا",
    icon: Bug,
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  BILLING: {
    label: "سوال اشتراک",
    icon: Crown,
    color: "bg-amber-50 text-amber-800 border-amber-200",
  },
  PARTNERSHIP: {
    label: "همکاری و خوابگاه",
    icon: Building2,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
};

export default function AdminMessagesPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"ALL" | ContactStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Delete modal state
  const [msgToDelete, setMsgToDelete] = useState<ContactMessageItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/messages");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "خطا در دریافت پیام‌ها.");
      }
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message || "خطای ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleToggleStatus = async (item: ContactMessageItem) => {
    const nextStatus: ContactStatus = item.status === "NEW" ? "RESOLVED" : "NEW";
    try {
      const res = await fetch(`/api/admin/messages/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در تغییر وضعیت پیام.");
      }
      toast.success(
        nextStatus === "RESOLVED"
          ? "پیام به عنوان بررسی‌شده علامت‌گذاری شد"
          : "پیام به وضعیت جدید بازگردانده شد"
      );
      fetchMessages();
    } catch (err: any) {
      toast.error(err.message || "خطا در تغییر وضعیت");
    }
  };

  const handleDelete = async () => {
    if (!msgToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/messages/${msgToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در حذف پیام.");
      }
      toast.success("پیام با موفقیت حذف شد");
      setMsgToDelete(null);
      fetchMessages();
    } catch (err: any) {
      toast.error(err.message || "خطا در حذف پیام");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const matchesStatus =
        statusFilter === "ALL" || msg.status === statusFilter;
      const q = searchQuery.trim();
      const matchesSearch =
        !q ||
        msg.name.includes(q) ||
        msg.contactInfo.includes(q) ||
        msg.message.includes(q) ||
        msg.trackingCode.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [messages, statusFilter, searchQuery]);

  const newCount = messages.filter((m) => m.status === "NEW").length;
  const resolvedCount = messages.filter((m) => m.status === "RESOLVED").length;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900">
              صندوق پیام‌ها و پیشنهادات کاربران
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده، پیگیری و تغییر وضعیت پیام‌های ارسال‌شده از فرم تماس صفحه /about
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchMessages}
          className="text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
          leftIcon={<RotateCcw className="w-3.5 h-3.5 ml-1" />}
        >
          به‌روزرسانی صندوق
        </Button>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">کل پیام‌های دریافتی</span>
            <span className="text-lg font-extrabold text-slate-900 tabular-nums">
              {toPersianDigits(String(messages.length))} پیام
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">پیام‌های جدید (بررسی‌نشده)</span>
            <span className="text-lg font-extrabold text-amber-900 tabular-nums">
              {toPersianDigits(String(newCount))} پیام جدید
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">پیام‌های بررسی‌شده</span>
            <span className="text-lg font-extrabold text-emerald-900 tabular-nums">
              {toPersianDigits(String(resolvedCount))} پیام
            </span>
          </div>
        </div>
      </div>

      {/* Filter Pills & Search */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(
            [
              { key: "ALL", label: "همه پیام‌ها" },
              { key: "NEW", label: "جدید (بررسی‌نشده)" },
              { key: "RESOLVED", label: "بررسی‌شده" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={`h-8 px-3.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === item.key
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام، تماس، متن، کد رهگیری..."
            className="w-full h-9 pr-9 pl-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            پیامی مطابق با فیلتر انتخابی یافت نشد
          </h3>
          <p className="text-xs text-slate-500">
            پیام‌های ارسال‌شده از فرم تماس صفحه «درباره ما» در این بخش نمایش داده می‌شوند.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((msg) => {
            const topic = TOPIC_MAP[msg.topic] || TOPIC_MAP.FEATURE;
            const TopicIcon = topic.icon;

            return (
              <div
                key={msg.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      dir="ltr"
                      className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold"
                    >
                      {msg.trackingCode}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1 ${topic.color}`}
                    >
                      <TopicIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{topic.label}</span>
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        msg.status === "NEW"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {msg.status === "NEW" ? "جدید • در انتظار بررسی" : "بررسی‌شده ✓"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {toPersianDigits(
                        new Date(msg.createdAt).toLocaleString("fa-IR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      )}
                    </span>
                  </div>
                </div>

                {/* Sender Details */}
                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-400 block text-[11px]">فرستنده:</span>
                    <span className="font-extrabold text-slate-900 text-sm">{msg.name}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-400 block text-[11px]">شماره تماس / ایمیل:</span>
                    <span dir="ltr" className="font-mono font-bold text-slate-900">
                      {msg.contactInfo}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed text-justify">
                  {msg.message}
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(msg)}
                    className="text-xs font-bold"
                    leftIcon={msg.status === "NEW" ? <Check className="w-3.5 h-3.5 ml-1" /> : <RotateCcw className="w-3.5 h-3.5 ml-1" />}
                  >
                    {msg.status === "NEW" ? "علامت‌گذاری به عنوان بررسی‌شده" : "بازگردانی به جدید"}
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setMsgToDelete(msg)}
                    className="text-xs font-bold"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 ml-1" />}
                  >
                    حذف پیام
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(msgToDelete)}
        onClose={() => setMsgToDelete(null)}
        onConfirm={handleDelete}
        title="حذف پیام کاربر"
        description={`آیا از حذف پیام با کد رهگیری «${msgToDelete?.trackingCode}» متعلق به «${msgToDelete?.name}» اطمینان دارید؟`}
        confirmText="بله، حذف شود"
        cancelText="انصراف"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
