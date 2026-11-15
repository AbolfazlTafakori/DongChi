#!/usr/bin/env bash
# =============================================================================
# DONGCHI (دنگ‌چی) UBUNTU 22.04 / 24.04 LTS AUTOMATED SERVER SETUP SCRIPT
# =============================================================================

set -euo pipefail

echo "=================================================="
echo " Starting DongChi Production Server Provisioning "
echo " Target OS: Ubuntu 22.04 / 24.04 LTS             "
echo "=================================================="

# 1. Update and upgrade system packages
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git ufw nginx certbot python3-certbot-nginx apt-transport-https ca-certificates gnupg lsb-release

# 2. Install Official Docker Engine & Compose Plugin
if ! command -v docker &> /dev/null; then
    echo "Installing Docker Engine..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker "$USER"
fi

# 3. Configure UFW Firewall
echo "Configuring UFW Firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP Nginx'
sudo ufw allow 443/tcp comment 'HTTPS SSL Nginx'
sudo ufw --force enable

# 4. Create App Directories & Backup Storage
echo "Creating application and backup directories..."
sudo mkdir -p /var/www/dongchi
sudo mkdir -p /var/backups/dongchi
sudo chown -R "$USER:$USER" /var/www/dongchi
sudo chown -R "$USER:$USER" /var/backups/dongchi

# 5. Install Automated Nightly Backup Cron Job
echo "Installing automated nightly backup cron (03:00 AM)..."
chmod +x "$(dirname "$0")/backup-cron.sh"
(crontab -l 2>/dev/null | grep -v "backup-cron.sh" ; echo "0 3 * * * $(dirname "$0")/backup-cron.sh >> /var/log/dongchi-backup.log 2>&1") | crontab -

echo "=================================================="
echo " DongChi Server Provisioning Completed!           "
echo " Next Steps:                                     "
echo " 1. Copy project files to /var/www/dongchi       "
echo " 2. Configure Nginx: sudo cp deploy/nginx-dongchi.conf /etc/nginx/sites-available/dongchi "
echo " 3. Enable site: sudo ln -s /etc/nginx/sites-available/dongchi /etc/nginx/sites-enabled/ "
echo " 4. Run SSL: sudo certbot --nginx -d yourdomain.ir "
echo " 5. Start stack: docker compose -f docker-compose.prod.yml up -d --build "
echo "=================================================="
