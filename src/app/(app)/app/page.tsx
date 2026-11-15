"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { UpgradePromptModal } from "@/components/billing/UpgradePromptModal";
import { MobileNeobankHome } from "@/components/mobile/MobileNeobankHome";
import { formatToman, toPersianDigits, numberToPersianWords } from "@/lib/money";
import {
  Users,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  CheckCircle2,
  ChevronLeft,
  QrCode,
  Sparkles,
  ShieldCheck,
  X,
  CreditCard,
  Building,
  HandCoins,
  Receipt,
  Copy,
  Check,
  Search,
  ArrowLeft,
  ExternalLink,
  Flame,
  Info,
  Calculator,
} from "lucide-react";

interface GroupSummary {
  id: string;
  title: string;
  currency: string;
  inviteCode: string;
  createdAt: string;
  myRole: "OWNER" | "MEMBER";
  memberCount: number;
  totalFundBalance: string;
  myNetBalance: string;
}

interface SuggestedSettlement {
  groupId: string;
  groupTitle: string;
  counterpartyName: string;
  counterpartyId: string;
  type: "OWE" | "OWED";
  amount: string;
  settleUrl: string;
}

interface CoMemberCard {
  userId: string;
  name: string;
  phone: string;
  cardNumber: string | null;
  formattedCard: string | null;
  bankName: string | null;
  groupTitles: string[];
}

interface RecentActivity {
  id: string;
  type: "EXPENSE" | "SETTLEMENT";
  title: string;
  amount: string;
  groupTitle: string;
  groupId: string;
  categoryName?: string;
  categoryColor?: string;
  date: string;
}

export default function AppHomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [dashboardData, setDashboardData] = useState<{
    groups: GroupSummary[];
    suggestedSettlements: SuggestedSettlement[];
    coMembersCards: CoMemberCard[];
    recentActivities: RecentActivity[];
    announcement: any;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState("");
  const [copiedCardUserId, setCopiedCardUserId] = useState<string | null>(null);
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false);

  // Upgrade Modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalReason, setUpgradeModalReason] = useState<string | undefined>(undefined);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newInitialFund, setNewInitialFund] = useState("صندوق مشترک خانه");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join form state
  const [joinCode, setJoinCode] = useState("");
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Quick Split Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(600000);
  const [calcMembers, setCalcMembers] = useState<number>(3);
  const [copiedCalc, setCopiedCalc] = useState(false);

  const calcPerPerson = calcMembers > 0 ? Math.ceil(calcAmount / calcMembers) : 0;

  const handleCopyCalcShare = () => {
    const text = `حساب دنگ‌چی: از فاکتور ${formatToman(BigInt(calcAmount))} بین ${toPersianDigits(calcMembers)} نفر، سهم هر نفر دقیقاً ${formatToman(BigInt(calcPerPerson))} است.`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCalc(true);
      toast.success("متن دنگ کپی شد. می‌توانید در پیام‌رسان‌ها ارسال کنید.");
      setTimeout(() => setCopiedCalc(false), 2500);
    }
  };

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در دریافت اطلاعات داشبورد.");
      }
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || "خطای ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") setShowCreateModal(true);
    if (action === "join") setShowJoinModal(true);
    if (action === "quick-expense") {
      if (dashboardData?.groups && dashboardData.groups.length === 1) {
        router.push(`/app/groups/${dashboardData.groups[0].id}/expenses/new`);
      } else {
        setShowQuickExpenseModal(true);
      }
    }
  }, [searchParams, dashboardData?.groups]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newTitle.trim()) {
      setCreateError("نام گروه الزامی است.");
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          initialFundTitle: newInitialFund.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 || data.code === "PRO_REQUIRED") {
          setShowCreateModal(false);
          setUpgradeModalReason(data.error);
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(data.error || "خطا در ساخت گروه.");
      }

      setShowCreateModal(false);
      setNewTitle("");
      setNewInitialFund("صندوق مشترک خانه");
      toast.success("خانه جدید با موفقیت ایجاد شد.");
      router.push(`/app/groups/${data.group.id}`);
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    if (!joinCode.trim()) {
      setJoinError("کد دعوت ۸ رقمی را وارد کنید.");
      return;
    }

    setIsSubmittingJoin(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinCode.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در پیوستن به گروه.");
      }

      setShowJoinModal(false);
      setJoinCode("");
      toast.success("با موفقیت به خانه پیوستید.");
      router.push(`/app/groups/${data.groupId}`);
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  const handleCopyCard = (userId: string, cardNum: string) => {
    const raw = cardNum.replace(/\D/g, "");
    navigator.clipboard.writeText(raw);
    setCopiedCardUserId(userId);
    toast.success("شماره کارت کپی شد!");
    setTimeout(() => setCopiedCardUserId(null), 2500);
  };

  const groups = dashboardData?.groups || [];
  const suggestedSettlements = dashboardData?.suggestedSettlements || [];
  const coMembersCards = dashboardData?.coMembersCards || [];
  const recentActivities = dashboardData?.recentActivities || [];
  const announcement = dashboardData?.announcement;

  // Aggregate Metrics
  const totalNet = groups.reduce((acc, g) => acc + BigInt(g.myNetBalance), 0n);
  const totalCredit = groups.reduce((acc, g) => {
    const val = BigInt(g.myNetBalance);
    return val > 0n ? acc + val : acc;
  }, 0n);
  const totalDebt = groups.reduce((acc, g) => {
    const val = BigInt(g.myNetBalance);
    return val < 0n ? acc - val : acc;
  }, 0n);
  const totalFundsSum = groups.reduce(
    (acc, g) => acc + BigInt(g.totalFundBalance),
    0n
  );

  const filteredGroups = groups.filter((g) =>
    g.title.toLowerCase().includes(groupSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 0. Optional System Announcement Banner (Dismissible) */}
      {announcement && announcement.isActive && !isAnnouncementDismissed && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold shadow-xs transition-all ${
            announcement.type === "warning"
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : announcement.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Info className="w-4 h-4 shrink-0 text-blue-600" />
            <span className="truncate">{announcement.message}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              اطلاعیه دنگ‌چی
            </span>
            <button
              type="button"
              onClick={() => setIsAnnouncementDismissed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              title="بستن اطلاعیه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Mobile-Only Dedicated Neobank Native Home (< lg) */}
      <div className="lg:hidden">
        <MobileNeobankHome
          groups={groups}
          suggestedSettlements={suggestedSettlements}
          coMembersCards={coMembersCards}
          recentActivities={recentActivities}
          totalNet={totalNet}
          totalOwed={totalCredit}
          totalDebt={totalDebt}
          totalFundAll={totalFundsSum}
          isPro={false}
          onOpenQuickExpense={(groupId) => {
            if (groupId) {
              router.push(`/app/groups/${groupId}/expenses/new`);
            } else {
              setShowQuickExpenseModal(true);
            }
          }}
          onOpenCreateGroup={() => setShowCreateModal(true)}
          onOpenJoinGroup={() => setShowJoinModal(true)}
          onOpenSplitCalculator={() => {
            const el = document.getElementById("instant-calculator-card");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          copiedCardUserId={copiedCardUserId}
          onCopyCard={handleCopyCard}
        />
      </div>

      {/* 2. Desktop Widescreen Layout (>= lg) */}
      <div className="hidden lg:block space-y-6">
        {/* 1. Row 1 — 4 Balanced Financial Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: تراز خالص کل شما */}
        <Card className="p-5 shadow-xs border-slate-200 bg-white rounded-2xl flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">تراز خالص کل شما</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                totalNet > 0n
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : totalNet < 0n
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {totalNet > 0n ? "طلبکار" : totalNet < 0n ? "بدهکار" : "تسویه"}
            </span>
          </div>
          <div>
            <div
              className={`text-2xl font-black tabular-nums ${
                totalNet > 0n
                  ? "text-emerald-600"
                  : totalNet < 0n
                  ? "text-rose-600"
                  : "text-slate-900"
              }`}
            >
              {totalNet > 0n ? "+" : ""}
              {formatToman(totalNet)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              معادل: {numberToPersianWords(totalNet, { includeCurrency: true })}
            </p>
          </div>
        </Card>

        {/* KPI 2: مجموع طلب از همخانه‌ها */}
        <Card className="p-5 shadow-xs border-slate-200 bg-white rounded-2xl flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">مجموع طلب از همخانه‌ها</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 tabular-nums">
              {totalCredit > 0n ? `+${formatToman(totalCredit)}` : formatToman(0n)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              مبالغ پرداختی توسط شما در گروه‌ها
            </p>
          </div>
        </Card>

        {/* KPI 3: مجموع بدهی به همخانه‌ها */}
        <Card className="p-5 shadow-xs border-slate-200 bg-white rounded-2xl flex flex-col justify-between hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">مجموع بدهی به همخانه‌ها</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600 tabular-nums">
              {totalDebt > 0n ? `-${formatToman(totalDebt)}` : formatToman(0n)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              سهم دنگ‌های شما برای تسویه
            </p>
          </div>
        </Card>

        {/* KPI 4: موجودی صندوق‌های مشترک */}
        <Card className="p-5 shadow-xs border-slate-200 bg-white rounded-2xl flex flex-col justify-between hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">موجودی صندوق‌های مشترک</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              {formatToman(totalFundsSum)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              جمع موجودی کارت‌های مشترک خانه‌ها
            </p>
          </div>
        </Card>
      </div>

      {/* 2. Row 2 — Main 12-Column Desktop Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right Column: گروه‌ها و خانه‌های من (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Unified Section Header Bar: Single Home for Group Actions */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                    گروه‌ها و خانه‌های من
                  </h2>
                  <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full tabular-nums border border-slate-200/70">
                    {toPersianDigits(groups.length)} خانه
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  مدیریت هزینه‌های مشترک، اعضا و صندوق تنخواه
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowJoinModal(true)}
                className="text-xs h-9 font-bold bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                leftIcon={<QrCode className="w-3.5 h-3.5 ml-1 text-indigo-600" />}
              >
                ورود با کد دعوت
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="text-xs h-9 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                leftIcon={<Plus className="w-3.5 h-3.5 ml-1" />}
              >
                + ساخت گروه جدید
              </Button>
            </div>
          </div>

          {/* Search bar if >3 groups */}
          {groups.length > 3 && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="جستجو در میان خانه‌ها..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="w-full h-10 bg-white border border-slate-200 rounded-xl pr-9 pl-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : error ? (
            <Card className="p-4 bg-red-50 border-red-200 text-red-700 text-xs text-center">
              {error}
            </Card>
          ) : groups.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center border-dashed border-2 border-slate-200/90 rounded-2xl bg-white space-y-6">
              <div className="max-w-md mx-auto space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-xs border border-emerald-100">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  هنوز عضو هیچ گروهی نیستید!
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  دنگ‌چی حساب و کتاب هزینه‌ها، خریدها و شارژ صندوق مشترک خانه شما را شفاف و خودکار محاسبه می‌کند.
                </p>
              </div>

              {/* 3-Step Walkthrough Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-right">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                    ۱
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">ساخت گروه خانه</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    نام گروه خانه و در صورت تمایل موجودی اولیه صندوق را ثبت کنید.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 text-[11px] font-black flex items-center justify-center">
                    ۲
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">دعوت همخانه‌ها</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    کد دعوت ۶ رقمی یا لینک سریع را برای همخانه‌ها ارسال کنید.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-black flex items-center justify-center">
                    ۳
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">ثبت خرج و تسویه</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    هزینه‌ها را ثبت کنید تا دنگ‌چی بهینه‌ترین حالت تسویه را بسازد.
                  </p>
                </div>
              </div>

              <div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowCreateModal(true)}
                  className="h-11 px-6 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                  leftIcon={<Plus className="w-4 h-4 ml-1.5" />}
                >
                  شروع و ساخت اولین گروه خانه
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {filteredGroups.map((group) => {
                const netVal = BigInt(group.myNetBalance);
                const isCreditor = netVal > 0n;
                const isDebtor = netVal < 0n;

                return (
                  <Card
                    key={group.id}
                    className="p-5 bg-white border border-slate-200 hover:border-emerald-500/40 rounded-2xl transition-all shadow-xs space-y-4"
                  >
                    {/* Top Row: Title + Role + Member count + User balance badge */}
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/app/groups/${group.id}`}
                        className="flex items-center gap-3 group/link flex-1 min-w-0"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-800 font-extrabold flex items-center justify-center text-base shrink-0 group-hover/link:scale-105 transition-transform">
                          {group.title.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-slate-900 group-hover/link:text-emerald-700 transition-colors truncate">
                              {group.title}
                            </h3>
                            {group.myRole === "OWNER" && (
                              <Badge
                                variant="pro"
                                size="sm"
                                className="text-[10px] py-0 px-1.5"
                              >
                                مدیر
                              </Badge>
                            )}
                            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium tabular-nums">
                              {toPersianDigits(group.memberCount)} عضو
                            </span>
                          </div>
                        </div>
                      </Link>

                      <div className="text-left shrink-0">
                        <span
                          className={`text-xs font-black block tabular-nums ${
                            isCreditor
                              ? "text-emerald-600"
                              : isDebtor
                              ? "text-rose-600"
                              : "text-slate-500"
                          }`}
                        >
                          {isCreditor && "+"}
                          {formatToman(netVal)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {isCreditor
                            ? "طلب شما"
                            : isDebtor
                            ? "بدهی شما"
                            : "تسویه"}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Status Strip (Fund Balance + Monthly Budget Status) */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <PiggyBank className="w-4 h-4 text-indigo-500" />
                        <span>موجودی صندوق:</span>
                        <span className="font-bold text-slate-800 tabular-nums">
                          {formatToman(BigInt(group.totalFundBalance))}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>وضعیت بودجه ماه: فعال</span>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/app/groups/${group.id}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center transition-colors"
                      >
                        ورود به فضای گروه ←
                      </Link>
                      <Link
                        href={`/app/groups/${group.id}/expenses/new`}
                        className="py-2 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ ثبت خرج</span>
                      </Link>
                      <Link
                        href={`/app/groups/${group.id}/reports`}
                        className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
                      >
                        گزارش‌ها
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Left Column: میز تسویه و شماره کارت‌ها (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card A: تسویه‌های پیشنهادی من (Smart Settlements) */}
          <Card className="p-5 shadow-xs border-slate-200 space-y-3.5 bg-white rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-xs text-slate-900">
                  تسویه‌های پیشنهادی من
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                حداقل تراکنش
              </span>
            </div>

            {suggestedSettlements.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center text-xs text-emerald-800 font-medium">
                حساب شما در تمام گروه‌ها کاملاً صاف است! ✓
              </div>
            ) : (
              <div className="space-y-2.5">
                {suggestedSettlements.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">
                          {st.type === "OWE"
                            ? `بدهکار به ${st.counterpartyName}`
                            : `طلبکار از ${st.counterpartyName}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({st.groupTitle})
                        </span>
                      </div>
                      <span className="text-emerald-700 font-extrabold tabular-nums block mt-0.5">
                        {formatToman(BigInt(st.amount))}
                      </span>
                    </div>

                    <Link href={st.settleUrl}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] h-8 bg-white border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-50"
                      >
                        تسویه آنی ←
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Card B: دفترچه کارت بانکی همخانه‌ها (Bank Card Directory) */}
          <Card className="p-5 shadow-xs border-slate-200 space-y-3.5 bg-white rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-xs text-slate-900">
                  دفترچه کارت بانکی همخانه‌ها
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">کپی تک‌کلیکی</span>
            </div>

            {coMembersCards.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  هنوز شماره کارتی در گروه‌های شما ثبت نشده است.
                </p>
                <Link
                  href="/app/profile"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span>ثبت شماره کارت خودم در پروفایل</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto">
                {coMembersCards.map((cm) => (
                  <div
                    key={cm.userId}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{cm.name}</span>
                        {cm.bankName && (
                          <Badge variant="neutral" size="sm" className="text-[9px] py-0">
                            {cm.bankName}
                          </Badge>
                        )}
                      </div>
                      {cm.formattedCard ? (
                        <span
                          className="font-mono text-slate-600 text-[11px] tracking-wider block mt-1"
                          dir="ltr"
                        >
                          {cm.formattedCard}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-1">
                          شماره کارت ثبت نشده
                        </span>
                      )}
                    </div>

                    {cm.cardNumber && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyCard(cm.userId, cm.cardNumber!)}
                        className="text-[10px] h-7 bg-white gap-1"
                      >
                        {copiedCardUserId === cm.userId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>کپی شد</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>کپی</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Split Calculator (Live interactive tool right above Recent Ledger) */}
          <Card className="p-5 shadow-xs border-slate-200 space-y-4 bg-white rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 leading-tight">
                    ماشین‌حساب فوری دنگ
                  </h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    محاسبه سرانگشتی بدون نیاز به ساخت گروه
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full font-bold">
                محاسبه آنی
              </span>
            </div>

            {/* Input Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">مبلغ کل فاکتور (تومان):</label>
                {calcAmount > 0 && (
                  <span className="text-[11px] text-emerald-700 font-extrabold tabular-nums">
                    {formatToman(BigInt(calcAmount))}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={calcAmount ? toPersianDigits(calcAmount.toLocaleString("en-US")) : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9۰-۹]/g, "");
                    const englishDigits = raw.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
                    const num = parseInt(englishDigits, 10) || 0;
                    setCalcAmount(Math.min(num, 500000000));
                  }}
                  placeholder="مثال: ۶۰۰,۰۰۰"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/60 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-left transition-all"
                />
              </div>

              {/* Quick Preset Chips */}
              <div className="flex items-center gap-1.5 pt-1">
                {[300000, 600000, 1200000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCalcAmount(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      calcAmount === preset
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                  >
                    {toPersianDigits(preset.toLocaleString("en-US"))}
                  </button>
                ))}
              </div>
            </div>

            {/* Member Count Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">تعداد نفرات:</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[2, 3, 4, 5, 6].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setCalcMembers(cnt)}
                    className={`h-9 rounded-xl text-xs font-extrabold transition-all border ${
                      calcMembers === cnt
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {toPersianDigits(cnt)} نفر
                  </button>
                ))}
              </div>
            </div>

            {/* Live Per-Person Result & Copy */}
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">سهم دنگ هر نفر:</span>
                <span className="text-sm font-black text-emerald-800 tabular-nums">
                  {formatToman(BigInt(calcPerPerson))}
                </span>
              </div>
              {calcPerPerson > 0 && (
                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  معادل {numberToPersianWords(calcPerPerson)} تومان برای هر نفر
                </p>
              )}

              <button
                type="button"
                onClick={handleCopyCalcShare}
                className="w-full h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                {copiedCalc ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>متن دنگ کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی متن دنگ برای پیام‌رسان‌ها</span>
                  </>
                )}
              </button>
            </div>
          </Card>

          {/* Card C: فعالیت‌های اخیر (Recent Ledger) */}
          <Card className="p-5 shadow-xs border-slate-200 space-y-3.5 bg-white rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-xs text-slate-900">
                  فعالیت‌های اخیر
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">۵ مورد آخر</span>
            </div>

            {recentActivities.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                هنوز تراکنشی ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span>{act.title}</span>
                        {act.categoryName && (
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-medium"
                            style={{
                              backgroundColor: `${act.categoryColor}20`,
                              color: act.categoryColor,
                            }}
                          >
                            {act.categoryName}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {act.groupTitle} • {toPersianDigits(new Date(act.date).toLocaleDateString("fa-IR"))}
                      </span>
                    </div>

                    <span className="font-extrabold text-slate-900 tabular-nums">
                      {formatToman(BigInt(act.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
      </div>

      {/* QUICK EXPENSE GROUP PICKER MODAL */}
      {showQuickExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">
                انتخاب خانه برای ثبت خرج
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickExpenseModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              مایلید خرج جدید را در کدام خانه ثبت نمایید؟
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setShowQuickExpenseModal(false);
                    router.push(`/app/groups/${g.id}/expenses/new`);
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center justify-between text-xs font-bold transition-all text-slate-900"
                >
                  <span>{g.title}</span>
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="w-full max-w-md shadow-2xl border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  ساخت گروه جدید
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  گروهی برای هزینه‌های خانه، خوابگاه یا سفر مشترک بسازید
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="pt-4">
              {createError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <Input
                  label="نام گروه یا خانه"
                  placeholder="مثال: خانه صادقیه، هم‌دانشگاهی‌ها، سفر کیش"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                />

                <Input
                  label="عنوان صندوق پیش‌فرض خانه (اختیاری)"
                  placeholder="مثال: صندوق مشترک خانه"
                  value={newInitialFund}
                  onChange={(e) => setNewInitialFund(e.target.value)}
                  helperText="صندوق برای مدیریت پول مشترک فیزیکی یا کارت بانکی خانه استفاده می‌شود."
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmittingCreate}
                  >
                    ایجاد گروه و ادامه
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* JOIN GROUP MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="w-full max-w-md shadow-2xl border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  عضویت در گروه با کد دعوت
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  کد ۸ رقمی دریافتی از مدیر گروه را وارد کنید
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="pt-4">
              {joinError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {joinError}
                </div>
              )}

              <form onSubmit={handleJoinGroup} className="space-y-4">
                <Input
                  label="کد دعوت ۸ رقمی"
                  placeholder="مثال: ABC123XY"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                  autoFocus
                  className="font-mono text-center text-lg uppercase tracking-widest"
                  maxLength={10}
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowJoinModal(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmittingJoin}
                  >
                    پیوستن به خانه
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="UNLIMITED_GROUPS"
        reason={upgradeModalReason}
      />
    </div>
  );
}
