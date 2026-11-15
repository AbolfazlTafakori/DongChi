"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toPersianDigits } from "@/lib/money";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building,
} from "lucide-react";

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = String(params.inviteCode).toUpperCase();

  const [group, setGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/groups/invite/${inviteCode}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "دعوتنامه نامعتبر است.");
        }
        setGroup(data.group);
      } catch (err: any) {
        setError(err.message || "خطا در بررسی کد دعوت.");
      } finally {
        setIsLoading(false);
      }
    };

    if (inviteCode) {
      fetchPreview();
    }
  }, [inviteCode]);

  const handleJoin = async () => {
    setIsJoining(true);
    setError(null);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در پیوستن به گروه.");
      }

      setJoinSuccess(true);
      setTimeout(() => {
        router.push(`/app/groups/${data.groupId}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        در حال بررسی دعوتنامه گروه...
      </div>
    );
  }

  if (error || !group) {
    return (
      <Card className="max-w-md mx-auto p-6 text-center bg-red-50 border-red-200 mt-10">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-red-900 mb-1">
          دعوتنامه نامعتبر است
        </h2>
        <p className="text-xs text-red-700 mb-5 leading-relaxed">
          {error || "کد دعوت منقضی شده یا گروه حذف شده است."}
        </p>
        <Link href="/app">
          <Button variant="outline" size="sm">
            بازگشت به خانه
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-8">
      <Card className="p-6 text-center shadow-md border-slate-200">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Building className="w-8 h-8" />
        </div>

        <Badge variant="credit" size="sm" className="mb-2">
          دعوتنامه ورود به گروه
        </Badge>

        <h1 className="text-2xl font-black text-slate-900 mb-1">
          {group.title}
        </h1>

        <p className="text-xs text-slate-500 mb-6 tabular-nums">
          دارای {toPersianDigits(group.memberCount)} عضو فعال در دنگ‌چی
        </p>

        {joinSuccess ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center justify-center gap-2 font-bold mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>با موفقیت عضو شدید! در حال انتقال به گروه...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed text-right">
              با عضویت در این گروه، هزینه‌ها، صندوق خانه و دنگ‌بندی‌ها بین شما و
              سایر اعضا به‌طور خودکار محاسبه و شفاف خواهد شد.
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleJoin}
              isLoading={isJoining}
              className="w-full text-sm font-bold"
            >
              تأیید و عضویت در گروه
            </Button>

            <Link href="/app" className="block text-xs text-slate-400 hover:text-slate-600 pt-2">
              انصراف و بازگشت
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
