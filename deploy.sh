#!/bin/bash
# =========================================================================
# Sarkardada Public Account Platform EC2 Autodeploy Script
# Target OS: Ubuntu 20.04 / 22.04 LTS (t3.small recommended)
# =========================================================================

set -e

echo "=== 1. Updating System Packages ==="
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y git build-essential curl nginx

echo "=== 2. Installing Node.js via NVM ==="
if [ ! -d "$HOME/.nvm" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 20
nvm use 20
nvm alias default 20

echo "=== 3. Installing PM2 Process Manager ==="
npm install pm2 -g

echo "=== 4. Setting up Next.js Application ==="
cd "$HOME/sarkardada-platform"

# Install production dependencies
npm install

# Build Next.js project
npm run build

echo "=== 5. Launching Server via PM2 ==="
# Check if application is already running in PM2, if so reload, otherwise start
if pm2 list | grep -q "sarkardada"; then
  pm2 reload "sarkardada"
else
  pm2 start npm --name "sarkardada" -- run start
fi

# Save PM2 process list
pm2 save

echo "=== 6. Configuring Nginx Reverse Proxy ==="
cat << 'EOF' | sudo tee /etc/nginx/sites-available/sarkardada
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the website in Nginx
sudo rm -f /etc/nginx/sites-enabled/default
if [ ! -f /etc/nginx/sites-enabled/sarkardada ]; then
  sudo ln -s /etc/nginx/sites-available/sarkardada /etc/nginx/sites-enabled/
fi

# Restart Nginx
sudo nginx -t
sudo systemctl restart nginx

echo "=== 7. Configuring Firewall (UFW) ==="
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "=========================================================="
echo " Deployment Complete!"
echo " The application is serving at http://$(curl -s ifconfig.me)"
echo "=========================================================="
