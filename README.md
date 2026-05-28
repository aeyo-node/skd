# Sarkardada Public Accountability Platform

Sarkardada is a modern Next.js public accountability and governance tracking platform. It leverages AI (Google Gemini via SKD AI Agent) to rate, review, and evaluate the performance of public officials across various regional tiers and departments.

## Tech Stack
- **Frontend Framework**: Next.js (App Router)
- **Styling**: CSS (Custom Glassmorphic UI)
- **Database**: Supabase (PostgreSQL)
- **AI Agent Engine**: Google Gemini (via `@google/genai`)
- **Icons**: Lucide React
- **Charts**: Recharts

---

## 🚀 Deployment Guide (AWS EC2 / Google Cloud Ubuntu)

This guide provides step-by-step instructions to deploy the Sarkardada platform on a fresh Ubuntu server (e.g., AWS EC2, Google Cloud Compute Engine, or DigitalOcean Droplet).

### 1. Initial Server Setup
SSH into your Ubuntu instance and update the package lists:
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js & npm
The application requires Node.js (v18 or higher recommended). We'll install it using NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
Verify the installation:
```bash
node -v
npm -v
```

### 3. Install Git & PM2
Install Git to clone the repository, and PM2 to keep the Next.js application running in the background:
```bash
sudo apt install -y git
sudo npm install -g pm2
```

### 4. Clone the Repository
Clone the project into your desired directory (e.g., `~/app`):
```bash
git clone <YOUR_GITHUB_REPO_URL> sarkardada
cd sarkardada
```

### 5. Install Dependencies
Install all required npm packages:
```bash
npm install
```

### 6. Environment Variables Setup
Create a `.env.local` file in the root of the project:
```bash
nano .env.local
```

Paste the following template and fill in your actual production keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Storage / S3 Settings (Optional/If used for image uploads)
S3_ACCESS_KEY_ID=your-s3-access-key
S3_SECRET_ACCESS_KEY=your-s3-secret-key

# AI Agent Settings
GEMINI_API_KEY=your-gemini-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
```
Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

### 7. Build the Application
Create the optimized production build of the Next.js application:
```bash
npm run build
```

### 8. Start the Application with PM2
Use PM2 to start the application so it runs continuously in the background and restarts automatically if it crashes:
```bash
pm2 start npm --name "sarkardada-web" -- start
```

Configure PM2 to automatically start the app when the server reboots:
```bash
pm2 startup
# Run the command outputted by the line above, then run:
pm2 save
```

### 9. Setup Nginx as a Reverse Proxy (Optional but Recommended)
By default, the Next.js app runs on port `3000`. To serve the app on port `80` (HTTP) or `443` (HTTPS), install Nginx:
```bash
sudo apt install -y nginx
```

Create a new Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/sarkardada
```

Add the following configuration (replace `yourdomain.com` with your domain or public IP):
```server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/sarkardada /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Your Sarkardada platform is now live! 🚀

---

## 🛠️ Local Development
To run the project locally on your machine:
1. Clone the repository.
2. Run `npm install`.
3. Create a `.env.local` file with your keys.
4. Run `npm run dev`.
5. Open `http://localhost:3000` in your browser.
