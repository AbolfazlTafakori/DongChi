"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { toPersianDigits } from "@/lib/money";
import {
  Layers,
  Search,
  ShieldCheck,
  Trash2,
  Lock,
  Users,
  Receipt,
  PiggyBank,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface AdminGroup {
  id: string;
  title: string;
  currency: string;
  inviteCode: string;
  createdAt: string;
  creatorName: string;
  creatorPhone: string;
  memberCount: number;
  expenseCount: number;
  fundCount: number;
}

export default function AdminGroupsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Delete modal state
  const [groupToDelete, setGroupToDelete] = useState<AdminGroup | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = search.trim()
        ? `/api/admin/groups?search=${encodeURIComponent(search.trim())}`
        : "/api/admin/groups";

      const res = await fetch(url);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "خطا در دریافت لیست گروه‌ها.");
      }
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (err: any) {
      setError(err.message || "خطای ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGroups();
  };

  const executeDeleteGroup = async () => {
    if (!groupToDelete) return;

    setIsDeletingGroup(true);
    try {
      const res = await fetch(`/api/admin/groups/${groupToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در حذف گروه.");
      toast.success("گروه با موفقیت حذف گردید.");
      setGroupToDelete(null);
      await fetchGroups();
    } catch (err: any) {
      toast.error(err.message || "خطا در حذف گروه.");
    } finally {
      setIsDeletingGroup(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            مدیریت گروه‌ها و خانه‌ها
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده متادیتا، پایش فعالیت و مدیریت یا حذف گروه‌های هرزنامه
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="جستجو با عنوان یا کد دعوت..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs h-9 w-full sm:w-56"
            rightIcon={<Search className="w-3.5 h-3.5" />}
          />
          <Button type="submit" variant="primary" size="sm" className="h-9 px-3 text-xs shrink-0">
            جستجو
          </Button>
        </form>
      </div>

      {/* 2. Privacy By Design Notice Banner */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs flex items-start gap-3 shadow-xs">
        <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>حفظ کامل حریم خصوصی کاربران (Privacy by Design):</strong> به منظور حفظ محرمانگی مالی خانواده‌ها، در پنل مدیریت صرفاً متادیتای آماری (تعداد اعضا و اسناد) نمایش داده می‌شود و عناوین فاکتورهای خانوادگی، تصاویر رسیدها و ترازهای شخصی برای مدیران غیرقابل مشاهده است.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
          {error}
        </div>
      )}

      {/* 3. Groups List */}
      <Card className="shadow-xs overflow-hidden border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold text-slate-900">
            لیست گروه‌ها ({toPersianDigits(groups.length)} گروه)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : groups.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              هیچ گروهی یافت نشد.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                      🏠
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {g.title}
                        </span>
                        <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                          کد: {g.inviteCode}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 tabular-nums">
                        <span>سازنده: {g.creatorName} ({toPersianDigits(g.creatorPhone)})</span>
                        <span>•</span>
                        <span>{toPersianDigits(g.memberCount)} عضو</span>
                        <span>•</span>
                        <span>{toPersianDigits(g.fundCount)} صندوق</span>
                        <span>•</span>
                        <span>{toPersianDigits(g.expenseCount)} فاکتور</span>
                        <span>•</span>
                        <span>ایجاد: {new Date(g.createdAt).toLocaleDateString("fa-IR")}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGroupToDelete(g)}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 self-end sm:self-auto shrink-0"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 ml-1" />}
                  >
                    حذف گروه
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Delete Group Modal */}
      <ConfirmModal
        isOpen={!!groupToDelete}
        onClose={() => setGroupToDelete(null)}
        onConfirm={executeDeleteGroup}
        title="حذف کامل خانه و داده‌ها"
        description={`هشدار مهم: آیا از حذف کامل گروه «${groupToDelete?.title}» اطمینان دارید؟ تمام هزینه‌ها، صندوق‌ها و سوابق این گروه برای همیشه حذف خواهند شد و این عملیات غیرقابل بازگشت است.`}
        confirmText="بله، برای همیشه حذف کن"
        cancelText="انصراف"
        variant="danger"
        isLoading={isDeletingGroup}
      />
    </div>
  );
}
