"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ArrowRight, Receipt, PlusCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function NewExpensePage() {
  const params = useParams();
  const groupId = String(params.groupId);

  const [group, setGroup] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [groupRes, profileRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/user/profile`),
        ]);

        const groupData = await groupRes.json();
        const profileData = await profileRes.json();

        if (!groupRes.ok) {
          throw new Error(groupData.error || "خطا در دریافت اطلاعات گروه.");
        }

        setGroup(groupData.group);
        setCurrentUser(profileData.user);
      } catch (err: any) {
        setError(err.message || "خطای ارتباط با سرور");
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      loadData();
    }
  }, [groupId]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        در حال آماده‌سازی فرم ثبت خرج...
      </div>
    );
  }

  if (error || !group) {
    return (
      <Card className="p-6 text-center bg-red-50 text-red-700">
        <p className="text-sm font-semibold">{error || "گروه یافت نشد."}</p>
        <Link href={`/app/groups/${groupId}`} className="mt-4 inline-block">
          بازگشت به گروه
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/app/groups/${groupId}`}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            ثبت هزینه جدید
          </h1>
          <p className="text-xs text-slate-500">{group.title}</p>
        </div>
      </div>

      <ExpenseForm
        groupId={groupId}
        members={group.members}
        funds={group.funds}
        currentUserId={currentUser?.id || ""}
      />
    </div>
  );
}
