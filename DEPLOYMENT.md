# Deploying Sarkardada Public Account Platform to AWS EC2

This guide outlines how to host the Next.js application on a fresh AWS EC2 Ubuntu (`t3.small`) instance.

---

## Step 1: Connect to Your EC2 Instance

Open your local terminal and connect via SSH:

```bash
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip
```

---

## Step 2: System Update & Setup Node.js (NVM)

Run the following commands on your EC2 instance to install Node.js (v18 or v20):

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install Git and build dependencies
sudo apt install git build-essential curl -y

# Install Node Version Manager (NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load NVM (or restart your terminal session)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js v20 (LTS)
nvm install 20
nvm use 20
nvm alias default 20

# Verify Node and NPM installation
node -v
npm -v
```

---

## Step 3: Clone/Upload Code & Setup Environment

If your project is in a Git repository, clone it. Otherwise, upload it from your local machine (excluding `node_modules` and `.next`) using `rsync` or `scp`.

### Option A: Uploading from Local Machine (Run this on your local machine)
```bash
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' -e "ssh -i /path/to/your-key.pem" ./ ubuntu@your-ec2-public-ip:~/sarkardada-platform
```

### Option B: Clone from Git (Run this on EC2)
```bash
git clone <your-repo-url> ~/sarkardada-platform
cd ~/sarkardada-platform
```

### Setup Environment variables (Run this on EC2)
Create the `.env.local` file:
```bash
nano ~/sarkardada-platform/.env.local
```
Paste the following configurations:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://jnahyrcjzuewyujdhdix.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuYWh5cmNqenVld3l1amRoZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTQ5MDUsImV4cCI6MjA5NDgzMDkwNX0.7oNVS93GlKZTLwlxbIQwV1LWzzzR4OKT0uIp_acEgLY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuYWh5cmNqenVld3l1amRoZGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTQ5MDUsImV4cCI6MjA5NDgzMDkwNX0.7oNVS93GlKZTLwlxbIQwV1LWzzzR4OKT0uIp_acEgLY

# Storage / S3 Settings
S3_ACCESS_KEY_ID=c61036e9a8c7ea08534db9a1c6f03b22
S3_SECRET_ACCESS_KEY=1a8001e67e84d36e526b7bab8d2c7598e5bce387cca16d8493999e4b6f7a2f59
```
*Press `Ctrl+O` then `Enter` to save, and `Ctrl+X` to exit.*

---

## Step 4: Install Dependencies & Build

```bash
cd ~/sarkardada-platform

# Install dependencies
npm install

# Build Next.js production build
npm run build
```

---

## Step 5: Process Management (PM2)

To run the Next.js server in the background and ensure it restarts on crash or system reboot:

```bash
# Install PM2 globally
npm install pm2 -g

# Start Next.js with PM2 (using the port 3050 specified in package.json)
pm2 start npm --name "sarkardada" -- run start

# Enable PM2 to startup on boot
pm2 startup
# (Run the command PM2 prints on your screen to complete startup registration)

# Save the process list
pm2 save
```

---

## Step 6: Configure Reverse Proxy (Nginx)

To point standard HTTP (Port 80) request traffic to your Next.js application running on port 3050:

```bash
# Install Nginx
sudo apt install nginx -y

# Configure Nginx configuration file
sudo nano /etc/nginx/sites-available/sarkardada
```

Paste the following server block config:
```nginx
server {
    listen 80;
    server_name _; # Or replace with your domain name (e.g. example.com)

    location / {
        proxy_pass http://localhost:3050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
*Save and close nano (`Ctrl+O`, `Enter`, `Ctrl+X`).*

Enable the site configuration and restart Nginx:
```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Enable new configuration
sudo ln -s /etc/nginx/sites-available/sarkardada /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 7: Configure AWS Security Group (Important)

In your AWS EC2 Console, ensure that the **Security Group** associated with your instance has inbound rules allowing:
* **HTTP (Port 80)** from anywhere (`0.0.0.0/0`)
* **SSH (Port 22)** from your IP address
