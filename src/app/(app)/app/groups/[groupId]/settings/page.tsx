"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { UpgradePromptModal } from "@/components/billing/UpgradePromptModal";
import { toPersianDigits, normalizeDigits } from "@/lib/money";
import { formatBankCard, detectIranBank } from "@/lib/iran-banks";
import {
  ArrowRight,
  Settings,
  Users,
  PiggyBank,
  RefreshCw,
  Copy,
  Check,
  Plus,
  ShieldAlert,
  CreditCard,
  Save,
} from "lucide-react";

export default function GroupSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = String(params.groupId);

  const [group, setGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Title
  const [title, setTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [titleSuccess, setTitleSuccess] = useState(false);

  // New Fund
  const [fundTitle, setFundTitle] = useState("");
  const [fundCardNumber, setFundCardNumber] = useState("");
  const [isCreatingFund, setIsCreatingFund] = useState(false);
  const [fundSuccess, setFundSuccess] = useState(false);

  // Upgrade Modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalReason, setUpgradeModalReason] = useState<string | undefined>(undefined);

  const { toast } = useToast();
  // Invite Code
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchGroup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در بارگذاری اطلاعات.");
      }
      setGroup(data.group);
      setTitle(data.group.title);
    } catch (err: any) {
      setError(err.message || "خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroup();
    }
  }, [groupId]);

  const handleUpdateTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 2) return;

    setIsSavingTitle(true);
    setTitleSuccess(false);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در تغییر نام گروه.");

      setTitleSuccess(true);
      toast.success("نام گروه با موفقیت به‌روزرسانی شد.");
      setTimeout(() => setTitleSuccess(false), 3000);
      await fetchGroup();
    } catch (err: any) {
      toast.error(err.message || "خطا در به‌روزرسانی نام گروه.");
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleRegenerateCode = async () => {
    setIsRegenerating(true);
    setShowRegenModal(false);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateInviteCode: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در بازتولید کد دعوت.");
      toast.success("کد دعوت جدید با موفقیت ایجاد شد.");
      await fetchGroup();
    } catch (err: any) {
      toast.error(err.message || "خطا در ایجاد کد جدید.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCreateFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundTitle.trim() || fundTitle.trim().length < 2) return;

    const cleanCard = normalizeDigits(fundCardNumber).replace(/\D/g, "");

    setIsCreatingFund(true);
    setFundSuccess(false);
    try {
      const res = await fetch(`/api/groups/${groupId}/funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fundTitle.trim(),
          cardNumber: cleanCard || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 || data.code === "PRO_REQUIRED") {
          setUpgradeModalReason(data.error);
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(data.error || "خطا در ایجاد صندوق مشترک.");
      }

      setFundTitle("");
      setFundCardNumber("");
      setFundSuccess(true);
      toast.success("صندوق مشترک جدید با موفقیت اضافه شد.");
      setTimeout(() => setFundSuccess(false), 3000);
      await fetchGroup();
    } catch (err: any) {
      toast.error(err.message || "خطا در ایجاد صندوق.");
    } finally {
      setIsCreatingFund(false);
    }
  };

  const handleCopyInvite = () => {
    if (!group) return;
    const inviteUrl = `${window.location.origin}/app/join/${group.inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("لینک دعوت خانه با موفقیت کپی شد!");
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-36 bg-slate-200 animate-pulse rounded-lg" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error || !group) {
    return (
      <Card className="p-6 text-center bg-red-50 text-red-700">
        <p className="text-sm font-semibold">{error || "خطا در بارگذاری."}</p>
        <Link href="/app" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            بازگشت به خانه
          </Button>
        </Link>
      </Card>
    );
  }

  const isOwner = group.myRole === "OWNER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/app/groups/${groupId}`}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-black text-slate-900">تنظیمات گروه</h1>
          <p className="text-xs text-slate-500">{group.title}</p>
        </div>
      </div>

      {/* Group Title Form */}
      <Card className="p-5">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm">ویرایش مشخصات گروه</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleUpdateTitle} className="space-y-3">
            <Input
              label="نام گروه"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isOwner}
              helperText={
                !isOwner
                  ? "تنها مدیر گروه مجاز به تغییر نام گروه است."
                  : undefined
              }
            />

            {titleSuccess && (
              <p className="text-xs font-semibold text-emerald-600">
                نام گروه با موفقیت به‌روزرسانی شد.
              </p>
            )}

            {isOwner && (
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSavingTitle}
                leftIcon={<Save className="w-4 h-4 ml-1" />}
              >
                ذخیره تغییرات
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Invite Code & Sharing */}
      <Card className="p-5">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm">کد و لینک دعوت</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">
                کد دعوت فعلی:
              </span>
              <span className="font-mono text-base font-extrabold text-slate-900 tracking-wider">
                {group.inviteCode}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInvite}
                className="text-xs"
                leftIcon={
                  copied ? (
                    <Check className="w-4 h-4 ml-1 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 ml-1 text-slate-500" />
                  )
                }
              >
                {copied ? "کپی شد" : "کپی لینک"}
              </Button>

              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRegenModal(true)}
                  isLoading={isRegenerating}
                  className="text-xs text-slate-600 hover:text-red-600"
                  leftIcon={<RefreshCw className="w-3.5 h-3.5 ml-1" />}
                >
                  تولید مجدد
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create New Shared Fund */}
      <Card className="p-5">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-indigo-600" />
            تعریف صندوق مشترک جدید (کارت خانه)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleCreateFund} className="space-y-3">
            <Input
              label="عنوان صندوق"
              placeholder="مثال: کارت خرید روزمره، صندوق پس‌انداز سفر"
              value={fundTitle}
              onChange={(e) => setFundTitle(e.target.value)}
            />

            <Input
              label="شماره کارت بانکی (اختیاری)"
              placeholder="۶۰۳۷ - ۹۹۷۱ - ..."
              bankCardMode
              value={fundCardNumber}
              onChange={(e) => setFundCardNumber(e.target.value)}
              helperText="برای واریز سریع اعضا به این کارت مشترک"
            />

            {fundSuccess && (
              <p className="text-xs font-semibold text-emerald-600">
                صندوق جدید با موفقیت اضافه شد.
              </p>
            )}

            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={isCreatingFund}
              leftIcon={<Plus className="w-4 h-4 ml-1" />}
            >
              افزودن صندوق
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card className="p-5">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            لیست اعضای گروه ({toPersianDigits(group.members.length)} نفر)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {group.members.map((m: any) => {
              const bankName = m.cardNumber ? detectIranBank(m.cardNumber) : null;
              return (
                <div
                  key={m.memberId}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{m.name}</span>
                      {m.role === "OWNER" && (
                        <Badge
                          variant="pro"
                          size="sm"
                          className="text-[10px] py-0 px-1.5"
                        >
                          مدیر
                        </Badge>
                      )}
                    </div>
                    <span className="text-slate-400 tabular-nums">
                      {toPersianDigits(m.phone)}
                    </span>
                  </div>

                  {m.cardNumber && (
                    <div className="flex items-center gap-2">
                      {bankName && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {bankName}
                        </span>
                      )}
                      <span className="font-mono text-slate-500 tabular-nums text-[11px]" dir="ltr">
                        {formatBankCard(m.cardNumber)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confirm Regenerate Invite Code Modal */}
      <ConfirmModal
        isOpen={showRegenModal}
        onClose={() => setShowRegenModal(false)}
        onConfirm={handleRegenerateCode}
        title="تولید مجدد کد دعوت خانه"
        description="آیا از ایجاد کد دعوت جدید اطمینان دارید؟ با ایجاد کد جدید، لینک قبلی باطل خواهد شد و اعضا تنها با لینک جدید می‌توانند وارد خانه شوند."
        confirmText="بله، کد جدید بساز"
        cancelText="انصراف"
        variant="warning"
        isLoading={isRegenerating}
      />

      {/* Upgrade to Pro Modal */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="ارتقا جهت ایجاد صندوق‌های بیشتر"
        reason={upgradeModalReason}
        feature="MULTIPLE_FUNDS"
      />
    </div>
  );
}
