# دنگ‌چی (DongChi v2.6) 💳 🏠
> **پلتفرم نئوبانک حسابداری خانه، مدیریت دنگ و تسویه هوشمند (Web + Android APK + iOS PWA)**  
> **Enterprise Smart Iranian Expense Sharing, House Accounting, P2P Settlement Platform & Linux Management Suite**

[![Next.js](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20Dual--DB-336791?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7%20Cache-DC382D?logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Zero%20Collision-2496ED?logo=docker)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-215%20Passed-10B981?logo=vitest)](https://vitest.dev/)
[![Ubuntu](https://img.shields.io/badge/Ubuntu-24.04%20%7C%2022.04%20Ready-E95420?logo=ubuntu)](https://ubuntu.com/)

---

## 📖 فهرست مطالب (Table of Contents)
- [⚡ نصب تک‌خطی هوشمند روی سرور اوبونتو (One-Line Installer)](#-نصب-تک‌خطی-هوشمند-روی-سرور-اوبونتو-one-line-installer)
- [📦 قرنطینه و ایزولاسیون کامل در پوشه `/opt/dongchi` (Directory Sandboxing)](#-قرنطینه-و-ایزولاسیون-کامل-در-پوشه-optdongchi-directory-sandboxing)
- [🛡️ همزیستی بدون تداخل با سایر پروژه‌ها (Zero-Conflict Coexistence)](#️-همزیستی-بدون-تداخل-با-سایر-پروژه‌ها-zero-conflict-coexistence)
- [🛠️ دستور خط فرمان لینوکس (`dongchi` CLI)](#️-دستور-خط-فرمان-لینوکس-dongchi-cli)
- [🏛️ معماری دو دیتابیس مجزا و پل ارتباطی (Dual-Database + Identity Bridge)](#️-معماری-دو-دیتابیس-مجزا-و-پل-ارتباطی-dual-database--identity-bridge)
- [🚀 موتور مقیاس‌پذیر ترافیک بالا (High-Concurrency Engine)](#-موتور-مقیاس‌پذیر-ترافیک-بالا-high-concurrency-engine)
- [💳 معماری تسویه دوحالته (فاز ۱ حسابداری ⬅ فاز ۲ پرداخت درگاه P2P)](#-معماری-تسویه-دوحالته-فاز-۱-حسابداری--فاز-۲-پرداخت-درگاه-p2p)
- [📱 اپلیکیشن موبایل بومی و آپدیتر درون‌برنامه‌ای (Android APK + PWA)](#-اپلیکیشن-موبایل-بومی-و-آپدیتر-درون‌برنامه‌ای-android-apk--pwa)
- [💻 راهنمای اجرا در محیط توسعه (Local Development)](#-راهنمای-اجرا-در-محیط-توسعه-local-development)
- [🧪 آزمون‌های خودکار و ارزیابی کیفیت (Automated Tests)](#-آزمون‌های-خودکار-و-ارزیابی-کیفیت-automated-tests)

---

## ⚡ نصب تک‌خطی هوشمند روی سرور اوبونتو (One-Line Installer)

برای نصب، راه‌اندازی و پیکربندی خودکار سامانه دنگ‌چی به همراه داکر، ردیس و دو دیتابیس مستقل روی سرورهای **Ubuntu / Debian**، دستور زیر را در ترمینال سرور خود اجرا کنید (بدون توجه به پوشه‌ای که در آن هستید):

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/AbolfazlTafakori/DongChi/main/install.sh)
```

یا از دامنه مستقیم:
```bash
curl -fsSL https://dongchi.ir/install.sh | bash
```

---

## 📦 قرنطینه و ایزولاسیون کامل در پوشه `/opt/dongchi` (Directory Sandboxing)

برای جلوگیری از هرگونه آلودگی سرور (Zero Host Pollution)، اسکریپت نصب در هر مسیری از سیستم‌عامل که اجرا شود، فایل‌ها را در پوشه جاری سرور رها نمی‌کند؛ بلکه تمامی منابع را درون دایرکتوری ایزوله **`/opt/dongchi`** با دسترسی ایمن `chmod 700` قرار می‌دهد:

```
/opt/dongchi/
├── app/          # کدهای سورس برنامه، Dockerfile و docker-compose.prod.yml
├── data/         # دیتابیس ایزوله ادمین‌ها (admins-db.json) و پیکربندی‌های سیستم
├── pgdata/       # داده‌های پایدار پایگاه داده PostgreSQL 16
├── redisdata/    # داده‌های کش سریع و پایدار Redis 7
├── ssl/          # گواهی‌های امنیتی SSL/TLS دامنه (fullchain.pem و privkey.pem)
├── backups/      # بکاپ‌های خودکار و دستی دیتابیس‌ها
└── logs/         # لاگ‌های نصب و رخدادهای زمان اجرا
```

* **فضای نام ایزوله داکر (`-p dongchi_stack`):** تمامی کانتینرها در پروژه اختصاصی `dongchi_stack` اجرا می‌شوند.
* **شبکه مجزای داکر (`dongchi_isolated_net`):** دیتابیس و ردیس تنها در این شبکه داخلی داکر تنفس می‌کنند.
* **پاک‌سازی ایمن و اختصاصی:** حذف برنامه فقط و فقط محتویات `/opt/dongchi` را پاک می‌کند و دست به هیچ سرویس دیگری در سرور نمی‌زند.

---

## 🛡️ همزیستی بدون تداخل با سایر پروژه‌ها (Zero-Conflict Coexistence)

بسیاری از سرورهای لینوکسی در حال حاضر پروژه‌های دیگری مثل **`w-ui`**، **`x-ui`**، سرویس‌های نود روی پورت ۳۰۰۰، دیتابیس‌های PostgreSQL روی ۵۴۳۲ یا ردیس روی ۶۳۷۹ دارند. اسکریپت نصب دنگ‌چی با هوشمندی مهندسی‌شده مانع از هرگونه تداخل می‌شود:

### ۱. اسکن خودکار و تخصیص پورت پویا (`find_free_port 3000 3999`)
* اسکریپت وضعیت پورت ۳۰۰۰ را با `ss -tuln`، `lsof` و `docker ps` می‌سنجد.
* **اگر پورت ۳۰۰۰ اشغال باشد:** به طور خودکار اولین پورت آزاد در بازه ۳۰۰۰ تا ۳۹۹۹ (`3001`، `3002` و...) را پیدا کرده و پیام زیر را نمایش می‌دهد:
  ```text
  [INFO] Port 3000 is already in use by another service. Auto-selected free internal port: 3001
  ```
* کانفیگ پروداکشن `.env.production` و پروکسی معکوس Nginx مستقیماً به پورت جدید متصل می‌شوند.

### ۲. ایزولاسیون کامل پورت‌های دیتابیس و ردیس (Zero Host Port Exposure)
* کانتینرهای `dongchi_postgres` و `dongchi_redis` با دستور داخلی `expose` روی شبکه ایزوله `dongchi_isolated_net` کار می‌کنند و **اصلاً پورت‌های ۵۴۳۲ و ۶۳۷۹ سرور میزبان را لمس نمی‌کنند**.
* بنابراین اگر روی سرورتان دیتابیس Postgres یا Redis دیگری فعال باشد، هیچ تصادم یا خطایی به وجود نمی‌آید.

### ۳. انتخاب وضعیت پورت‌های ۸۰ و ۴۴۳ و گارد بازگشت Nginx (Safe Config Rollback)
1. **پروکسی اشتراکی Nginx:** ساخت کانفیگ اختصاصی در `/etc/nginx/conf.d/dongchi-${DOMAIN}.conf` بدون اختلال در سایر سایت‌ها.
2. **بررسی صحت کانفیگ (`nginx -t`):** قبل از اعمال، دستور `nginx -t` چک می‌شود؛ در صورت هرگونه خطا، فایل کانفیگ بلافاصله حذف می‌شود (Rollback) تا سایت‌های دیگر حتی یک ثانیه قطع نشوند.
3. **پورت مستقیم مستقل:** امکان انتخاب پورت‌های جایگزین (مانند `8443`، `2053` یا `2083`) جهت عدم تداخل با پنل‌های X-UI و W-UI.

---

## 🛠️ دستور خط فرمان لینوکس (`dongchi` CLI)

برای جلوگیری از مشکلات نمایش حروف فارسی و راست‌به‌چپ (RTL) در ترمینال‌های SSH نظیر PuTTY و Termius، رابط کاربری اسکریپت نصب و خط فرمان به صورت **۱۰۰٪ انگلیسی استاندارد و حرفه‌ای (Clean English Terminal UI)** پیاده‌سازی شده است.

پس از اتمام نصب، با تایپ دستور **`dongchi`** در هر کجای ترمینال سرور، منوی کنترل سریع باز می‌شود:

```text
==============================================================
   DongChi Platform — Server Control Panel (v2.6)
   Sandbox Directory : /opt/dongchi
==============================================================
  1) Service Status & Health Check
  2) Reset Super Admin Username & Password
  3) Change Domain / Ports & Re-issue SSL
  4) Update DongChi Core (Zero-Downtime Pull & Rebuild)
  5) Backup Databases (Saved to /opt/dongchi/backups)
  6) View Live Container Logs
  7) Restart DongChi Stack
  8) Stop DongChi Stack
  9) Uninstall DongChi Safely (Removes only /opt/dongchi)
  0) Exit
==============================================================
```

---

## 🏛️ معماری دو دیتابیس مجزا و پل ارتباطی (Dual-Database + Identity Bridge)

برای حداکثر امنیت و جداسازی داده‌ها، معماری پایگاه داده سامانه در دو سطح ایزوله است:

```
┌──────────────────────────────────────────────┐
│           PostgreSQL 16 Multi-DB             │
├──────────────────────┬───────────────────────┤
│  dongchi_users_db    │   dongchi_admins_db   │
│  - کاربران عادی      │   - مدیران ارشد سیستم │
│  - گروه‌ها و خانه‌ها │   - سطوح دسترسی RBAC  │
│  - مخارج و فاکتورها  │   - تنظیمات سیستمی    │
│  - ترازهای مالی      │   - لاگ‌های ممیزی کلان│
└──────────▲───────────┴───────────▲───────────┘
           │                       │
           └─────── Identity ──────┘
                    Bridge
```

* **پل ارتباطی یکپارچه (`auth-bridge.ts`):** زمانی که ادمین با شناسه کاربری و رمز عبور وارد می‌شود، سیستم هویت او را در دیتابیس ادمین بررسی کرده و همزمان حساب سایه او را در دیتابیس کاربران با نقش `Role.ADMIN` همگام می‌سازد.
* این پل امکان می‌دهد تا ادمین با یک حساب واحد و نشست رمزنگاری‌شده `HttpOnly`، به هر دو محیط پیشخوان کاربری (`/app`) و اتاق فرمان کلان (`/admin`) دسترسی داشته باشد.
* **احراز هویت دوگانه (Dual-Mode):** کاربران و مدیران می‌توانند هم از طریق **رمز عبور ثابت امن (Scrypt KDF)** و هم از طریق **کد یک‌بارمصرف پیامکی (OTP)** لاگین یا ثبت‌نام کنند.

---

## 🚀 موتور مقیاس‌پذیر ترافیک بالا (High-Concurrency Engine)

برای پاسخ‌دهی بدون تاخیر به بیش از **۱۰,۰۰۰ کلاینت و گوشی همزمان**:

1. **کش فوق‌سریع در حافظه رم (`Zero-DB-Hit Sync Stamp Cache`):**
   * پولینگ‌های دوره‌ای موبایل در `/api/sync` در ۹۸٪ موارد با هدر `X-Sync-Cache: HIT` در کمتر از **`0.1ms`** از حافظه رم پاسخ داده می‌شوند و هیچ باری روی دیتابیس اعمال نمی‌کنند.
   * به محض هرگونه رخداد مالی، کش اعضای همان گروه به صورت لحظه‌ای باطل (`invalidateUserSyncCache`) می‌شود.
2. **ایندکس‌های ترکیبی B-Tree در دیتابیس:** ایندکس‌های کامپوزیت روی جداول `Expense`، `ExpenseSplit`، `Settlement` و `GroupMember` که زمان کوئری ترازهای بزرگ را زیر `2ms` نگه می‌دارد.
3. **محاسبات با دقت ریالی مطلق (`BigInt Zero-Sum Engine`):** تمامی مبالغ با نوع داده `BigInt` محاسبه می‌شوند تا خطای اعشاری در تقسیم‌های نامتقارن، درصدی و سهمی کاملاً صفر باشد.

---

## 💳 معماری تسویه دوحالته (فاز ۱ حسابداری ⬅ فاز ۲ پرداخت درگاه P2P)

سامانه دنگ‌چی از ابتدا به صورت پیش‌فرض روی **فاز ۱ (حسابداری خالص)** عمل می‌کند و مدیر سیستم می‌تواند در صورت تمایل، **فاز ۲ (درگاه پرداخت مستقیم شتابی)** را فعال کند:

* **فاز ۱: حسابداری دنگ و تسویه دستی (Off-Chain Settlement):** هم‌خانه‌ها از طریق کارت به کارت، شماره شبا یا تسویه نقدی هزینه‌ها را صاف کرده و سند تسویه را در سامانه ثبت می‌کنند.
* **فاز ۲: تسویه مستقیم نفر به نفر از درگاه P2P (Peer-to-Peer Gateway):** با فعال‌سازی سوییچ `enableP2pGatewaySettlement` در پنل تنظیمات، دکمه پرداخت آنلاین برای بدهکاران باز می‌شود تا مستقیماً از طریق درگاه‌های شاپرک (زرین‌پال، زیبال و...) بدهی خود را به کارت هم‌خانه واریز کنند.

---

## 📱 اپلیکیشن موبایل بومی و آپدیتر درون‌برنامه‌ای (Android APK + PWA)

* **طراحی بومی فین‌تک:** نوار ناوبری شناور شیشه‌ای، دکمه ثبت سریع خرج (`+`)، و شیت‌های کشویی پایینی (Bottom Sheets).
* **موتور آپدیت درون‌برنامه‌ای دو لایه (`In-App Updater`):** بررسی نسخه با سرور، نمایش لاگ تغییرات، نوار درصد پیشرفت دانلود مستقیم فایل نصبی (`.apk`) و لینک مستقیم به کافه‌بازار و مایکت.
* **حالت آپدیت اجباری (`Force Update`):** امکان قفل کردن نسخه‌های قدیمی از اتاق فرمان مدیریت جهت حفظ امنیت تراکنش‌ها.

---

## 💻 راهنمای اجرا در محیط توسعه (Local Development)

### پیش‌نیازها
* Node.js v18 یا بالاتر
* PostgreSQL 15+ و Redis (یا اجرای از طریق Docker)

### مراحل راه‌اندازی

۱. کلون کردن ریپازیتوری:
```bash
git clone https://github.com/AbolfazlTafakori/DongChi.git
cd DongChi
```

۲. نصب پکیج‌ها:
```bash
npm install
```

۳. تنظیم متغیرهای محیطی:
```bash
cp .env.example .env
```

۴. همگام‌سازی ساختار دیتابیس:
```bash
npx prisma db push
```

۵. اجرای سرور توسعه:
```bash
npm run dev
```

سامانه روی آدرس `http://localhost:3000` بالا خواهد آمد.

---

## 🧪 آزمون‌های خودکار و ارزیابی کیفیت (Automated Tests)

این پروژه دارای **۲۱۵ تست خودکار** جامع در ۲۴ سوئیت تستی مجزا است:

```bash
# اجرای تمامی تست‌ها
npm test

# بررسی اعتبارسنجی سیستم تایپ‌ها
npx tsc --noEmit

# تست بیلد پروداکشن
npm run build
```

---

## 📄 لایسنس (License)

این پروژه به صورت متن‌باز و تحت مجوز [MIT](LICENSE) منتشر شده است.
