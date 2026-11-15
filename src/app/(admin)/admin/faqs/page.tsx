"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { toPersianDigits } from "@/lib/money";
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Search,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Scale,
  Wallet,
  Crown,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react";
import type { FaqItem, FaqCategory } from "@/lib/faq-store";

const CATEGORY_MAP: Record<
  FaqCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  ACCOUNTING: {
    label: "دنگ‌بندی و محاسبات",
    icon: Scale,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  FUND: {
    label: "صندوق و کارت خانه",
    icon: Wallet,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  SUBSCRIPTION: {
    label: "اشتراک ویژه",
    icon: Crown,
    color: "bg-amber-50 text-amber-800 border-amber-200",
  },
  SECURITY: {
    label: "امنیت و نصب",
    icon: ShieldCheck,
    color: "bg-teal-50 text-teal-700 border-teal-200",
  },
};

export default function AdminFaqsPage() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | FaqCategory>("ALL");

  // Modal State for Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [formCategory, setFormCategory] = useState<FaqCategory>("ACCOUNTING");
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [faqToDelete, setFaqToDelete] = useState<FaqItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset defaults modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/faqs");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "خطا در دریافت سوالات متداول.");
      }
      const data = await res.json();
      setFaqs(data.faqs || []);
    } catch (err: any) {
      setError(err.message || "خطای ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const openCreateModal = () => {
    setEditingFaq(null);
    setFormCategory("ACCOUNTING");
    setFormQuestion("");
    setFormAnswer("");
    setFormBadge("");
    setFormOrder(faqs.length + 1);
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: FaqItem) => {
    setEditingFaq(item);
    setFormCategory(item.category);
    setFormQuestion(item.question);
    setFormAnswer(item.answer);
    setFormBadge(item.badge || "");
    setFormOrder(item.order);
    setFormIsActive(item.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || formQuestion.trim().length < 5) {
      setFormError("متن سوال باید حداقل ۵ کاراکتر باشد.");
      return;
    }
    if (!formAnswer.trim() || formAnswer.trim().length < 10) {
      setFormError("متن پاسخ باید حداقل ۱۰ کاراکتر باشد.");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const payload = {
        category: formCategory,
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        badge: formBadge.trim() || undefined,
        order: Number(formOrder) || 1,
        isActive: formIsActive,
      };

      const isEdit = Boolean(editingFaq);
      const url = isEdit ? `/api/admin/faqs/${editingFaq!.id}` : "/api/admin/faqs";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ذخیره‌سازی سوال.");
      }

      toast.success(isEdit ? "ویرایش با موفقیت انجام شد" : "سوال جدید افزوده شد");

      setIsModalOpen(false);
      fetchFaqs();
    } catch (err: any) {
      setFormError(err.message || "خطای ارتباط با سرور");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleActive = async (item: FaqItem) => {
    try {
      const res = await fetch(`/api/admin/faqs/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در تغییر وضعیت نمایش.");
      }
      toast.info(item.isActive ? "سوال از سایت مخفی شد" : "سوال در سایت فعال شد");
      fetchFaqs();
    } catch (err: any) {
      toast.error(err.message || "خطا در تغییر وضعیت");
    }
  };

  const handleReorder = async (item: FaqItem, direction: "up" | "down") => {
    const newOrder = direction === "up" ? Math.max(1, item.order - 1) : item.order + 1;
    try {
      const res = await fetch(`/api/admin/faqs/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder }),
      });
      if (res.ok) {
        fetchFaqs();
      }
    } catch {
      // silent
    }
  };

  const handleDelete = async () => {
    if (!faqToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/faqs/${faqToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در حذف سوال.");
      }
      toast.success("سوال با موفقیت حذف شد");
      setFaqToDelete(null);
      fetchFaqs();
    } catch (err: any) {
      toast.error(err.message || "خطا در حذف سوال");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetDefaults = async () => {
    try {
      setIsResetting(true);
      const res = await fetch("/api/admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_DEFAULTS" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در بازنشانی سوالات.");
      }
      toast.success("سوالات متداول به حالت پیش‌فرض بازنشانی شدند");
      setIsResetModalOpen(false);
      fetchFaqs();
    } catch (err: any) {
      toast.error(err.message || "خطا در بازنشانی");
    } finally {
      setIsResetting(false);
    }
  };

  // Filtered list
  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      const matchesCat =
        selectedCategory === "ALL" || item.category === selectedCategory;
      const q = searchQuery.trim();
      const matchesSearch =
        !q ||
        item.question.includes(q) ||
        item.answer.includes(q) ||
        (item.badge && item.badge.includes(q));
      return matchesCat && matchesSearch;
    });
  }, [faqs, selectedCategory, searchQuery]);

  const activeCount = faqs.filter((f) => f.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900">
              مدیریت محتوای سوالات متداول (FAQ)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            افزودن، ویرایش، تغییر ترتیب و فعال‌سازی سوالات صفحه عمومی /faq
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsResetModalOpen(true)}
            className="text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
            leftIcon={<RotateCcw className="w-3.5 h-3.5 ml-1" />}
          >
            بازنشانی پیش‌فرض
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-sm"
            leftIcon={<Plus className="w-3.5 h-3.5 ml-1" />}
          >
            + افزودن سوال جدید
          </Button>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">کل سوالات ثبت‌شده</span>
            <span className="text-lg font-extrabold text-slate-900 tabular-nums">
              {toPersianDigits(String(faqs.length))} مورد
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">سوالات فعال در سایت عمومی</span>
            <span className="text-lg font-extrabold text-slate-900 tabular-nums">
              {toPersianDigits(String(activeCount))} سوال فعال
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">دسته‌بندی‌های موضوعی</span>
            <span className="text-lg font-extrabold text-slate-900">
              ۴ دسته‌بندی تخصصی
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills & Search Input */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(
            [
              { key: "ALL", label: "همه" },
              { key: "ACCOUNTING", label: "دنگ‌بندی و محاسبات" },
              { key: "FUND", label: "صندوق و کارت خانه" },
              { key: "SUBSCRIPTION", label: "اشتراک ویژه" },
              { key: "SECURITY", label: "امنیت و نصب" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`h-8 px-3 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat.key
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در سوالات و پاسخ‌ها..."
            className="w-full h-9 pr-9 pl-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* FAQ Management Cards List */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            سوالی مطابق با فیلتر انتخابی یافت نشد
          </h3>
          <p className="text-xs text-slate-500">
            می‌توانید با دکمه «+ افزودن سوال جدید» یک سوال تازه در این دسته‌بندی ایجاد کنید.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredFaqs.map((faq) => {
            const cat = CATEGORY_MAP[faq.category] || CATEGORY_MAP.ACCOUNTING;
            const CatIcon = cat.icon;

            return (
              <div
                key={faq.id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-2xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Content */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600 tabular-nums">
                      ترتیب: #{toPersianDigits(String(faq.order))}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 ${cat.color}`}
                    >
                      <CatIcon className="w-3 h-3 shrink-0" />
                      <span>{cat.label}</span>
                    </span>

                    {faq.badge && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {faq.badge}
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        faq.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {faq.isActive ? "فعال در سایت" : "مخفی"}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                    {faq.question}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {faq.answer}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 w-full md:w-auto justify-end">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => handleReorder(faq, "up")}
                    title="انتقال به بالا"
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => handleReorder(faq, "down")}
                    title="انتقال به پایین"
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle Active */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(faq)}
                    title={faq.isActive ? "مخفی کردن از سایت" : "نمایش در سایت"}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      faq.isActive
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {faq.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => openEditModal(faq)}
                    title="ویرایش سوال و پاسخ"
                    className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>ویرایش</span>
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setFaqToDelete(faq)}
                    title="حذف سوال"
                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit FAQ Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">
                {editingFaq ? "ویرایش سوال متداول" : "افزودن سوال جدید به FAQ"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveFaq} className="space-y-4 text-right">
              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  دسته‌بندی موضوعی
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as FaqCategory)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-slate-400"
                >
                  <option value="ACCOUNTING">دنگ‌بندی و محاسبات (ACCOUNTING)</option>
                  <option value="FUND">صندوق و کارت خانه (FUND)</option>
                  <option value="SUBSCRIPTION">اشتراک ویژه (SUBSCRIPTION)</option>
                  <option value="SECURITY">امنیت و نصب برنامه (SECURITY)</option>
                </select>
              </div>

              {/* Question */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  متن پرسش (سوال)
                </label>
                <input
                  type="text"
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="مثلاً: الگوریتم ساده‌سازی بدهی‌ها چگونه کار می‌کند؟"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-slate-400"
                  required
                />
              </div>

              {/* Answer */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  پاسخ کامل و دقیق
                </label>
                <textarea
                  rows={4}
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="پاسخ را با جزئیات و لحن شفاف بنویسید..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-slate-400 leading-relaxed"
                  required
                />
              </div>

              {/* Badge & Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    برچسب ویژه (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="مثلاً: پرتکرارترین سوال"
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    ترتیب نمایش (عدد کوچک‌تر = اول‌تر)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-slate-400"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="faq-active-check"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <label htmlFor="faq-active-check" className="text-xs font-bold text-slate-800 cursor-pointer">
                  نمایش فعال در سایت عمومی (/faq)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-bold"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={formSubmitting}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                >
                  {editingFaq ? "ذخیره تغییرات" : "ایجاد سوال"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(faqToDelete)}
        onClose={() => setFaqToDelete(null)}
        onConfirm={handleDelete}
        title="حذف سوال متداول"
        description={`آیا از حذف سوال «${faqToDelete?.question}» اطمینان دارید؟ این عمل قابل بازگشت نیست.`}
        confirmText="بله، حذف شود"
        cancelText="انصراف"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Reset Defaults Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetDefaults}
        title="بازنشانی سوالات به حالت پیش‌فرض"
        description="آیا مایلید تمام سوالات متداول به ۱۰ سوال پیش‌فرض و استاندارد دنگ‌چی بازنشانی شوند؟ تغییرات دستی شما با مقادیر اولیه جایگزین خواهد شد."
        confirmText="بله، بازنشانی شود"
        cancelText="انصراف"
        variant="warning"
        isLoading={isResetting}
      />
    </div>
  );
}
