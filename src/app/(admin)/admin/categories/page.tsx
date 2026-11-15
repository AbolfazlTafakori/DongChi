"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { toPersianDigits } from "@/lib/money";
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  ShoppingCart,
  Home,
  Zap,
  Car,
  Wrench,
  Utensils,
  HeartPulse,
  Package,
  Layers,
  Coffee,
  Sparkles,
} from "lucide-react";

interface AdminCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  expenseCount: number;
}

const AVAILABLE_ICONS = [
  { name: "ShoppingCart", label: "خرید/سوپرمارکت", icon: ShoppingCart },
  { name: "Home", label: "خانه/اجاره", icon: Home },
  { name: "Zap", label: "قبوض/انرژی", icon: Zap },
  { name: "Car", label: "رفت‌وآمد", icon: Car },
  { name: "Wrench", label: "تعمیرات", icon: Wrench },
  { name: "Utensils", label: "رستوران/غذا", icon: Utensils },
  { name: "Coffee", label: "کافه/سرگرمی", icon: Coffee },
  { name: "HeartPulse", label: "درمان/سلامت", icon: HeartPulse },
  { name: "Package", label: "بسته/لوازم", icon: Package },
];

const PRESET_COLORS = [
  "#059669", // Emerald
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#14B8A6", // Teal
  "#EF4444", // Red
  "#6366F1", // Indigo
  "#64748B", // Slate
];

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state
  const [catToDelete, setCatToDelete] = useState<AdminCategory | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("ShoppingCart");
  const [formColor, setFormColor] = useState("#059669");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/categories");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "خطا در دریافت دسته‌بندی‌ها.");
      }
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err: any) {
      setError(err.message || "خطای ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormIcon("ShoppingCart");
    setFormColor("#059669");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormIcon(cat.icon || "ShoppingCart");
    setFormColor(cat.color || "#059669");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("نام دسته‌بندی الزامی است.");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          icon: formIcon,
          color: formColor,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ثبت دسته‌بندی.");

      toast.success(
        editingCategory
          ? "تغییرات دسته‌بندی با موفقیت ذخیره شد."
          : "دسته‌بندی جدید با موفقیت ایجاد شد."
      );
      setIsModalOpen(false);
      await fetchCategories();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!catToDelete) return;

    setIsDeletingCat(true);
    try {
      const res = await fetch(`/api/admin/categories/${catToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در حذف دسته‌بندی.");
      toast.success("دسته‌بندی با موفقیت حذف گردید.");
      setCatToDelete(null);
      await fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "خطا در حذف دسته‌بندی.");
    } finally {
      setIsDeletingCat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            دسته‌بندی‌های سیستمی مخارج
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تعریف و ویرایش دسته‌بندی‌های پیش‌فرض هزینه برای تمام گروه‌ها
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openCreateModal}
          className="text-xs"
          leftIcon={<Plus className="w-4 h-4 ml-1" />}
        >
          دسته‌بندی جدید
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
          {error}
        </div>
      )}

      {/* 2. Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{ backgroundColor: cat.color }}
                >
                  <Tag className="w-5 h-5" />
                </div>

                <div>
                  <span className="font-bold text-sm text-slate-900 block">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {toPersianDigits(cat.expenseCount)} هزینه ثبت‌شده
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(cat)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="ویرایش"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCatToDelete(cat)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL: CREATE / EDIT CATEGORY --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                {editingCategory ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی جدید"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  عنوان دسته‌بندی
                </label>
                <Input
                  type="text"
                  placeholder="مثال: اینترنت و قبوض"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              {/* Color Preset Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  رنگ تم دسته‌بندی
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        formColor === c ? "scale-110 ring-2 ring-slate-900" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {formColor === c && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  آیکون دسته‌بندی
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABLE_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = formIcon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setFormIcon(item.name)}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-colors ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[10px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={formSubmitting}
                  className="text-xs"
                >
                  {editingCategory ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!catToDelete}
        onClose={() => setCatToDelete(null)}
        onConfirm={executeDelete}
        title="حذف دسته‌بندی سیستمی"
        description={`آیا از حذف دسته‌بندی سیستمی «${catToDelete?.name}» اطمینان دارید؟ اگر این دسته‌بندی در فاکتورهای قبلی استفاده شده باشد، امکان حذف آن وجود نخواهد داشت.`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        isLoading={isDeletingCat}
      />
    </div>
  );
}
