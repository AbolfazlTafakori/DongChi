# دنگ‌چی (DongChi) 💳 🏠
> **سامانه هوشمند و مدرن مدیریت مخارج مشترک، دانگ خانه و حسابداری گروهی**
> **Smart Iranian Expense Sharing, House Accounting & P2P Settlement Platform**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-200%20Passed-emerald?logo=vitest)](https://vitest.dev/)

---

## 📖 معرفی پروژه (Overview)

**دنگ‌چی** یک پلتفرم جامع، امن و فوق‌العاده مدرن برای محاسبه و مدیریت هزینه‌های اشتراکی (هم‌خانه‌ها، سفرها، اکیپ‌های دوستانه و پروژه‌های تیمی) است که با الگوبرداری از نئوبانک‌های تراز اول ایرانی طراحی شده است.

این سامانه علاوه بر نسخه وب ریسپانسیو و اپلیکیشن نصب‌شونده نیتیو (PWA + APK اندروید با Capacitor)، دارای سیستم مدیریت چند سطحی (RBAC)، تسویه همتا‌به‌همتا (کارت به کارت و شبا) و اسکریپت نصب تک‌خطی بدون تداخل با سرورهای پروداکشن است.

---

## ✨ قابلیت‌های کلیدی (Key Features)

- ⚡ **محاسبه هوشمند دانگ (BigInt Zero-Sum Engine):** محاسبه دقیق دانگ به روش‌های مساوی، درصدی، مبلغ دلخواه و سهمی با تضمین صفر بودن خطای ریالی.
- 📱 **اپلیکیشن موبایل سطح نیتیو (PWA & Android APK):** داگ ناوبری شناور شیشه‌ای، دکمه سریع «+ ثبت خرج»، شیت‌های کشویی (Bottom Sheets) و هماهنگی لحظه‌ای (Real-Time).
- 🔄 **موتور آپدیت درون‌برنامه‌ای دو لایه (In-App Updater):** بررسی آنی نسخه، دانلود مستقیم فایل نصبی با نوار پیشرفت و پشتیبانی از کافه‌بازار و مایکت.
- 💳 **درگاه و تسویه کارت‌به‌کارت (P2P Settlement & Gateway):** شناسایی خودکار بانک‌های عضو شتاب، اعتبارسنجی الگوریتم لوهن (Luhn) و شماره شبا (ISO 7064).
- 🛡️ **معماری دو دیتابیس مجزا با پل ارتباطی (Dual-Database + Identity Bridge):**
  - دیتابیس ایزوله ادمین‌ها با هشینگ مدرن `Scrypt KDF` و سطوح دسترسی (`SUPER_ADMIN`, `FINANCE_ADMIN`, `SUPPORT_ADMIN`).
  - پل ارتباطی خودکار جهت دسترسی همزمان مدیران به اتاق فرمان کلان (`/admin`) و پیشخوان کاربری (`/app`).
- 🔐 **احراز هویت دوگانه (Dual-Mode Auth):** ورود با کد یک‌بارمصرف پیامکی (OTP) بدون نشتی و ورود با شناسه کاربری و رمز عبور.
- 📊 **اتاق فرمان و گزارشات جامع:** پیشخوان آمار کلان، لاگ‌های حسابرسی، مدیریت دسته‌بندی‌ها و صندوق‌های مشترک.

---

## 🚀 نصب سریع روی سرور اوبونتو (One-Line Installer)

با اجرای دستور زیر روی سرور اوبونتو / دبیان، دنگ‌چی به همراه داکر و دیتابیس به صورت کاملاً خودکار و **بدون هیچ‌گونه تداخل با سرویس‌های فعال سرور (مانند x-ui، w-ui یا Nginx)** راه‌اندازی می‌شود:

```bash
curl -fsSL https://dongchi.ir/install.sh | bash
```

### ویژگی‌های اسکریپت نصب:
* **اسکن خودکار پورت‌های ۸۰ و ۴۴۳:** در صورت اشغال بودن پورت‌ها توسط پنل‌های دیگر، به شما امکان انتخاب حالت پروکسی معکوس یا پورت جایگزین (مثل ۸۰۸۰ یا ۸۴۴۳) را می‌دهد.
* **تولید خودکار کلیدهای امنیتی:** ساخت کلیدهای JWT، رمز دیتابیس و فایل `.env.production`.
* **بررسی و نصب خودکار داکر و داکر کامپوز.**

---

## 🛠️ راه‌اندازی در محیط توسعه (Local Development)

### پیش‌نیازها
* Node.js v18+
* PostgreSQL 15+ یا Docker

### مراحل اجرا

۱. دریافت ریپازیتوری:
```bash
git clone https://github.com/AbolfazlTafakori/DongChi.git
cd DongChi
```

۲. نصب وابستگی‌ها:
```bash
npm install
```

۳. ساخت فایل محیطی:
```bash
cp .env.example .env
```

۴. اعمال مایگریشن‌های دیتابیس (Prisma):
```bash
npx prisma db push
```

۵. اجرای سرور توسعه:
```bash
npm run dev
```

سامانه روی آدرس `http://localhost:3000` در دسترس خواهد بود.

---

## 🐳 اجرای با Docker Compose

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🧪 تست‌ها و اعتبارسنجی (Automated Testing)

این پروژه دارای **۲۰۰ تست خودکار و جامع** در ۲۳ فایل تستی مجزا است:

```bash
npm test
```

بررسی اعتبار تایپ‌ها:
```bash
npx tsc --noEmit
```

بیلد پروداکشن:
```bash
npm run build
```

---

## 📄 مجوز (License)

این پروژه تحت مجوز [MIT](LICENSE) منتشر شده است.
