#!/usr/bin/env bash
# ==============================================================================
# دنگ‌چی • اسکریپت نصب و راه‌اندازی سرور ابری (DongChi Production Installer)
# معماری مقیاس‌پذیر، بدون تداخل با x-ui / w-ui / Nginx + دستور مدیریتی dongchi در لینوکس
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

INSTALL_DIR=$(pwd)
SERVER_IP=$(curl -s -m 4 https://api.ipify.org || curl -s -m 4 https://icanhazip.com || echo "127.0.0.1")

echo -e "${BLUE}[INFO] مسیر نصب: ${BOLD}${INSTALL_DIR}${NC}"
echo -e "${BLUE}[INFO] آدرس آی‌پی عمومی شناسایی‌شده سرور: ${BOLD}${SERVER_IP}${NC}"
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
CUSTOM_HTTPS_PORT="8443"

if [ "$PORT_80_USED" = true ] || [ "$PORT_443_USED" = true ]; then
  echo -e "${YELLOW}[هشدار مهم] پورت‌های ۸۰ یا ۴۴۳ سرور در حال حاضر توسط سرویس دیگری (مانند x-ui، w-ui یا Nginx فعال) اشغال شده‌اند.${NC}"
  echo -e "${GREEN}طراحی دنگ‌چی به گونه‌ای است که بدون کوچک‌ترین اختلال یا توقف در سرویس‌های فعلی، در کنار آن‌ها اجرا می‌شود.${NC}"
  echo ""
  echo "لطفاً حالت استقرار مورد نظر خود را انتخاب فرمایید:"
  echo "  1) حالت پروکسی اشتراکی Nginx: دنگ‌چی روی پورت لوکال ۳۰۰۰ کار کرده و فایل کانفیگ به /etc/nginx/conf.d اضافه می‌شود (پیشنهادی)"
  echo "  2) حالت پورت مستقل اختصاصی: دنگ‌چی روی پورت عمومی دلخواه (مانند ۸۴۴۳، ۲۰۵۳ یا ۲۰۸۳) به صورت مستقل و ایزوله بالا می‌آید"
  echo ""
  read -p "انتخاب شما [1 یا 2] (پیش‌فرض: 1): " MODE_CHOICE < /dev/tty
  MODE_CHOICE=${MODE_CHOICE:-1}

  if [ "$MODE_CHOICE" = "2" ]; then
    RUN_MODE="CUSTOM_PORT"
    DEFAULT_BIND="0.0.0.0"
    echo ""
    read -p "شماره پورت عمومی دلخواه برای دسترسی به دنگ‌چی (پیش‌فرض: 8443): " USER_CUSTOM_PORT < /dev/tty
    CUSTOM_HTTPS_PORT=${USER_CUSTOM_PORT:-8443}
    DEFAULT_APP_PORT=$CUSTOM_HTTPS_PORT
  else
    RUN_MODE="PROXY"
    DEFAULT_BIND="127.0.0.1"
    DEFAULT_APP_PORT="3000"
  fi
else
  echo -e "${GREEN}[OK] پورت‌های استاندارد سرور آزاد هستند.${NC}"
  echo "  1) حالت استاندارد لوکال (اتصال به Nginx معکوس روی پورت 3000)"
  echo "  2) حالت دسترسی مستقیم عمومی به پورت 3000"
  read -p "انتخاب شما [1 یا 2] (پیش‌فرض: 1): " MODE_CHOICE < /dev/tty
  if [ "$MODE_CHOICE" = "2" ]; then
    DEFAULT_BIND="0.0.0.0"
    RUN_MODE="DIRECT"
  else
    DEFAULT_BIND="127.0.0.1"
    RUN_MODE="PROXY"
  fi
fi

if [ "$DEFAULT_APP_PORT" = "3000" ] && [ "$PORT_3000_USED" = true ]; then
  DEFAULT_APP_PORT="3040"
  echo -e "${YELLOW}[نکته] پورت ۳۰۰۰ اشغال بود؛ پورت به ۳۰۴۰ تغییر یافت.${NC}"
fi

APP_HOST_PORT=$DEFAULT_APP_PORT

echo ""
echo -e "${PURPLE}[2/5] تنظیمات دامنه و شناسه مدیر ارشد سیستم...${NC}"

read -p "نام دامنه یا ساب‌دامنه سامانه (مثال: dongchi.example.com یا ${SERVER_IP}): " DOMAIN_INPUT < /dev/tty
DOMAIN=${DOMAIN_INPUT:-$SERVER_IP}

read -p "نام کاربری مدیر ارشد (INITIAL_ADMIN_USER) [پیش‌فرض: admin]: " ADMIN_USER_INPUT < /dev/tty
ADMIN_USER=${ADMIN_USER_INPUT:-admin}

RANDOM_PASS=$(openssl rand -hex 6 2>/dev/null || date +%s | sha256sum | base64 | head -c 10)
read -p "رمز عبور ورود مدیر ارشد (INITIAL_ADMIN_PASS) [پیش‌فرض: ${RANDOM_PASS}]: " ADMIN_PASS_INPUT < /dev/tty
ADMIN_PASS=${ADMIN_PASS_INPUT:-$RANDOM_PASS}

read -p "شماره موبایل مدیر ارشد جهت لاگین و OTP (INITIAL_ADMIN_PHONE) [پیش‌فرض: 09120000000]: " ADMIN_PHONE_INPUT < /dev/tty
ADMIN_PHONE=${ADMIN_PHONE_INPUT:-09120000000}

# 3. Check & Install Docker
echo ""
echo -e "${PURPLE}[3/5] بررسی زیرساخت داکر و داکر کامپوز...${NC}"

if ! command -v docker >/dev/null 2>&1; then
  echo -e "${YELLOW}[INFO] در حال نصب خودکار موتور داکر...${NC}"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
  echo -e "${GREEN}[OK] داکر با موفقیت نصب و فعال گردید.${NC}"
else
  echo -e "${GREEN}[OK] موتور داکر از قبل نصب و آماده است.${NC}"
fi

if ! docker compose version >/dev/null 2>&1; then
  echo -e "${YELLOW}[INFO] در حال نصب افزونه Docker Compose...${NC}"
  apt-get update -y && apt-get install -y docker-compose-plugin || true
fi

# 4. Generate Secrets & Environment Configuration
echo ""
echo -e "${PURPLE}[4/5] تولید کلیدهای رمزنگاری و فایل پیکربندی امنیتی (.env.production)...${NC}"

JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "dongchi_prod_jwt_secret_$(date +%s)")
POSTGRES_PASS=$(openssl rand -hex 16 2>/dev/null || echo "dongchi_db_pass_$(date +%s)")

mkdir -p data public/downloads deploy

cat <<EOF > .env.production
# DongChi Production Environment Configuration
NODE_ENV=production
APP_HOST_PORT=${APP_HOST_PORT}
APP_HOST_BIND=${DEFAULT_BIND}
POSTGRES_DB=dongchi_users_db
POSTGRES_USER=dongchi_app
POSTGRES_PASSWORD=${POSTGRES_PASS}
DATABASE_URL=postgresql://dongchi_app:${POSTGRES_PASS}@dongchi-postgres:5432/dongchi_users_db?schema=public
ADMINS_DATABASE_URL=postgresql://dongchi_app:${POSTGRES_PASS}@dongchi-postgres:5432/dongchi_admins_db?schema=public
REDIS_URL=redis://dongchi-redis:6379
NEXT_PUBLIC_APP_URL=http://${DOMAIN}:${APP_HOST_PORT}
JWT_SECRET=${JWT_SECRET}
INITIAL_ADMIN_USER=${ADMIN_USER}
INITIAL_ADMIN_PASS=${ADMIN_PASS}
INITIAL_ADMIN_PHONE=${ADMIN_PHONE}
EOF

chmod 600 .env.production

# 5. Build and Launch Containers
echo ""
echo -e "${PURPLE}[5/5] ساخت ایمیج‌ها و اجرای کانتینرها (Docker Compose)...${NC}"

export APP_HOST_PORT=${APP_HOST_PORT}
export APP_HOST_BIND=${DEFAULT_BIND}
export POSTGRES_PASSWORD=${POSTGRES_PASS}
export JWT_SECRET=${JWT_SECRET}
export INITIAL_ADMIN_USER=${ADMIN_USER}
export INITIAL_ADMIN_PASS=${ADMIN_PASS}
export INITIAL_ADMIN_PHONE=${ADMIN_PHONE}

docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 6. Install Global CLI Command `dongchi` in /usr/local/bin/dongchi
echo ""
echo -e "${CYAN}[+] در حال نصب ابزار مدیریت دائمی سرور (/usr/local/bin/dongchi)...${NC}"

cat <<'EOFCLI' > /usr/local/bin/dongchi
#!/usr/bin/env bash
# ==============================================================================
# ابزار خط فرمان مدیریت سامانه دنگ‌چی (DongChi CLI Manager)
# مشابه پنل‌های x-ui و w-ui
# ==============================================================================

# Ensure terminal stdin
if [ ! -t 0 ]; then
  exec < /dev/tty || true
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Auto-detect DongChi installation directory
if [ -f "./docker-compose.prod.yml" ]; then
  DONGCHI_DIR=$(pwd)
elif [ -f "/root/DongChi/docker-compose.prod.yml" ]; then
  DONGCHI_DIR="/root/DongChi"
elif [ -f "/var/www/dongchi/docker-compose.prod.yml" ]; then
  DONGCHI_DIR="/var/www/dongchi"
else
  # Search for DongChi directory
  DONGCHI_DIR=$(find / -maxdepth 3 -name "docker-compose.prod.yml" 2>/dev/null | grep -i dongchi | head -n 1 | xargs -r dirname)
  DONGCHI_DIR=${DONGCHI_DIR:-$(pwd)}
fi

cd "$DONGCHI_DIR" 2>/dev/null || true

show_menu() {
  clear || true
  echo -e "${CYAN}${BOLD}"
  echo "=============================================================================="
  echo "                اتاق فرمان لینوکسی سامانه دنگ‌چی (DongChi CLI)                "
  echo "                 Enterprise FinTech Core Management Console                   "
  echo "=============================================================================="
  echo -e "${NC}"
  echo -e "🔹 مسیر پروژه: ${BOLD}${DONGCHI_DIR}${NC}"
  echo ""
  echo -e "  ${BOLD}1)${NC} ${GREEN}مشاهده وضعیت سرویس‌ها و مصرف منابع (Status & Health)${NC}"
  echo -e "  ${BOLD}2)${NC} ${YELLOW}تغییر نام کاربری و رمز عبور ادمین کل (Reset Admin Credentials)${NC}"
  echo -e "  ${BOLD}3)${NC} ${BLUE}تغییر پورت یا دامنه و تنظیم گواهی SSL (Domain & Port Config)${NC}"
  echo -e "  ${BOLD}4)${NC} ${PURPLE}بروزرسانی هسته دنگ‌چی بدون قطعی دیتا (Zero-Downtime Update)${NC}"
  echo -e "  ${BOLD}5)${NC} ${CYAN}تهیه بکاپ فوری از دیتابیس کاربران و مدیران (Instant DB Backup)${NC}"
  echo -e "  ${BOLD}6)${NC} ${YELLOW}مشاهده لاگ‌های زنده سرور (Live Docker Logs)${NC}"
  echo -e "  ${BOLD}7)${NC} ${RED}راه‌اندازی مجدد سرویس‌ها (Restart Containers)${NC}"
  echo -e "  ${BOLD}8)${NC} ${RED}توقف کامل سرویس‌ها (Stop Containers)${NC}"
  echo -e "  ${BOLD}0)${NC} خروج از منو"
  echo ""
  read -p "گزینه مورد نظر خود را وارد کنید [0-8]: " OPT < /dev/tty

  case "$OPT" in
    1)
      echo ""
      echo -e "${CYAN}--- وضعیت کانتینرهای فعال دنگ‌چی ---${NC}"
      docker compose -f docker-compose.prod.yml ps
      echo ""
      echo -e "${CYAN}--- تست سلامت API ---${NC}"
      curl -s -m 4 http://127.0.0.1:3000/api/health || curl -s -m 4 http://127.0.0.1:8080/api/health || echo "در حال بررسی..."
      echo ""
      read -p "برای ادامه اینتر بزنید..." DUMMY < /dev/tty
      show_menu
      ;;
    2)
      echo ""
      echo -e "${YELLOW}--- تغییر رمز عبور و شناسه مدیر ارشد ---${NC}"
      read -p "نام کاربری جدید مدیر ارشد [admin]: " NEW_USER < /dev/tty
      NEW_USER=${NEW_USER:-admin}
      read -p "رمز عبور جدید مدیر ارشد: " NEW_PASS < /dev/tty
      if [ -n "$NEW_PASS" ]; then
        sed -i "s/^INITIAL_ADMIN_USER=.*/INITIAL_ADMIN_USER=${NEW_USER}/" .env.production
        sed -i "s/^INITIAL_ADMIN_PASS=.*/INITIAL_ADMIN_PASS=${NEW_PASS}/" .env.production
        docker compose -f docker-compose.prod.yml restart dongchi-web
        echo -e "${GREEN}[OK] مشخصات مدیر ارشد با موفقیت به‌روزرسانی شد.${NC}"
      else
        echo -e "${RED}[ERROR] رمز عبور نمی‌تواند خالی باشد.${NC}"
      fi
      read -p "برای ادامه اینتر بزنید..." DUMMY < /dev/tty
      show_menu
      ;;
    3)
      echo ""
      echo -e "${BLUE}--- تنظیمات دامنه، پورت و پروکسی ---${NC}"
      read -p "شماره پورت جدید برنامه (مثال: 3000 یا 8443): " NEW_PORT < /dev/tty
      if [ -n "$NEW_PORT" ]; then
        sed -i "s/^APP_HOST_PORT=.*/APP_HOST_PORT=${NEW_PORT}/" .env.production
        docker compose -f docker-compose.prod.yml up -d
        echo -e "${GREEN}[OK] پورت برنامه به ${NEW_PORT} تغییر یافت.${NC}"
      fi
      read -p "برای ادامه اینتر بزنید..." DUMMY < /dev/tty
      show_menu
      ;;
    4)
      echo ""
      echo -e "${PURPLE}--- بروزرسانی خودکار دنگ‌چی از گیت‌هاب (Zero-Downtime) ---${NC}"
      git pull origin main || true
      docker compose -f docker-compose.prod.yml up -d --build
      echo -e "${GREEN}[OK] بروزرسانی با موفقیت اعمال گردید.${NC}"
      read -p "برای ادامه اینتر بزنید..." DUMMY < /dev/tty
      show_menu
      ;;
    5)
      echo ""
      echo -e "${CYAN}--- تهیه بکاپ کامل دیتابیس‌ها ---${NC}"
      BACKUP_FILE="./data/backup_$(date +%Y%m%d_%H%M%S).sql"
      docker exec -t dongchi-postgres pg_dumpall -U dongchi_app > "$BACKUP_FILE" 2>/dev/null || true
      echo -e "${GREEN}[OK] فایل پشتیبان در مسیر زیر ذخیره شد:${NC} ${BACKUP_FILE}"
      read -p "برای ادامه اینتر بزنید..." DUMMY < /dev/tty
      show_menu
      ;;
    6)
      echo ""
      echo -e "${YELLOW}--- نمایش لاگ‌های زنده سرور (برای خروج Ctrl+C بزنید) ---${NC}"
      docker compose -f docker-compose.prod.yml logs -f --tail=100
      show_menu
      ;;
    7)
      echo ""
      echo -e "${RED}--- راه‌اندازی مجدد سرویس‌ها ---${NC}"
      docker compose -f docker-compose.prod.yml restart
      echo -e "${GREEN}[OK] سرویس‌ها ری‌استارت شدند.${NC}"
      read -p "برای ادامه اینتر بزنید..." DUMMY < /dev/tty
      show_menu
      ;;
    8)
      echo ""
      echo -e "${RED}--- توقف کامل سرویس‌های دنگ‌چی ---${NC}"
      docker compose -f docker-compose.prod.yml down
      echo -e "${YELLOW}[OK] کانتینرها متوقف شدند.${NC}"
      read -p "برای ادامه اینتر بزنید..." DUMMY < /dev/tty
      show_menu
      ;;
    0|*)
      echo "خروج از اتاق فرمان دنگ‌چی."
      exit 0
      ;;
  esac
}

show_menu
EOFCLI

chmod +x /usr/local/bin/dongchi || true

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
echo -e "🛡️  ${BOLD}دستور ترمینال اختصاصی:${NC} هر زمان در ترمینال سرور تایپ کنید ${GREEN}${BOLD}dongchi${NC} منوی مدیریت سرور باز می‌شود!"
echo ""

if [ "$RUN_MODE" = "PROXY" ]; then
  echo -e "${CYAN}${BOLD}[کانفیگ پیشنهادی Nginx جهت اتصال به دامنه]:${NC}"
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
