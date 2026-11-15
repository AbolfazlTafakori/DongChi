"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  Calculator,
  Users,
  KeyRound,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  Crown,
  CreditCard,
  Copy,
  Check,
  Receipt,
  Sparkles,
  ArrowRight,
  Building,
  PiggyBank,
} from "lucide-react";
import { formatToman, toPersianDigits, numberToPersianWords } from "@/lib/money";

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

interface MobileNeobankHomeProps {
  groups: GroupSummary[];
  suggestedSettlements: SuggestedSettlement[];
  coMembersCards: CoMemberCard[];
  recentActivities: RecentActivity[];
  totalNet: bigint;
  totalOwed: bigint;
  totalDebt: bigint;
  totalFundAll: bigint;
  isPro?: boolean;
  onOpenQuickExpense: (groupId?: string) => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onOpenSplitCalculator: () => void;
  copiedCardUserId: string | null;
  onCopyCard: (userId: string, card: string) => void;
}

export function MobileNeobankHome({
  groups,
  suggestedSettlements,
  coMembersCards,
  recentActivities,
  totalNet,
  totalOwed,
  totalDebt,
  totalFundAll,
  isPro = false,
  onOpenQuickExpense,
  onOpenCreateGroup,
  onOpenJoinGroup,
  onOpenSplitCalculator,
  copiedCardUserId,
  onCopyCard,
}: MobileNeobankHomeProps) {
  const [activeTab, setActiveTab] = useState<"SETTLEMENTS" | "CARDS" | "ACTIVITIES">("SETTLEMENTS");

  return (
    <div className="space-y-4 pb-20 select-none text-right" dir="rtl">
      {/* ====================================================================== */}
      {/* SECTION A: NEOBANK DARK EMERALD & GOLD WALLET CARD                     */}
      {/* ====================================================================== */}
      <div className="rounded-[28px] bg-gradient-to-br from-[#062C24] via-[#051E19] to-[#091326] text-white p-5 shadow-xl border border-emerald-500/25 relative overflow-hidden">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-12 -left-12 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-12 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Strip inside Card */}
        <div className="flex items-center justify-between relative z-10">
          <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>همگام با کلود دنگ‌چی</span>
          </div>

          <Link href="/app/billing">
            {isPro ? (
              <span className="bg-gradient-to-r from-amber-500/25 via-yellow-400/25 to-amber-500/25 border border-amber-400/40 text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 shadow-2xs">
                <Crown className="w-3 h-3 text-amber-300" />
                <span>پرو طلایی</span>
              </span>
            ) : (
              <span className="bg-white/10 border border-white/15 text-slate-300 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                <span>پلن پایه</span>
                <span className="text-[9px] text-amber-300">ارتقا ←</span>
              </span>
            )}
          </Link>
        </div>

        {/* Center Balance Display */}
        <div className="mt-4 relative z-10">
          <span className="text-xs text-emerald-200/80 font-medium block">
            تراز خالص کل شما در خانه‌ها
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span
              className={`text-3xl font-extrabold tabular-nums tracking-tight ${
                totalNet > 0n
                  ? "text-emerald-300"
                  : totalNet < 0n
                  ? "text-rose-300"
                  : "text-white"
              }`}
            >
              {totalNet > 0n ? "+" : ""}
              {formatToman(totalNet, { includeCurrency: false })}
            </span>
            <span className="text-xs text-emerald-200/80 font-bold">تومان</span>
          </div>

          <p className="text-[11px] text-emerald-300/80 mt-1 truncate">
            {numberToPersianWords(totalNet, { includeCurrency: true })}
          </p>
        </div>

        {/* 2 Glass Sub-Pills inside Wallet Card */}
        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-white/10 relative z-10">
          <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-xs space-y-0.5">
            <span className="text-[10px] text-slate-300 font-medium block">
              مجموع طلب من
            </span>
            <span className="text-xs font-black text-emerald-400 tabular-nums block">
              +{formatToman(totalOwed)}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-xs space-y-0.5">
            <span className="text-[10px] text-slate-300 font-medium block">
              مجموع بدهی من
            </span>
            <span className="text-xs font-black text-rose-400 tabular-nums block">
              -{formatToman(totalDebt)}
            </span>
          </div>
        </div>

        {/* 4 Native Circular Quick-Action Launchers */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-3 border-t border-white/10 relative z-10 text-center">
          {/* Action 1: ثبت خرج */}
          <button
            type="button"
            onClick={() => onOpenQuickExpense()}
            className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-extrabold text-white">ثبت خرج</span>
          </button>

          {/* Action 2: ماشین‌حساب دنگ */}
          <button
            type="button"
            onClick={onOpenSplitCalculator}
            className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Calculator className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-white">حالت دنگ</span>
          </button>

          {/* Action 3: ساخت خانه */}
          <button
            type="button"
            onClick={onOpenCreateGroup}
            className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Building className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-white">ساخت خانه</span>
          </button>

          {/* Action 4: کد دعوت */}
          <button
            type="button"
            onClick={onOpenJoinGroup}
            className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <KeyRound className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-white">کد دعوت</span>
          </button>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* SECTION B: HORIZONTAL SWIPEABLE STORIES / GROUP CARDS                  */}
      {/* ====================================================================== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-xs font-black text-slate-900">
              خانه‌ها و جمع‌های فعال من
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-bold tabular-nums">
            {toPersianDigits(groups.length)} خانه
          </span>
        </div>

        {groups.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
            {groups.map((group) => {
              const netBigInt = BigInt(group.myNetBalance || "0");
              return (
                <div
                  key={group.id}
                  className="min-w-[250px] max-w-[270px] snap-center rounded-[22px] bg-white border border-slate-200/90 p-4 shadow-2xs space-y-3 flex flex-col justify-between shrink-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 truncate">
                        {group.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold tabular-nums">
                        {toPersianDigits(group.memberCount)} عضو
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-500">وضعیت سهم شما:</span>
                      <span
                        className={`font-black tabular-nums ${
                          netBigInt > 0n
                            ? "text-emerald-600"
                            : netBigInt < 0n
                            ? "text-rose-600"
                            : "text-slate-700"
                        }`}
                      >
                        {netBigInt > 0n ? "+" : ""}
                        {formatToman(netBigInt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>صندوق مشترک:</span>
                      <span className="font-bold text-slate-700 tabular-nums">
                        {formatToman(BigInt(group.totalFundBalance || "0"))}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onOpenQuickExpense(group.id)}
                      className="h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-extrabold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ثبت خرج</span>
                    </button>

                    <Link
                      href={`/app/groups/${group.id}`}
                      className="h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold inline-flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>ورود</span>
                      <ChevronLeft className="w-3 h-3 text-slate-400" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  شما هنوز در هیچ خانه‌ای عضو نیستید
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  برای شروع مدیریت حساب‌های مشترک، اولین خانه را بسازید.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenCreateGroup}
                className="h-9 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>ساخت خانه</span>
              </button>

              <button
                type="button"
                onClick={onOpenJoinGroup}
                className="h-9 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>ورود با کد</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================== */}
      {/* SECTION C: 3-TAB SEGMENTED MOBILE SWITCHER                             */}
      {/* ====================================================================== */}
      <div className="space-y-3">
        {/* Segmented Switcher Controls */}
        <div className="bg-slate-200/70 p-1 rounded-2xl grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("SETTLEMENTS")}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "SETTLEMENTS"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>تسویه‌ها</span>
            {suggestedSettlements.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center tabular-nums">
                {toPersianDigits(suggestedSettlements.length)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CARDS")}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "CARDS"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>کارت‌ها</span>
            {coMembersCards.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center tabular-nums">
                {toPersianDigits(coMembersCards.length)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ACTIVITIES")}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "ACTIVITIES"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>فعالیت‌ها</span>
          </button>
        </div>

        {/* Tab 1 Content: Suggested Settlements */}
        {activeTab === "SETTLEMENTS" && (
          <div className="space-y-2">
            {suggestedSettlements.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200/90 text-center space-y-1">
                <span className="text-2xl block">🎉</span>
                <span className="text-xs font-bold text-slate-800 block">
                  تمام حساب‌های شما با هم‌خانه‌ها تسویه است!
                </span>
                <span className="text-[11px] text-slate-400 block">
                  هیچ بدهی یا طلب معلقی در خانه‌های شما وجود ندارد.
                </span>
              </div>
            ) : (
              suggestedSettlements.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        item.type === "OWE"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {item.type === "OWE" ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-900 block truncate">
                        {item.type === "OWE" ? "بدهی به" : "طلب از"} {item.counterpartyName}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {item.groupTitle}
                      </span>
                    </div>
                  </div>

                  <div className="text-left shrink-0 space-y-1">
                    <span
                      className={`text-xs font-black tabular-nums block ${
                        item.type === "OWE" ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {formatToman(BigInt(item.amount))}
                    </span>
                    <Link
                      href={item.settleUrl}
                      className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold inline-block"
                    >
                      تسویه سریع ←
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2 Content: Co-Members Bank Cards */}
        {activeTab === "CARDS" && (
          <div className="space-y-2">
            {coMembersCards.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200/90 text-center space-y-1">
                <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
                <span className="text-xs font-bold text-slate-700 block">
                  شماره کارتی یافت نشد
                </span>
                <span className="text-[11px] text-slate-400 block">
                  هم‌خانه‌ها می‌توانند شماره کارت خود را در پروفایل ثبت کنند تا کارت تسویه آن‌ها اینجا نمایش داده شود.
                </span>
              </div>
            ) : (
              coMembersCards.map((card) => {
                const isCopied = copiedCardUserId === card.userId;
                return (
                  <div
                    key={card.userId}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 truncate">
                            {card.name}
                          </span>
                          {card.bankName && (
                            <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 rounded">
                              {card.bankName}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-600 block mt-0.5 tracking-wider">
                          {card.formattedCard || card.cardNumber || "ثبت‌نشده"}
                        </span>
                      </div>
                    </div>

                    {card.cardNumber && (
                      <button
                        type="button"
                        onClick={() => onCopyCard(card.userId, card.cardNumber!)}
                        className={`h-8 px-2.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                          isCopied
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>کپی شد!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>کپی کارت</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3 Content: Recent Activities */}
        {activeTab === "ACTIVITIES" && (
          <div className="space-y-2">
            {recentActivities.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200/90 text-center space-y-1">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                <span className="text-xs font-bold text-slate-700 block">
                  هنوز فعالیتی ثبت نشده است
                </span>
                <span className="text-[11px] text-slate-400 block">
                  با ثبت اولین خرج، فاکتورهای خانه در این بخش لیست می‌شوند.
                </span>
              </div>
            ) : (
              recentActivities.slice(0, 10).map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      {act.type === "SETTLEMENT" ? "🤝" : "🧾"}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-900 block truncate">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {act.groupTitle} • {toPersianDigits(new Date(act.date).toLocaleDateString("fa-IR"))}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-slate-900 tabular-nums shrink-0">
                    {formatToman(BigInt(act.amount))}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
