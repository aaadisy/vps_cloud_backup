#!/bin/bash
# ID-TRAUM VPS DEPLOYMENT SCRIPT (ALMALINUX)

# 1. System Updates & Essentials
echo "--- Enabling EPEL Repo & Updating System ---"
dnf install epel-release -y
dnf update -y
dnf install -y git curl nginx certbot python3-certbot-nginx

# 2. MariaDB (MySQL) Setup
echo "--- Installing MariaDB ---"
dnf install -y mariadb-server
systemctl start mariadb
systemctl enable mariadb
# Create Database
mysql -e "CREATE DATABASE IF NOT EXISTS vps_cloud_backup;"
echo "Database Created: vps_cloud_backup"

# 3. Node.js (v20)
echo "--- Installing Node.js ---"
curl -sL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs
npm install -g pm2

# 4. Folder Setup
mkdir -p /var/www/vps_cloud_backup
chown -R root:root /var/www/vps_cloud_backup

# 5. Nginx Config for backup.modulesfarm.com
echo "--- Configuring Nginx ---"
cat <<EOF > /etc/nginx/conf.d/vps_backup.conf
server {
    listen 80;
    server_name backup.modulesfarm.com;

    location / {
        root /var/www/vps_cloud_backup/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# firewall ports
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

systemctl restart nginx
systemctl enable nginx

echo "--- Setup Completed ---"
echo "Instructions:"
echo "1. Clone your git repo to /var/www/vps_cloud_backup"
echo "2. Create .env in /var/www/vps_cloud_backup/backend"
echo "3. Run 'certbot --nginx -d backup.modulesfarm.com' for SSL."
