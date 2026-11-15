import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LiveHeroSimulator } from "@/components/marketing/LiveHeroSimulator";
import { InteractiveBentoFeatures } from "@/components/marketing/InteractiveBentoFeatures";
import { getSystemConfig } from "@/lib/system-config";
import {
  Users,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Receipt,
} from "lucide-react";

export default function LandingPage() {
  const config = getSystemConfig();
  const cms = config.cms;

  return (
    <div className="space-y-20 py-4 sm:py-8">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Right Column (6 cols): Copy & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-right">
            {/* Pill Badge with Pulsing Emerald Dot */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>{cms.heroBadgeText || "موتور دنگ‌بندی هوشمند و حسابداری بدون خطای ریالی"}</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 leading-[1.3] tracking-tight">
              {cms.heroHeadline || "مدیریت هوشمند خرج‌های خانه، بدون استرس و خطای حساب"}
            </h1>

            {/* Subtitle */}
            <p className="text-base text-slate-600 leading-[1.85]">
              {cms.heroSubtitle || "هزینه‌های هم‌خانه‌ای، خوابگاه و سفرهای گروهی را با ۴ روش منعطف دنگ‌بندی کنید و با صندوق مشترک خانه حساب‌ها را یکپارچه نگه دارید."}
            </p>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20"
                  rightIcon={<ArrowLeft className="w-4 h-4 mr-2" />}
                >
                  {cms.primaryCtaText || "ساخت گروه رایگان"}
                </Button>
              </Link>

              <Link href="/pricing" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-6 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm"
                >
                  مشاهده پلن‌ها
                </Button>
              </Link>
            </div>

            {/* 3 Compact Trust Items */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200/80 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>دقت ۱۰۰٪ ریالی</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>صندوق و کارت مشترک</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>تسویه با کمترین تراکنش</span>
              </div>
            </div>
          </div>

          {/* Left Column (6 cols): Interactive Live App Preview Card */}
          <div className="lg:col-span-6 w-full">
            <LiveHeroSimulator />
          </div>
        </div>
      </section>

      {/* 2. Structured 4-Card Bento Grid Section with Rich Mini-UI Previews */}
      <InteractiveBentoFeatures />

      {/* 3. Architectural Dark Fintech Workflow Showcase */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-[32px] bg-gradient-to-b from-slate-900 via-slate-950 to-emerald-950 text-white p-7 sm:p-10 lg:p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Ambient Lighting Glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-10">
            {/* Section Header (No Orphan Word Wraps!) */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold inline-flex items-center gap-2">
                <span>⚡ راه‌اندازی در کمتر از ۶۰ ثانیه</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-[1.35]">
                سه گام ساده تا خداحافظی با حساب‌وکتاب‌های دستی
              </h2>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                بدون نیاز به نصب برنامه سنگین یا درگیری با فرمول‌های اکسل، حساب مالی خانه را یک‌بار برای همیشه استاندارد کنید.
              </p>
            </div>

            {/* 3 Connected Step Cards with Embedded Mini-UI Previews */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
              {/* Step 1 Card */}
              <div className="rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-md border border-white/10 p-6 flex flex-col justify-between transition-all duration-300 space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-extrabold text-xs">
                      گام ۱
                    </span>
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    ساخت گروه خانه و دعوت اعضا
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    نام گروه و کارت صندوق خانه را ثبت کنید و لینک دعوت اختصاصی را در تلگرام یا واتساپ برای همخانه‌ها بفرستید.
                  </p>
                </div>

                {/* Embedded Mini-UI Preview Box */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-300 font-bold" dir="ltr">
                    کد دعوت: XK92M
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-md font-bold text-[11px]">
                    ✓ ۴ همخانه عضو شدند
                  </span>
                </div>
              </div>

              {/* Step 2 Card */}
              <div className="rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-md border border-white/10 p-6 flex flex-col justify-between transition-all duration-300 space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-extrabold text-xs">
                      گام ۲
                    </span>
                    <Receipt className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    ثبت خرج از جیب یا صندوق مشترک
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    هر خریدی انجام شد، مبلغ را با پیش‌نمایش حروفی وارد کنید؛ سیستم بلافاصله سهم هر نفر و موجودی کارت خانه را به‌روز می‌کند.
                  </p>
                </div>

                {/* Embedded Mini-UI Preview Box */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-bold">
                    خرید میوه و پروتئین
                  </span>
                  <span className="text-amber-300 font-extrabold tabular-nums">
                    ۴۵۰,۰۰۰ تومان • مساوی
                  </span>
                </div>
              </div>

              {/* Step 3 Card */}
              <div className="rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-md border border-white/10 p-6 flex flex-col justify-between transition-all duration-300 space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-extrabold text-xs">
                      گام ۳
                    </span>
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    تسویه هوشمند با کمترین کارت‌به‌کارت
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    الگوریتم ساده‌سازی بدهی، تمام بده‌بستان‌های پیچیده بین اعضا را در هم ضرب و کسر کرده و به کمترین تراکنش ممکن تبدیل می‌کند.
                  </p>
                </div>

                {/* Embedded Mini-UI Preview Box */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-bold">
                    ۶ بدهی متقاطع ⬅ ۱ انتقال
                  </span>
                  <span className="bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-md font-extrabold text-[11px]">
                    کپی شماره کارت شتاب
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom CTA & Reassurance Strip inside the Dark Box */}
            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
                <span>✓ رایگان برای گروه‌های تا ۲ خانه</span>
                <span>•</span>
                <span>✓ دقت ۱۰۰٪ ریالی</span>
                <span>•</span>
                <span>✓ قابل نصب روی موبایل و دسکتاپ</span>
              </div>

              <Link href="/login">
                <Button
                  variant="primary"
                  size="lg"
                  className="h-12 px-7 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg transition-all"
                >
                  شروع رایگان و ساخت گروه ←
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
