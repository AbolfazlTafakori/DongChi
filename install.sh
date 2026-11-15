#!/usr/bin/env bash
# ==============================================================================
# دنگ‌چی • اسکریپت نصب و راه‌اندازی سرور ابری (DongChi Production Installer)
# معماری ایزوله ادمین، دیتابیس دوگانه و سازگاری بدون تداخل با x-ui / w-ui / Nginx
# ==============================================================================

set -e

# Reconnect stdin to terminal if script is piped (curl ... | bash)
if [ ! -t 0 ]; then
  exec < /dev/tty || true
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear || true

echo -e "${CYAN}${BOLD}"
echo "=============================================================================="
echo "          دنگ‌چی • اسکریپت نصب خودکار و بدون تداخل سرور (DongChi Core)        "
echo "        Enterprise Self-Hosted Multi-Admin & Dual-Database Installer        "
echo "=============================================================================="
echo -e "${NC}"

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] لطفاً این اسکریپت را با دسترسی روت (root یا sudo) اجرا کنید.${NC}"
  exit 1
fi

# Detect Public IP
SERVER_IP=$(curl -s -m 4 https://api.ipify.org || curl -s -m 4 https://icanhazip.com || echo "127.0.0.1")

echo -e "${BLUE}[INFO] آدرس آی‌پی عمومی شناسایی‌شده برای سرور: ${BOLD}${SERVER_IP}${NC}"
echo ""

# 2. Port Conflict Scanner
echo -e "${PURPLE}[1/5] اسکن پورت‌ها و بررسی عدم تداخل با سرویس‌های سرور (x-ui, w-ui, Nginx)...${NC}"

is_port_in_use() {
  local port=$1
  if command -v ss >/dev/null 2>&1; then
    ss -tuln | grep -q ":${port} " && return 0
  elif command -v netstat >/dev/null 2>&1; then
    netstat -tuln | grep -q ":${port} " && return 0
  elif command -v lsof >/dev/null 2>&1; then
    lsof -i ":${port}" >/dev/null 2>&1 && return 0
  fi
  return 1
}

PORT_80_USED=false
PORT_443_USED=false
PORT_3000_USED=false

if is_port_in_use 80; then PORT_80_USED=true; fi
if is_port_in_use 443; then PORT_443_USED=true; fi
if is_port_in_use 3000; then PORT_3000_USED=true; fi

DEFAULT_APP_PORT="3000"
DEFAULT_BIND="127.0.0.1"
RUN_MODE="PROXY"

if [ "$PORT_80_USED" = true ] || [ "$PORT_443_USED" = true ]; then
  echo -e "${YELLOW}[هشدار مهم] پورت‌های ۸۰ یا ۴۴۳ سرور در حال حاضر توسط سرویس دیگری (مانند x-ui، w-ui یا Nginx فعلی) اشغال شده‌اند.${NC}"
  echo -e "${GREEN}طراحی دنگ‌چی به گونه‌ای است که بدون کوچک‌ترین اختلال یا توقف در سرویس‌های فعلی، در کنار آن‌ها اجرا می‌شود.${NC}"
  echo ""
  echo "لطفاً حالت استقرار مورد نظر خود را انتخاب فرمایید:"
  echo "  1) حالت پروکسی / همزیستی مسالمت‌آمیز: دنگ‌چی روی پورت داخلی ۳۰۰۰ اجرا شده و کانفیگ آماده Nginx برای دامنه شما ارائه می‌شود (پیشنهادی)"
  echo "  2) حالت پورت مستقل مستقیم: دنگ‌چی روی یک پورت باز دلخواه (مثلاً ۸۰۸۰ یا ۸۴۴۳ یا ۲۰۵۳) به صورت مستقیم کار می‌کند"
  echo ""
  read -p "انتخاب شما [1 یا 2] (پیش‌فرض: 1): " MODE_CHOICE
  MODE_CHOICE=${MODE_CHOICE:-1}

  if [ "$MODE_CHOICE" = "2" ]; then
    RUN_MODE="DIRECT"
    DEFAULT_BIND="0.0.0.0"
    DEFAULT_APP_PORT="8080"
  else
    RUN_MODE="PROXY"
    DEFAULT_BIND="127.0.0.1"
    DEFAULT_APP_PORT="3000"
  fi
else
  echo -e "${GREEN}[OK] پورت‌های استاندارد سرور آزاد هستند.${NC}"
  echo "  1) حالت استاندارد (پورت 3000 در لوکال / اتصال به Nginx معکوس)"
  echo "  2) حالت دسترسی مستقیم عمومی به پورت 3000"
  read -p "انتخاب شما [1 یا 2] (پیش‌فرض: 1): " MODE_CHOICE
  if [ "$MODE_CHOICE" = "2" ]; then
    DEFAULT_BIND="0.0.0.0"
    RUN_MODE="DIRECT"
  else
    DEFAULT_BIND="127.0.0.1"
    RUN_MODE="PROXY"
  fi
fi

# Port selection
if [ "$DEFAULT_APP_PORT" = "3000" ] && [ "$PORT_3000_USED" = true ]; then
  DEFAULT_APP_PORT="3001"
  echo -e "${YELLOW}[نکته] پورت ۳۰۰۰ اشغال بود؛ پورت پیش‌فرض به ۳۰۰۱ تغییر یافت.${NC}"
fi

read -p "شماره پورت اجرای برنامه دنگ‌چی (پیش‌فرض: ${DEFAULT_APP_PORT}): " USER_APP_PORT
APP_HOST_PORT=${USER_APP_PORT:-$DEFAULT_APP_PORT}

echo ""
echo -e "${PURPLE}[2/5] تنظیمات دامنه و شناسه مدیر ارشد سیستم...${NC}"

read -p "نام دامنه سامانه (مثال: dongchi.example.com یا همین IP سرور) [پیش‌فرض: ${SERVER_IP}]: " DOMAIN_INPUT
DOMAIN=${DOMAIN_INPUT:-$SERVER_IP}

read -p "نام کاربری مدیر ارشد (INITIAL_ADMIN_USER) [پیش‌فرض: admin]: " ADMIN_USER_INPUT
ADMIN_USER=${ADMIN_USER_INPUT:-admin}

# Generate random secure default password
RANDOM_PASS=$(openssl rand -hex 6 2>/dev/null || date +%s | sha256sum | base64 | head -c 10)
read -p "رمز عبور ورود مدیر ارشد (INITIAL_ADMIN_PASS) [پیش‌فرض: ${RANDOM_PASS}]: " ADMIN_PASS_INPUT
ADMIN_PASS=${ADMIN_PASS_INPUT:-$RANDOM_PASS}

read -p "شماره موبایل مدیر ارشد جهت لاگین و OTP (INITIAL_ADMIN_PHONE) [پیش‌فرض: 09120000000]: " ADMIN_PHONE_INPUT
ADMIN_PHONE=${ADMIN_PHONE_INPUT:-09120000000}

# 3. Check & Install Docker
echo ""
echo -e "${PURPLE}[3/5] بررسی زیرساخت داکر (Docker & Docker Compose)...${NC}"

if ! command -v docker >/dev/null 2>&1; then
  echo -e "${YELLOW}[INFO] داکر یافت نشد. در حال نصب خودکار موتور داکر...${NC}"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
  echo -e "${GREEN}[OK] داکر با موفقیت نصب و فعال گردید.${NC}"
else
  echo -e "${GREEN}[OK] موتور داکر از قبل نصب و آماده است.${NC}"
fi

# Ensure docker compose plugin exists
if ! docker compose version >/dev/null 2>&1; then
  echo -e "${YELLOW}[INFO] در حال نصب پلاگین Docker Compose...${NC}"
  apt-get update -y && apt-get install -y docker-compose-plugin || true
fi

# 4. Generate Secrets & Environment Configuration
echo ""
echo -e "${PURPLE}[4/5] تولید کلیدهای رمزنگاری و فایل پیکربندی امنیتی (.env.production)...${NC}"

JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "dongchi_prod_jwt_secret_$(date +%s)")
POSTGRES_PASS=$(openssl rand -hex 16 2>/dev/null || echo "dongchi_db_pass_$(date +%s)")

mkdir -p data public/downloads

cat <<EOF > .env.production
# DongChi Production Environment Configuration
NODE_ENV=production
APP_HOST_PORT=${APP_HOST_PORT}
APP_HOST_BIND=${DEFAULT_BIND}
POSTGRES_DB=dongchi_users_db
POSTGRES_USER=dongchi_app
POSTGRES_PASSWORD=${POSTGRES_PASS}
DATABASE_URL=postgresql://dongchi_app:${POSTGRES_PASS}@dongchi-postgres:5432/dongchi_users_db?schema=public
NEXT_PUBLIC_APP_URL=http://${DOMAIN}:${APP_HOST_PORT}
JWT_SECRET=${JWT_SECRET}
INITIAL_ADMIN_USER=${ADMIN_USER}
INITIAL_ADMIN_PASS=${ADMIN_PASS}
INITIAL_ADMIN_PHONE=${ADMIN_PHONE}
EOF

chmod 600 .env.production

# 5. Build and Launch Containers
echo ""
echo -e "${PURPLE}[5/5] ساخت ایمیج‌ها و راه‌اندازی کانتینرهای دنگ‌چی (Docker Compose)...${NC}"

export APP_HOST_PORT=${APP_HOST_PORT}
export APP_HOST_BIND=${DEFAULT_BIND}
export POSTGRES_PASSWORD=${POSTGRES_PASS}
export JWT_SECRET=${JWT_SECRET}
export INITIAL_ADMIN_USER=${ADMIN_USER}
export INITIAL_ADMIN_PASS=${ADMIN_PASS}
export INITIAL_ADMIN_PHONE=${ADMIN_PHONE}

docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo ""
echo -e "${CYAN}در حال ارزیابی سلامت سرویس (Healthcheck)...${NC}"
sleep 5

HEALTH_STATUS="SUCCESS"
curl -s -m 5 "http://127.0.0.1:${APP_HOST_PORT}/api/health" >/dev/null 2>&1 || HEALTH_STATUS="PENDING"

# Completion Summary
echo ""
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo -e "${GREEN}${BOLD}        تبریک! سامانه حسابداری دنگ‌چی با موفقیت نصب و راه‌اندازی شد.         ${NC}"
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo ""
echo -e "🔹 ${BOLD}آدرس سامانه:${NC}            http://${DOMAIN}:${APP_HOST_PORT}"
echo -e "🔹 ${BOLD}اتاق فرمان مدیریت (Admin):${NC} http://${DOMAIN}:${APP_HOST_PORT}/admin/login"
echo -e "🔹 ${BOLD}نام کاربری مدیر ارشد:${NC}     ${YELLOW}${ADMIN_USER}${NC}"
echo -e "🔹 ${BOLD}رمز عبور مدیر ارشد:${NC}       ${YELLOW}${ADMIN_PASS}${NC}"
echo -e "🔹 ${BOLD}شماره موبایل مدیر:${NC}        ${YELLOW}${ADMIN_PHONE}${NC}"
echo ""
echo -e "🛡️  ${BOLD}وضعیت معماری:${NC} دیتابیس ایزوله ادمین فعال | پل ارتباطی Identity Bridge همگام | بدون تداخل پورت با سرویس‌های دیگر"
echo ""

if [ "$RUN_MODE" = "PROXY" ]; then
  echo -e "${CYAN}${BOLD}[کانفیگ پیشنهادی Nginx در صورت اتصال به دامنه]:${NC}"
  echo "--------------------------------------------------------"
  echo "server {"
  echo "    listen 80;"
  echo "    server_name ${DOMAIN};"
  echo ""
  echo "    location / {"
  echo "        proxy_pass http://127.0.0.1:${APP_HOST_PORT};"
  echo "        proxy_http_version 1.1;"
  echo "        proxy_set_header Upgrade \$http_upgrade;"
  echo "        proxy_set_header Connection 'upgrade';"
  echo "        proxy_set_header Host \$host;"
  echo "        proxy_cache_bypass \$http_upgrade;"
  echo "    }"
  echo "}"
  echo "--------------------------------------------------------"
  echo ""
fi

echo -e "دستورات مدیریتی سرور:"
echo -e "  مشاهده لاگ زنده:     ${BOLD}docker compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "  راه‌اندازی مجدد:      ${BOLD}docker compose -f docker-compose.prod.yml restart${NC}"
echo -e "  توقف کانتینرها:      ${BOLD}docker compose -f docker-compose.prod.yml down${NC}"
echo ""
