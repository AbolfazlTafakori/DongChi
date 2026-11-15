"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ArrowRight, Edit3 } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function EditExpensePage() {
  const params = useParams();
  const groupId = String(params.groupId);
  const expenseId = String(params.expenseId);

  const [group, setGroup] = useState<any>(null);
  const [expense, setExpense] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [groupRes, expenseRes, profileRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/groups/[groupId]/expenses/${expenseId}`.replace("[groupId]", groupId)),
          fetch(`/api/user/profile`),
        ]);

        const groupData = await groupRes.json();
        const expenseData = await expenseRes.json();
        const profileData = await profileRes.json();

        if (!groupRes.ok) {
          throw new Error(groupData.error || "خطا در دریافت اطلاعات گروه.");
        }
        if (!expenseRes.ok) {
          throw new Error(expenseData.error || "خطا در دریافت سند هزینه.");
        }

        setGroup(groupData.group);
        setExpense(expenseData.expense);
        setCurrentUser(profileData.user);
      } catch (err: any) {
        setError(err.message || "خطای ارتباط با سرور");
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId && expenseId) {
      loadData();
    }
  }, [groupId, expenseId]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        در حال بارگذاری مشخصات سند هزینه...
      </div>
    );
  }

  if (error || !group || !expense) {
    return (
      <Card className="p-6 text-center bg-red-50 text-red-700">
        <p className="text-sm font-semibold">{error || "سند هزینه یافت نشد."}</p>
        <Link href={`/app/groups/${groupId}`} className="mt-4 inline-block">
          بازگشت به گروه
        </Link>
      </Card>
    );
  }

  // Map initial data
  const initialData = {
    id: expense.id,
    title: expense.title,
    totalAmount: expense.totalAmount,
    categoryId: expense.categoryId,
    paymentSource: expense.paymentSource,
    paidByUserId: expense.paidByUserId,
    fundId: expense.fundId,
    splitType: expense.splits[0]?.splitType || "EQUAL",
    expenseDate: expense.expenseDate,
    splits: expense.splits.map((s: any) => ({
      userId: s.userId,
      owedAmount: s.owedAmount,
      shareValue: s.shareValue,
    })),
  };

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
            <Edit3 className="w-5 h-5 text-indigo-600" />
            ویرایش سند هزینه
          </h1>
          <p className="text-xs text-slate-500">{group.title}</p>
        </div>
      </div>

      <ExpenseForm
        groupId={groupId}
        members={group.members}
        funds={group.funds}
        currentUserId={currentUser?.id || ""}
        initialData={initialData}
      />
    </div>
  );
}
