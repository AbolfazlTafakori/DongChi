"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { formatToman, toPersianDigits, parseToman } from "@/lib/money";
import { formatBankCard, detectIranBank } from "@/lib/iran-banks";
import {
  ArrowRight,
  HandCoins,
  Copy,
  Check,
  CreditCard,
  AlertCircle,
  Save,
  CheckCircle2,
  Zap,
  RefreshCw,
} from "lucide-react";

export default function SettleUpPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = String(params.groupId);
  const { toast } = useToast();

  const [group, setGroup] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fromUserId, setFromUserId] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);

  useEffect(() => {
    const loadGroup = async () => {
      setIsLoading(true);
      try {
        const [groupRes, profileRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/user/profile`),
        ]);

        const groupData = await groupRes.json();
        const profileData = await profileRes.json();

        if (!groupRes.ok) throw new Error(groupData.error || "خطا در دریافت اطلاعات گروه.");

        setGroup(groupData.group);
        setCurrentUser(profileData.user);

        // Pre-populate from query params
        const qFrom = searchParams.get("from");
        const qTo = searchParams.get("to");
        const qAmount = searchParams.get("amount");

        if (qFrom) setFromUserId(qFrom);
        else if (profileData.user) setFromUserId(profileData.user.id);

        if (qTo) setToUserId(qTo);
        else {
          // Select another member
          const other = groupData.group.members.find(
            (m: any) => m.userId !== (qFrom || profileData.user?.id)
          );
          if (other) setToUserId(other.userId);
        }

        if (qAmount) setAmountStr(qAmount);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      loadGroup();
    }
  }, [groupId, searchParams]);

  const parsedAmount = parseToman(amountStr);

  const recipientMember = group?.members.find((m: any) => m.userId === toUserId);

  const handleCopyCard = () => {
    if (!recipientMember?.cardNumber) return;
    navigator.clipboard.writeText(recipientMember.cardNumber);
    setCopiedCard(true);
    toast.success("شماره کارت بانکی با موفقیت کپی شد!");
    setTimeout(() => setCopiedCard(false), 2500);
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromUserId || !toUserId || parsedAmount <= 0n) return;
    if (fromUserId === toUserId) {
      setError("پرداخت‌کننده و دریافت‌کننده نمی‌توانند یکسان باشند.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId,
          toUserId,
          amount: parsedAmount.toString(),
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ثبت تسویه.");

      toast.success("تسویه‌حساب با موفقیت ثبت شد.");
      router.push(`/app/groups/${groupId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isP2pInitiating, setIsP2pInitiating] = useState(false);

  const handleP2pOnlinePay = async () => {
    if (!toUserId || parsedAmount <= 0n) return;
    setIsP2pInitiating(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/settlements/p2p-initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId,
          amount: parsedAmount.toString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ایجاد درخواست پرداخت مستقیم P2P");
      }

      router.push(data.paymentUrl);
    } catch (err: any) {
      toast.error(err.message || "خطا در اتصال به درگاه");
    } finally {
      setIsP2pInitiating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        در حال بارگذاری صفحه تسویه‌حساب...
      </div>
    );
  }

  if (error && !group) {
    return (
      <Card className="p-6 text-center bg-red-50 text-red-700">
        <p className="text-sm font-semibold">{error}</p>
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
            <HandCoins className="w-5 h-5 text-emerald-600" />
            ثبت تسویه‌حساب بین دو عضو
          </h1>
          <p className="text-xs text-slate-500">{group?.title}</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Settle Form Card */}
      <Card className="p-5 shadow-xs">
        <form onSubmit={handleSettleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              پرداخت‌کننده (چه کسی پول واریز کرد؟)
            </label>
            <select
              value={fromUserId}
              onChange={(e) => setFromUserId(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              {group?.members.map((m: any) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} {m.userId === currentUser?.id ? "(شما)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              دریافت‌کننده (به حساب چه کسی واریز شد؟)
            </label>
            <select
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              {group?.members.map((m: any) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} {m.userId === currentUser?.id ? "(شما)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Smart Card Copy Box */}
          {recipientMember?.cardNumber && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-emerald-800 font-medium block">
                      شماره کارت {recipientMember.name}:
                    </span>
                    {detectIranBank(recipientMember.cardNumber) && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                        {detectIranBank(recipientMember.cardNumber)}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-950 tabular-nums tracking-wider" dir="ltr">
                    {formatBankCard(recipientMember.cardNumber)}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCard}
                className="bg-white text-xs"
                leftIcon={
                  copiedCard ? (
                    <Check className="w-4 h-4 text-emerald-600 ml-1" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500 ml-1" />
                  )
                }
              >
                {copiedCard ? "کپی شد" : "کپی کارت"}
              </Button>
            </div>
          )}

          <Input
            label="مبلغ تسویه (تومان)"
            placeholder="مثال: ۲۰۰,۰۰۰"
            numericOnly
            currencyPreview
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="توضیحات (اختیاری)"
            placeholder="مثال: تسویه دنگ سفر، واریز کارت به کارت"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="pt-2 space-y-2.5">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-sm font-bold shadow-md"
              disabled={isSubmitting || isP2pInitiating || parsedAmount <= 0n || fromUserId === toUserId}
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4 ml-1" />}
            >
              ثبت تسویه دستی (کارت‌به‌کارت انجام شد)
            </Button>

            <button
              type="button"
              onClick={handleP2pOnlinePay}
              disabled={isSubmitting || isP2pInitiating || parsedAmount <= 0n || fromUserId === toUserId}
              className="w-full h-12 rounded-xl bg-gradient-to-l from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isP2pInitiating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>در حال اتصال به درگاه پرداخت شاپرک...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>⚡ پرداخت آنلاین مستقیم از درگاه به حساب طلبکار (فاز ۲)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
