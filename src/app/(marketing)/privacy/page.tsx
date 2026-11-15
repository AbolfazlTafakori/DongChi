import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Lock, EyeOff, FileText, CheckCircle2 } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="space-y-12 py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6">
      {/* 1. Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <Badge variant="credit" size="sm" className="gap-1.5 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          امنیت و شفافیت در دنگ‌چی
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          حریم خصوصی و شرایط استفاده
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          تعهدات شفاف ما در قبال حفاظت از اطلاعات مالی و حریم خصوصی خانواده‌ها و هم‌خانه‌ها
        </p>
      </div>

      {/* 2. Privacy Policy Sections */}
      <div className="space-y-6 text-xs leading-relaxed text-slate-600">
        <Card className="p-6 rounded-3xl border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-slate-900">
              ۱. عدم دسترسی به اطلاعات بانکی حساس (Zero Financial Access)
            </h2>
          </div>
          <p>
            دنگ‌چی یک نرم‌افزار ثبت و دنگ‌بندی هزینه‌هاست، نه یک درگاه واسط انتقال وجه بانکی. ما هیچ‌گاه رمز اول، رمز دوم پویا، CVV2 یا تاریخ انقضای کارت‌های بانکی شما را درخواست نکرده و ذخیره نمی‌کنیم. تنها اطلاعات مالی ذخیره‌شده، شماره کارت ۱۶ رقمی (جهت تسهیل کپی کردن برای تسویه بین اعضا) و ارقام فاکتورهایی است که خودتان وارد می‌نمایید.
          </p>
        </Card>

        <Card className="p-6 rounded-3xl border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <EyeOff className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-slate-900">
              ۲. اصل حریم خصوصی در طراحی پنل مدیریت (Privacy by Design)
            </h2>
          </div>
          <p>
            تیم مدیریت و ادمین‌های سامانه دنگ‌چی بر اساس معماری کد و قوانین امنیتی نرم‌افزار، به عناوین فاکتورهای شخصی، تصاویر رسیدها و تراز مالی خصوصی اعضای گروه‌ها دسترسی ندارند. در پنل ادمین صرفاً متادیتای آماری کلی (نظیر تعداد کل اعضا یا تعداد اسناد) جهت مانیتورینگ سلامت سرور قابل مشاهده است.
          </p>
        </Card>

        <Card className="p-6 rounded-3xl border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-slate-900">
              ۳. نشست‌های امن و رمزنگاری توکن‌ها (HttpOnly JWT)
            </h2>
          </div>
          <p>
            احراز هویت کاربران از طریق کدهای یک‌بارمصرف پیامکی (OTP) و توکن‌های نشست رمزنگاری‌شده بر پایه استاندارد مدرن jose انجام می‌شود. کوکی‌های ورود در بستر ایمن HttpOnly ذخیره می‌شوند تا در برابر حملات تزریق اسکریپت (XSS) کاملاً محافظت شوند.
          </p>
        </Card>

        <Card className="p-6 rounded-3xl border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-slate-900">
              ۴. تاریخچه دست‌نخورده تغییرات (Immutable Audit Log)
            </h2>
          </div>
          <p>
            جهت جلوگیری از هرگونه سوءتفاهم مالی میان هم‌خانه‌ها، هر زمان هزینه‌ای ویرایش، حذف یا تسویه شود، جزئیات پیشین و نام شخص ویرایش‌کننده به صورت دائمی ثبت می‌گردد. همچنین با بستن دوره‌های مالی ماهانه، اسناد گذشته قفل شده و امکان دستکاری ندارند.
          </p>
        </Card>
      </div>
    </div>
  );
}
