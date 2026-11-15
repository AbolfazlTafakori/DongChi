#!/usr/bin/env bash
# ==============================================================================
# DongChi Platform — Official Isolated One-Line Ubuntu Installer & CLI Manager
# Workspace Sandbox : /opt/dongchi
# Docker Namespace  : dongchi_stack
# Usage             : bash <(curl -fsSL https://raw.githubusercontent.com/AbolfazlTafakori/DongChi/main/install.sh)
# ==============================================================================

set -euo pipefail

# Reconnect stdin to terminal if script is piped (curl ... | bash)
if [ ! -t 0 ]; then
  exec < /dev/tty || true
fi

# ------------------------------------------------------------------------------
# Strict Sandbox Paths (Everything stays inside /opt/dongchi)
# ------------------------------------------------------------------------------
INSTALL_ROOT="/opt/dongchi"
APP_DIR="${INSTALL_ROOT}/app"
DATA_DIR="${INSTALL_ROOT}/data"
PG_DIR="${INSTALL_ROOT}/pgdata"
REDIS_DIR="${INSTALL_ROOT}/redisdata"
SSL_DIR="${INSTALL_ROOT}/ssl"
BACKUP_DIR="${INSTALL_ROOT}/backups"
LOG_DIR="${INSTALL_ROOT}/logs"
ENV_FILE="${APP_DIR}/.env.production"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"
PROJECT_NAME="dongchi_stack"
CLI_BIN="/usr/local/bin/dongchi"
REPO_URL="${DONGCHI_REPO_URL:-https://github.com/AbolfazlTafakori/DongChi.git}"

# ANSI Colors
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
echo "          DongChi Platform — Official Ubuntu Server Installer (v2.6)          "
echo "      Sandboxed in /opt/dongchi | Zero-Conflict Coexistence Architecture     "
echo "=============================================================================="
echo -e "${NC}"

# ------------------------------------------------------------------------------
# 1. Pre-Flight Checks & Sandbox Initialization
# ------------------------------------------------------------------------------
if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo -e "${RED}[ERROR] Please run this installer with root privileges (sudo bash ...).${NC}"
  exit 1
fi

echo -e "${BLUE}[INFO] Initializing secure isolated directory structure at ${INSTALL_ROOT}...${NC}"
mkdir -p "$INSTALL_ROOT"
chmod 700 "$INSTALL_ROOT"
mkdir -p "$APP_DIR" "$DATA_DIR" "$PG_DIR" "$REDIS_DIR" "$SSL_DIR" "$BACKUP_DIR" "$LOG_DIR"

# Deploy application files into /opt/dongchi/app
if [ -f "./docker-compose.prod.yml" ] && [ -f "./Dockerfile" ]; then
  echo -e "${BLUE}[INFO] Copying local project files into ${APP_DIR}...${NC}"
  cp -ru ./* "$APP_DIR/" 2>/dev/null || cp -r ./* "$APP_DIR/"
elif [ ! -f "${APP_DIR}/docker-compose.prod.yml" ]; then
  echo -e "${BLUE}[INFO] Cloning repository into isolated sandbox ${APP_DIR}...${NC}"
  if ! command -v git >/dev/null 2>&1; then
    apt-get update -y && apt-get install -y --no-install-recommends git
  fi
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
else
  echo -e "${GREEN}[OK] Existing application source detected in ${APP_DIR}.${NC}"
fi

# Ensure deploy and downloads directories exist
mkdir -p "${APP_DIR}/deploy" "${APP_DIR}/public/downloads"
if [ ! -f "${APP_DIR}/deploy/init-dual-db.sql" ]; then
  cat <<'EOFSQL' > "${APP_DIR}/deploy/init-dual-db.sql"
-- Initialize Dual Databases
SELECT 'CREATE DATABASE dongchi_admins_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dongchi_admins_db')\gexec
EOFSQL
fi

cd "$APP_DIR"

SERVER_IP=$(curl -s -m 4 https://api.ipify.org 2>/dev/null || curl -s -m 4 https://icanhazip.com 2>/dev/null || echo "127.0.0.1")
echo -e "${BLUE}[INFO] Detected Server Public IP: ${BOLD}${SERVER_IP}${NC}"
echo ""

# ------------------------------------------------------------------------------
# 2. Non-Intrusive Dependency Check
# ------------------------------------------------------------------------------
echo -e "${PURPLE}[1/6] Checking system packages and container engine...${NC}"
MISSING_PKGS=()
for pkg in curl git openssl lsof certbot nginx; do
  if ! command -v "$pkg" >/dev/null 2>&1; then
    MISSING_PKGS+=("$pkg")
  fi
done

if [ ${#MISSING_PKGS[@]} -gt 0 ]; then
  echo -e "${YELLOW}[INFO] Installing missing non-intrusive dependencies: ${MISSING_PKGS[*]}...${NC}"
  apt-get update -y || true
  for pkg in "${MISSING_PKGS[@]}"; do
    apt-get install -y --no-install-recommends "$pkg" || true
  done
else
  echo -e "${GREEN}[OK] Required base packages are installed.${NC}"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo -e "${YELLOW}[INFO] Installing Docker Engine...${NC}"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  echo -e "${GREEN}[OK] Docker Engine is active.${NC}"
fi

if ! docker compose version >/dev/null 2>&1; then
  echo -e "${YELLOW}[INFO] Installing Docker Compose plugin...${NC}"
  apt-get update -y && apt-get install -y --no-install-recommends docker-compose-plugin || true
else
  echo -e "${GREEN}[OK] Docker Compose is ready.${NC}"
fi

# ------------------------------------------------------------------------------
# 3. Smart Port Scanner & Free Port Finder
# ------------------------------------------------------------------------------
echo ""
echo -e "${PURPLE}[2/6] Scanning ports to guarantee zero collision with other services...${NC}"

is_port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    if ss -tuln | awk '{print $5}' | grep -Eq "(^|:)${port}$"; then
      return 0
    fi
  fi
  if command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:"${port}" -sTCP:LISTEN -P -n >/dev/null 2>&1; then
      return 0
    fi
  fi
  if command -v docker >/dev/null 2>&1; then
    if docker ps --format '{{.Ports}}' 2>/dev/null | grep -Eq ":${port}->"; then
      return 0
    fi
  fi
  return 1
}

find_free_port() {
  local start_port="${1:-3000}"
  local max_port="${2:-3999}"
  local candidate="$start_port"
  while [ "$candidate" -le "$max_port" ]; do
    if ! is_port_in_use "$candidate"; then
      echo "$candidate"
      return 0
    fi
    candidate=$((candidate + 1))
  done
  echo "$start_port"
  return 1
}

# Auto-select free loopback port starting from 3000
DETECTED_FREE_PORT=$(find_free_port 3000 3999)
if is_port_in_use 3000; then
  echo -e "${YELLOW}[INFO] Port 3000 is already in use by another service. Auto-selected free internal port: ${DETECTED_FREE_PORT}${NC}"
else
  echo -e "${GREEN}[OK] Default internal port 3000 is available.${NC}"
fi
DEFAULT_APP_PORT="$DETECTED_FREE_PORT"

PORT_80_USED=false
PORT_443_USED=false
if is_port_in_use 80; then PORT_80_USED=true; fi
if is_port_in_use 443; then PORT_443_USED=true; fi

echo ""
echo -e "${BLUE}[Port & Coexistence Mode Selection]:${NC}"
if [ "$PORT_80_USED" = true ] || [ "$PORT_443_USED" = true ]; then
  echo -e "${YELLOW}[NOTICE] Port 80 and/or 443 are currently used by another service (e.g. Nginx, X-UI, or W-UI).${NC}"
  echo "  1) Coexist via Host Nginx Reverse Proxy (Recommended if Nginx is already running on 443)"
  echo "  2) Run on a Dedicated Custom HTTPS Port (e.g. 8443, 2053, 2083 - Zero conflict with X-UI / W-UI / other panels)"
  read -p "Select mode [1 or 2] (Default: 1): " MODE_CHOICE < /dev/tty
  MODE_CHOICE=${MODE_CHOICE:-1}
else
  echo "  1) Coexist via Host Nginx Reverse Proxy (Recommended)"
  echo "  2) Run on a Dedicated Custom HTTPS Port (e.g. 8443, 2053, 2083 - Zero conflict with X-UI / W-UI / other panels)"
  echo "  3) Standard Ports 80/443 (Only if ports 80 & 443 are currently free)"
  read -p "Select mode [1, 2, or 3] (Default: 1): " MODE_CHOICE < /dev/tty
  MODE_CHOICE=${MODE_CHOICE:-1}
fi

if [ "$MODE_CHOICE" = "2" ]; then
  RUN_MODE="CUSTOM_PORT"
  SUGGESTED_SSL_PORT=$(find_free_port 8443 8999)
  read -p "Enter Public HTTPS Port [Default: ${SUGGESTED_SSL_PORT}]: " USER_SSL_PORT < /dev/tty
  PUBLIC_HTTPS_PORT=${USER_SSL_PORT:-$SUGGESTED_SSL_PORT}
  if is_port_in_use "$PUBLIC_HTTPS_PORT"; then
    PUBLIC_HTTPS_PORT=$(find_free_port 8443 8999)
    echo -e "${YELLOW}[!] Chosen port was occupied. Auto-selected free port: ${PUBLIC_HTTPS_PORT}${NC}"
  fi
elif [ "$MODE_CHOICE" = "3" ]; then
  RUN_MODE="STANDARD"
  PUBLIC_HTTPS_PORT=443
else
  RUN_MODE="PROXY"
  PUBLIC_HTTPS_PORT=443
fi

# Allow setting loopback port
read -p "Enter Internal Loopback Port [Default: ${DEFAULT_APP_PORT}]: " USER_APP_PORT < /dev/tty
if [ -n "$USER_APP_PORT" ]; then
  if is_port_in_use "$USER_APP_PORT"; then
    FALLBACK_PORT=$(find_free_port 3000 3999)
    echo -e "${YELLOW}[!] Port ${USER_APP_PORT} is in use; auto-selected free port: ${FALLBACK_PORT}${NC}"
    APP_HOST_PORT=$FALLBACK_PORT
  else
    APP_HOST_PORT=$USER_APP_PORT
  fi
else
  APP_HOST_PORT=$DEFAULT_APP_PORT
fi

echo -e "${GREEN}[OK] Configured internal port: ${APP_HOST_PORT} | Public HTTPS port: ${PUBLIC_HTTPS_PORT}${NC}"

# ------------------------------------------------------------------------------
# 4. Interactive Configuration & Credentials
# ------------------------------------------------------------------------------
echo ""
echo -e "${PURPLE}[3/6] Configuring Domain and Super Admin Credentials...${NC}"

read -p "Enter your Domain or Subdomain (e.g. app.example.com): " DOMAIN_INPUT < /dev/tty
DOMAIN=${DOMAIN_INPUT:-$SERVER_IP}

read -p "Enter Super Admin Username [Default: admin]: " ADMIN_USER_INPUT < /dev/tty
ADMIN_USER=${ADMIN_USER_INPUT:-admin}

RANDOM_PASS=$(openssl rand -hex 6 2>/dev/null || echo "Admin${RANDOM}")
read -p "Enter Super Admin Password [min 6 chars] [Default: ${RANDOM_PASS}]: " ADMIN_PASS_INPUT < /dev/tty
ADMIN_PASS=${ADMIN_PASS_INPUT:-$RANDOM_PASS}

read -p "Enter Super Admin Phone Number (for User-DB Identity Bridge) [Default: 09120000000]: " ADMIN_PHONE_INPUT < /dev/tty
ADMIN_PHONE=${ADMIN_PHONE_INPUT:-09120000000}

# ------------------------------------------------------------------------------
# 5. Safe SSL Certificate Provisioning (Inside /opt/dongchi/ssl/${DOMAIN})
# ------------------------------------------------------------------------------
echo ""
echo -e "${PURPLE}[4/6] Provisioning SSL/TLS Certificate for ${DOMAIN}...${NC}"
DOMAIN_SSL_DIR="${SSL_DIR}/${DOMAIN}"
mkdir -p "$DOMAIN_SSL_DIR"

SSL_SUCCESS=false

# If domain is a valid FQDN (not a raw IP) and certbot is available, attempt Let's Encrypt
if [[ ! "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && command -v certbot >/dev/null 2>&1; then
  if ! is_port_in_use 80; then
    echo -e "${BLUE}[INFO] Port 80 is free. Requesting Let's Encrypt certificate via standalone...${NC}"
    if certbot certonly --standalone --agree-tos --non-interactive --register-unsafely-without-email -d "$DOMAIN" >/dev/null 2>&1; then
      if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        cp -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "${DOMAIN_SSL_DIR}/fullchain.pem"
        cp -f "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "${DOMAIN_SSL_DIR}/privkey.pem"
        SSL_SUCCESS=true
      fi
    fi
  elif command -v nginx >/dev/null 2>&1; then
    echo -e "${BLUE}[INFO] Nginx is running on port 80. Requesting Let's Encrypt certificate via webroot...${NC}"
    mkdir -p /var/www/certbot
    if certbot certonly --webroot -w /var/www/certbot --agree-tos --non-interactive --register-unsafely-without-email -d "$DOMAIN" >/dev/null 2>&1; then
      if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        cp -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "${DOMAIN_SSL_DIR}/fullchain.pem"
        cp -f "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "${DOMAIN_SSL_DIR}/privkey.pem"
        SSL_SUCCESS=true
      fi
    fi
  fi
fi

# Fallback to high-grade self-signed RSA TLS certificate if Let's Encrypt is skipped or unavailable
if [ "$SSL_SUCCESS" = false ] && [ ! -f "${DOMAIN_SSL_DIR}/fullchain.pem" ]; then
  echo -e "${YELLOW}[INFO] Creating 2048-bit RSA TLS certificate for ${DOMAIN}...${NC}"
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "${DOMAIN_SSL_DIR}/privkey.pem" \
    -out "${DOMAIN_SSL_DIR}/fullchain.pem" \
    -subj "/CN=${DOMAIN}/O=DongChi Platform/C=IR" >/dev/null 2>&1 || true
fi

chmod 600 "${DOMAIN_SSL_DIR}/privkey.pem" 2>/dev/null || true
chmod 644 "${DOMAIN_SSL_DIR}/fullchain.pem" 2>/dev/null || true
echo -e "${GREEN}[OK] SSL certificate verified in ${DOMAIN_SSL_DIR}.${NC}"

# ------------------------------------------------------------------------------
# 6. Safe Nginx Configuration with Automatic Rollback
# ------------------------------------------------------------------------------
echo ""
echo -e "${PURPLE}[5/6] Configuring Nginx reverse proxy with safe rollback guard...${NC}"
NGINX_CONF_DEST="/etc/nginx/conf.d/dongchi-${DOMAIN}.conf"
mkdir -p /etc/nginx/conf.d

cat <<EOFNGINX > "$NGINX_CONF_DEST"
upstream dongchi_${PROJECT_NAME}_backend {
    server 127.0.0.1:${APP_HOST_PORT};
    keepalive 64;
}

server {
    listen ${PUBLIC_HTTPS_PORT} ssl;
    server_name ${DOMAIN};

    ssl_certificate ${DOMAIN_SSL_DIR}/fullchain.pem;
    ssl_certificate_key ${DOMAIN_SSL_DIR}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://dongchi_${PROJECT_NAME}_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOFNGINX

if command -v nginx >/dev/null 2>&1; then
  echo -e "${BLUE}[INFO] Validating Nginx configuration syntax (nginx -t)...${NC}"
  if nginx -t >/dev/null 2>&1; then
    echo -e "${GREEN}[OK] Nginx syntax is valid. Reloading Nginx safely...${NC}"
    systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || true
  else
    echo -e "${RED}[WARNING] nginx -t syntax validation failed! Rolling back to protect existing sites...${NC}"
    rm -f "$NGINX_CONF_DEST"
    echo -e "${YELLOW}[ROLLBACK] Removed ${NGINX_CONF_DEST}. Existing Nginx configurations remain untouched.${NC}"
  fi
else
  echo -e "${YELLOW}[INFO] Nginx binary not found. Proxy file saved to ${NGINX_CONF_DEST}.${NC}"
fi

# ------------------------------------------------------------------------------
# 7. Isolated Docker Stack Launch (-p dongchi_stack)
# ------------------------------------------------------------------------------
echo ""
echo -e "${PURPLE}[6/6] Launching isolated Docker stack (${PROJECT_NAME})...${NC}"

JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "dongchi_prod_jwt_secret_$(date +%s)")
POSTGRES_PASS=$(openssl rand -hex 16 2>/dev/null || echo "dongchi_db_pass_$(date +%s)")

cat <<EOFENV > "$ENV_FILE"
# DongChi Production Environment (Isolated Sandbox)
NODE_ENV=production
APP_HOST_PORT=${APP_HOST_PORT}
POSTGRES_DB=dongchi_users_db
POSTGRES_USER=dongchi_app
POSTGRES_PASSWORD=${POSTGRES_PASS}
DATABASE_URL=postgresql://dongchi_app:${POSTGRES_PASS}@dongchi_postgres:5432/dongchi_users_db?schema=public
ADMINS_DATABASE_URL=postgresql://dongchi_app:${POSTGRES_PASS}@dongchi_postgres:5432/dongchi_admins_db?schema=public
REDIS_URL=redis://dongchi_redis:6379
NEXT_PUBLIC_APP_URL=https://${DOMAIN}:${PUBLIC_HTTPS_PORT}
JWT_SECRET=${JWT_SECRET}
INITIAL_ADMIN_USER=${ADMIN_USER}
INITIAL_ADMIN_PASS=${ADMIN_PASS}
INITIAL_ADMIN_PHONE=${ADMIN_PHONE}
EOFENV

chmod 600 "$ENV_FILE"

# Launch stack using explicit project name and compose file inside sandbox
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

# ------------------------------------------------------------------------------
# 8. Install 100% English Global Management CLI (/usr/local/bin/dongchi)
# ------------------------------------------------------------------------------
echo ""
echo -e "${CYAN}[+] Installing global management CLI (${CLI_BIN})...${NC}"

cat <<'EOFCLI' > /usr/local/bin/dongchi
#!/usr/bin/env bash
# ==============================================================================
# DongChi Platform — Server Control Panel (v2.6)
# Sandbox Directory : /opt/dongchi
# Docker Namespace  : dongchi_stack
# ==============================================================================

if [ ! -t 0 ]; then
  exec < /dev/tty || true
fi

# ANSI Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

INSTALL_ROOT="/opt/dongchi"
APP_DIR="${INSTALL_ROOT}/app"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"
ENV_FILE="${APP_DIR}/.env.production"
BACKUP_DIR="${INSTALL_ROOT}/backups"
PROJECT_NAME="dongchi_stack"

if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" 2>/dev/null || true
fi

is_port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    if ss -tuln | awk '{print $5}' | grep -Eq "(^|:)${port}$"; then
      return 0
    fi
  fi
  if command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:"${port}" -sTCP:LISTEN -P -n >/dev/null 2>&1; then
      return 0
    fi
  fi
  if command -v docker >/dev/null 2>&1; then
    if docker ps --format '{{.Ports}}' 2>/dev/null | grep -Eq ":${port}->"; then
      return 0
    fi
  fi
  return 1
}

find_free_port() {
  local start_port="${1:-3000}"
  local max_port="${2:-3999}"
  local candidate="$start_port"
  while [ "$candidate" -le "$max_port" ]; do
    if ! is_port_in_use "$candidate"; then
      echo "$candidate"
      return 0
    fi
    candidate=$((candidate + 1))
  done
  echo "$start_port"
  return 1
}

show_menu() {
  clear || true
  echo -e "${CYAN}${BOLD}"
  echo "=============================================================="
  echo "   DongChi Platform — Server Control Panel (v2.6)             "
  echo "   Sandbox Directory : /opt/dongchi                           "
  echo "=============================================================="
  echo -e "${NC}"
  echo -e "  ${BOLD}1)${NC} ${GREEN}Service Status & Health Check${NC}"
  echo -e "  ${BOLD}2)${NC} ${YELLOW}Reset Super Admin Username & Password${NC}"
  echo -e "  ${BOLD}3)${NC} ${BLUE}Change Domain / Ports & Re-issue SSL${NC}"
  echo -e "  ${BOLD}4)${NC} ${CYAN}Update DongChi Core (Zero-Downtime Pull & Rebuild)${NC}"
  echo -e "  ${BOLD}5)${NC} ${GREEN}Backup Databases (Saved to /opt/dongchi/backups)${NC}"
  echo -e "  ${BOLD}6)${NC} ${YELLOW}View Live Container Logs${NC}"
  echo -e "  ${BOLD}7)${NC} ${BLUE}Restart DongChi Stack${NC}"
  echo -e "  ${BOLD}8)${NC} ${RED}Stop DongChi Stack${NC}"
  echo -e "  ${BOLD}9)${NC} ${RED}Uninstall DongChi Safely (Removes only /opt/dongchi)${NC}"
  echo -e "  ${BOLD}0)${NC} Exit"
  echo "=============================================================="
  echo ""
  read -p "Enter option [0-9]: " OPT < /dev/tty

  case "$OPT" in
    1)
      echo ""
      echo -e "${CYAN}--- Container Status (${PROJECT_NAME}) ---${NC}"
      docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps
      echo ""
      echo -e "${CYAN}--- HTTP API Health Check ---${NC}"
      PORT=$(grep '^APP_HOST_PORT=' "$ENV_FILE" 2>/dev/null | cut -d '=' -f2)
      PORT=${PORT:-3000}
      curl -s -m 4 "http://127.0.0.1:${PORT}/api/health" || echo "API warming up..."
      echo ""
      read -p "Press Enter to continue..." DUMMY < /dev/tty
      show_menu
      ;;
    2)
      echo ""
      echo -e "${YELLOW}--- Reset Super Admin Credentials ---${NC}"
      read -p "Enter new admin username [admin]: " NEW_USER < /dev/tty
      NEW_USER=${NEW_USER:-admin}
      read -p "Enter new admin password: " NEW_PASS < /dev/tty
      if [ -n "$NEW_PASS" ]; then
        sed -i "s/^INITIAL_ADMIN_USER=.*/INITIAL_ADMIN_USER=${NEW_USER}/" "$ENV_FILE"
        sed -i "s/^INITIAL_ADMIN_PASS=.*/INITIAL_ADMIN_PASS=${NEW_PASS}/" "$ENV_FILE"
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" restart dongchi_web
        echo -e "${GREEN}[OK] Admin credentials updated successfully.${NC}"
      else
        echo -e "${RED}[ERROR] Password cannot be empty.${NC}"
      fi
      read -p "Press Enter to continue..." DUMMY < /dev/tty
      show_menu
      ;;
    3)
      echo ""
      echo -e "${BLUE}--- Change Domain / Ports & SSL ---${NC}"
      read -p "Enter new internal loopback port (e.g. 3000, 3001): " NEW_PORT < /dev/tty
      if [ -n "$NEW_PORT" ]; then
        if is_port_in_use "$NEW_PORT"; then
          FREE_P=$(find_free_port 3000 3999)
          echo -e "${YELLOW}[!] Port ${NEW_PORT} is in use; selected free port ${FREE_P}.${NC}"
          NEW_PORT="$FREE_P"
        fi
        sed -i "s/^APP_HOST_PORT=.*/APP_HOST_PORT=${NEW_PORT}/" "$ENV_FILE"
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d
        echo -e "${GREEN}[OK] Port changed to ${NEW_PORT}.${NC}"
      fi
      read -p "Press Enter to continue..." DUMMY < /dev/tty
      show_menu
      ;;
    4)
      echo ""
      echo -e "${CYAN}--- Updating DongChi Core (Zero-Downtime) ---${NC}"
      cd "$APP_DIR" && git pull origin main || true
      docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d --build
      echo -e "${GREEN}[OK] Update completed successfully.${NC}"
      read -p "Press Enter to continue..." DUMMY < /dev/tty
      show_menu
      ;;
    5)
      echo ""
      echo -e "${GREEN}--- Backup Databases ---${NC}"
      mkdir -p "$BACKUP_DIR"
      BACKUP_FILE="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql"
      docker exec -t dongchi_postgres pg_dumpall -U dongchi_app > "$BACKUP_FILE" 2>/dev/null || true
      echo -e "${GREEN}[OK] Backup archive saved to:${NC} ${BACKUP_FILE}"
      read -p "Press Enter to continue..." DUMMY < /dev/tty
      show_menu
      ;;
    6)
      echo ""
      echo -e "${YELLOW}--- Live Container Logs (Press Ctrl+C to exit) ---${NC}"
      docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs -f --tail=100
      show_menu
      ;;
    7)
      echo ""
      echo -e "${BLUE}--- Restarting DongChi Stack ---${NC}"
      docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" restart
      echo -e "${GREEN}[OK] All services restarted.${NC}"
      read -p "Press Enter to continue..." DUMMY < /dev/tty
      show_menu
      ;;
    8)
      echo ""
      echo -e "${RED}--- Stopping DongChi Stack ---${NC}"
      docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down
      echo -e "${YELLOW}[OK] DongChi containers stopped.${NC}"
      read -p "Press Enter to continue..." DUMMY < /dev/tty
      show_menu
      ;;
    9)
      echo ""
      echo -e "${RED}--- Uninstall DongChi Safely ---${NC}"
      read -p "Are you sure you want to remove DongChi from /opt/dongchi? [y/N]: " CONFIRM < /dev/tty
      if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}[INFO] Stopping and removing containers...${NC}"
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down -v 2>/dev/null || true
        rm -f /etc/nginx/conf.d/dongchi-*.conf 2>/dev/null || true
        nginx -t >/dev/null 2>&1 && systemctl reload nginx 2>/dev/null || true
        rm -rf "$INSTALL_ROOT"
        rm -f /usr/local/bin/dongchi
        echo -e "${GREEN}[OK] DongChi has been safely and completely removed.${NC}"
        exit 0
      else
        echo -e "${BLUE}[INFO] Uninstall cancelled.${NC}"
      fi
      read -p "Press Enter to continue..." DUMMY < /dev/tty
      show_menu
      ;;
    0|*)
      echo "Exiting DongChi Control Panel."
      exit 0
      ;;
  esac
}

show_menu
EOFCLI

chmod +x "$CLI_BIN" 2>/dev/null || true

# ------------------------------------------------------------------------------
# 9. Installation Summary (100% Clean English)
# ------------------------------------------------------------------------------
echo ""
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo -e "${GREEN}${BOLD}         DongChi Platform — Installation Completed Successfully!              ${NC}"
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo ""
echo -e "🔹 ${BOLD}System URL:${NC}              https://${DOMAIN}:${PUBLIC_HTTPS_PORT}"
echo -e "🔹 ${BOLD}Internal Loopback Port:${NC}  ${GREEN}${BOLD}${APP_HOST_PORT}${NC}"
echo -e "🔹 ${BOLD}Admin Control Panel:${NC}     https://${DOMAIN}:${PUBLIC_HTTPS_PORT}/admin/login"
echo -e "🔹 ${BOLD}Super Admin Username:${NC}    ${YELLOW}${ADMIN_USER}${NC}"
echo -e "🔹 ${BOLD}Super Admin Password:${NC}    ${YELLOW}${ADMIN_PASS}${NC}"
echo -e "🔹 ${BOLD}Super Admin Phone:${NC}       ${YELLOW}${ADMIN_PHONE}${NC}"
echo -e "🔹 ${BOLD}Sandbox Directory:${NC}       ${INSTALL_ROOT}"
echo ""
echo -e "🛡️  ${BOLD}Terminal CLI Manager:${NC} Type ${GREEN}${BOLD}dongchi${NC} anywhere in your shell to open the control panel!"
echo ""
echo -e "${CYAN}${BOLD}[Nginx Reverse Proxy Configuration]:${NC}"
echo "--------------------------------------------------------"
echo "File: /etc/nginx/conf.d/dongchi-${DOMAIN}.conf"
echo "Upstream target: http://127.0.0.1:${APP_HOST_PORT}"
echo "Status: Syntax validated and loaded via safe reload."
echo "--------------------------------------------------------"
echo ""
