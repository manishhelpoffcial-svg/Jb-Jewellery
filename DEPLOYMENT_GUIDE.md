# JB Jewellery Collection — Production Deployment Guide

> A complete, senior-engineer-level handbook for deploying this project to production.
> Tailored exactly to this codebase: Vite + React frontend, Express API backend, Supabase database, Cloudflare CDN.

---

## PART 0 — ARCHITECTURE OVERVIEW

### The Final Architecture

```
User Browser
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (CDN + DNS + SSL)          │
│   Proxies all traffic, caches assets, terminates TLS     │
└────────────────┬────────────────────────┬────────────────┘
                 │                        │
         www.domain.com            api.domain.com
                 │                        │
                 ▼                        ▼
        ┌──────────────┐        ┌──────────────────┐
        │    VERCEL    │        │   VPS (Ubuntu)   │
        │              │        │                  │
        │  Vite+React  │  HTTP  │  Nginx → PM2 →  │
        │  (Frontend)  │◄──────►│  Express API     │
        └──────────────┘        └────────┬─────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │    SUPABASE      │
                                │  PostgreSQL DB   │
                                │  Auth + Storage  │
                                └──────────────────┘
```

### How Each Piece Connects

**Frontend ↔ Backend**
The Vite+React app (hosted on Vercel) makes HTTP requests to `https://api.yourdomain.com/api/*`. This is controlled by the `VITE_API_URL` environment variable set in Vercel. Every API call from the browser hits Cloudflare first, which proxies it to your VPS, where Nginx receives it and forwards to the Express server on port 3000.

**Vercel → Backend**
Vercel is just a static host for the compiled HTML/CSS/JS bundle. It does not call your backend server-to-server. The user's browser is what calls the API — Vercel's role ends once it serves the frontend files.

**Backend → Supabase**
The Express API on your VPS connects to Supabase using two channels:
1. A direct PostgreSQL connection string (`DATABASE_URL`) for Drizzle ORM queries
2. The Supabase Admin SDK (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) for auth and storage operations

This connection happens server-to-server (VPS → Supabase cloud), never exposed to the browser.

**Cloudflare in Front of Everything**
Cloudflare sits between users and both Vercel and your VPS. It:
- Terminates SSL/TLS (handles HTTPS)
- Caches static assets at the edge globally
- Protects against DDoS and bots
- Routes `www.domain.com` → Vercel and `api.domain.com` → your VPS

**Domain + Subdomain Structure**
```
www.yourdomain.com    → Vercel (React frontend)
api.yourdomain.com    → VPS (Express API, proxied through Nginx)
yourdomain.com        → Redirect to www (configured in Cloudflare)
```

### Why This Architecture Is Ideal for a Startup

| Concern | Solution | Why |
|---|---|---|
| Cost | Vercel free tier + cheap VPS | Frontend hosting is free on Vercel for hobby/startup usage |
| Performance | Cloudflare CDN | Static assets served from 300+ edge locations globally |
| Reliability | PM2 auto-restart | If the Express process crashes, PM2 brings it back in seconds |
| Scalability | Separation of concerns | You can upgrade VPS RAM/CPU independently; switch to managed infra later without rewriting anything |
| Simplicity | No Docker, no Kubernetes | Direct Node.js process on the VPS; easy to debug and maintain |
| Security | Cloudflare WAF + Nginx + Supabase RLS | Layered security without ops complexity |

---

## PART 1 — SUPABASE SETUP

### Step 1.1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose your organization
3. Fill in:
   - **Name**: `jb-jewellery-production`
   - **Database Password**: Generate a strong password (save it — you'll need it)
   - **Region**: Choose the region closest to your VPS (e.g. Southeast Asia, Europe)
   - **Pricing Plan**: Free tier is fine to start (500MB DB, 50k auth users)
4. Wait ~2 minutes for provisioning

### Step 1.2 — Get Your Connection Strings

Once the project is ready:

**Go to: Settings → Database → Connection String**

You need two formats:

**Format 1 — Direct connection** (used by Drizzle ORM for migrations and queries):
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```
This goes into `DATABASE_URL`.

**Format 2 — Pooled connection** (recommended for production API traffic — uses PgBouncer):
```
postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```
Use this as `DATABASE_URL` in production. It handles connection pooling, which is critical on a 1 GB VPS where you don't want 50 idle Postgres connections eating RAM.

**Go to: Settings → API**

Copy these three values:
```
Project URL:        https://[YOUR-PROJECT-REF].supabase.co   → SUPABASE_URL
Anon/Public key:    eyJ...                                   → VITE_SUPABASE_ANON_KEY
Service role key:   eyJ...                                   → SUPABASE_SERVICE_ROLE_KEY  ⚠️ NEVER expose this
```

### Step 1.3 — Run Database Migrations

Your project has SQL migration files already. Run them in the Supabase SQL editor:

**Go to: SQL Editor → New Query**

Paste and run in this order:
```sql
-- 1. First run the schema migration
-- Content of: artifacts/jb-jewellery/supabase-migration.sql

-- 2. Then run the categories migration
-- Content of: artifacts/jb-jewellery/supabase-migration-categories.sql
```

Alternatively, after your VPS is set up, you can push schema via Drizzle:
```bash
# From the project root on VPS
DATABASE_URL="your-connection-string" pnpm --filter @workspace/db run push
```

### Step 1.4 — Security Basics

In the Supabase dashboard:

1. **Enable Row Level Security (RLS)** on all tables — this is critical. Users should only access their own data.
   ```sql
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
   ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
   -- Add policies for each table
   ```

2. **Restrict allowed origins for Auth** — Go to: Authentication → URL Configuration:
   - Site URL: `https://www.yourdomain.com`
   - Redirect URLs: `https://www.yourdomain.com/**`

3. **Disable email confirmations** (optional for fast onboarding) — Go to: Authentication → Providers → Email → Disable "Confirm email"

### Step 1.5 — Backups

**Free tier**: Supabase does NOT include automated backups on the free plan. Do this manually:

```bash
# From your VPS or local machine (install pg_dump first)
pg_dump "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" \
  --no-owner --no-acl -f backup_$(date +%Y%m%d).sql

# Automate with cron (weekly backup, keep last 4)
crontab -e
# Add: 0 2 * * 0 pg_dump "YOUR_CONNECTION_STRING" -f /backups/jb_$(date +\%Y\%m\%d).sql
```

On the Pro plan ($25/month), Supabase includes daily automated backups with 7-day retention.

---

## PART 2 — FRONTEND DEPLOYMENT TO VERCEL

### Step 2.1 — Push Your Code to GitHub

Your project must be on GitHub. If it isn't already:
```bash
git init
git remote add origin https://github.com/yourusername/jb-jewellery.git
git add .
git commit -m "Initial production commit"
git push -u origin main
```

### Step 2.2 — Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. On the configuration screen, set these **exact settings**:

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `artifacts/jb-jewellery` |
| **Build Command** | `npm install -g pnpm && pnpm install --no-frozen-lockfile && pnpm run build` |
| **Output Directory** | `dist` |
| **Install Command** | *(leave empty — handled in build command)* |

> **Why Root Directory matters**: Your repo is a monorepo. Vercel must be pointed at `artifacts/jb-jewellery`, not the repo root, or it will try to build everything and fail.

### Step 2.3 — Set Environment Variables in Vercel

Go to: Project → Settings → Environment Variables

Add all of these for the **Production** environment:

```
VITE_API_URL                      = https://api.yourdomain.com
VITE_SUPABASE_URL                 = https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY            = eyJ... (your anon/public key)
VITE_FIREBASE_API_KEY             = (your Firebase API key, if using Firebase Auth)
VITE_FIREBASE_AUTH_DOMAIN         = your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID          = your-project-id
VITE_FIREBASE_STORAGE_BUCKET      = your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = 123456789
VITE_FIREBASE_APP_ID              = 1:123456789:web:abc123
```

> **Note**: Variables starting with `VITE_` are embedded into the JavaScript bundle at build time. They are visible to anyone who inspects the browser source. Never put secret keys in `VITE_` variables. The anon key is safe — it is meant to be public. The service role key is NOT safe and must never be in `VITE_` variables.

### Step 2.4 — Connect Custom Domain

1. In Vercel: Project → Settings → Domains
2. Add `www.yourdomain.com`
3. Vercel will give you a DNS record to add — you'll do this in Cloudflare (Step 6)
4. Also add `yourdomain.com` and set it to redirect to `www.yourdomain.com`

### Step 2.5 — Automatic Deployments

Once connected to GitHub, every push to the `main` branch automatically triggers a new Vercel build and deployment. Zero manual steps needed for frontend updates. Pull request previews are also created automatically — great for testing before merging.

---

## PART 3 — VPS PREPARATION

### Step 3.1 — First Login and System Update

SSH into your VPS as root:
```bash
ssh root@YOUR_VPS_IP
```

Update everything first:
```bash
apt update && apt upgrade -y
apt install -y curl git unzip ufw build-essential
```

### Step 3.2 — Create a Deployment User

Never run your app as root. Create a dedicated user:
```bash
adduser deploy
usermod -aG sudo deploy

# Copy your SSH key to the new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Switch to deploy user for all remaining steps
su - deploy
```

### Step 3.3 — Install Node.js LTS

Use the official NodeSource repository for LTS:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # should show v22.x.x
npm --version
```

### Step 3.4 — Install pnpm

Your project uses pnpm as the package manager:
```bash
npm install -g pnpm
pnpm --version   # should show 10.x.x
```

### Step 3.5 — Clone the Repository

```bash
mkdir -p /home/deploy/apps
cd /home/deploy/apps
git clone https://github.com/yourusername/jb-jewellery.git
cd jb-jewellery
```

### Step 3.6 — Install Dependencies

```bash
# Install all workspace dependencies
pnpm install --frozen-lockfile
```

> **Why `--frozen-lockfile`**: In production, you want exactly the package versions from your lockfile. This prevents surprise version changes during deployment.

### Step 3.7 — Create the Backend .env File

```bash
nano artifacts/api-server/.env
```

Paste your environment variables (see Part 8 for the full template). Save with `Ctrl+X → Y → Enter`.

### Step 3.8 — Build the Backend

```bash
cd /home/deploy/apps/jb-jewellery
pnpm --filter @workspace/api-server run build
```

This runs `node ./build.mjs` inside `artifacts/api-server/` and produces `artifacts/api-server/dist/index.mjs`.

### Step 3.9 — Test the Backend Manually

Before setting up PM2, verify it starts:
```bash
cd /home/deploy/apps/jb-jewellery/artifacts/api-server
PORT=3000 NODE_ENV=production node --enable-source-maps ./dist/index.mjs
```

You should see:
```
{"level":"info","port":3000,"msg":"Server listening"}
```

Hit `Ctrl+C` to stop — PM2 will manage it going forward.

---

## PART 4 — PM2 SETUP

PM2 is a production process manager for Node.js. It keeps your app running, restarts it on crashes, and handles startup on server reboot.

### Step 4.1 — Install PM2

```bash
npm install -g pm2
pm2 --version
```

### Step 4.2 — Create PM2 Ecosystem Config

Create a config file at the project root:
```bash
nano /home/deploy/apps/jb-jewellery/ecosystem.config.cjs
```

```javascript
module.exports = {
  apps: [
    {
      name: "jb-api",
      script: "./artifacts/api-server/dist/index.mjs",
      cwd: "/home/deploy/apps/jb-jewellery",
      interpreter: "node",
      interpreter_args: "--enable-source-maps",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_file: "./artifacts/api-server/.env",
      max_memory_restart: "400M",
      restart_delay: 3000,
      max_restarts: 10,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/home/deploy/logs/jb-api-error.log",
      out_file: "/home/deploy/logs/jb-api-out.log",
      merge_logs: true,
    },
  ],
};
```

Create the log directory:
```bash
mkdir -p /home/deploy/logs
```

### Step 4.3 — Start the App with PM2

```bash
cd /home/deploy/apps/jb-jewellery
pm2 start ecosystem.config.cjs
pm2 status
```

### Step 4.4 — Enable Auto-Start on Reboot

```bash
pm2 startup
# PM2 will print a command — copy and run it. It looks like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy

pm2 save  # Saves current process list to resurrect on reboot
```

### Step 4.5 — PM2 Management Commands

```bash
# Status overview
pm2 status
pm2 list

# Real-time monitoring (CPU + RAM)
pm2 monit

# Logs
pm2 logs jb-api              # stream live logs
pm2 logs jb-api --lines 200  # last 200 lines
pm2 logs jb-api --err        # error log only

# Restart (zero-downtime reload)
pm2 reload jb-api

# Hard restart (kills and restarts)
pm2 restart jb-api

# Stop and remove
pm2 stop jb-api
pm2 delete jb-api
```

> **Why `max_memory_restart: "400M"`**: On a 1 GB VPS, you need to prevent runaway memory leaks from killing the whole server. If the process exceeds 400 MB, PM2 restarts it. This is your safety net.

---

## PART 5 — NGINX REVERSE PROXY

Nginx sits in front of your Express server. It handles incoming HTTP traffic on port 80/443 and forwards it to your Node.js process on port 3000. This is the right way — you should never expose a Node.js port directly to the internet.

### Step 5.1 — Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 5.2 — Create the API Subdomain Config

```bash
sudo nano /etc/nginx/sites-available/api.yourdomain.com
```

Paste this complete config (replace `yourdomain.com` with your actual domain):

```nginx
# Upstream Node.js process
upstream jb_api {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;

    # Let Certbot handle HTTPS redirect after SSL setup
    # For now, proxy directly (Cloudflare handles HTTPS externally)

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Hide Nginx version
    server_tokens off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        application/json
        application/javascript
        text/plain
        text/css
        text/xml;

    # Request body limit (match Express: 12mb)
    client_max_body_size 12M;

    # API proxy
    location /api/ {
        proxy_pass http://jb_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Don't buffer responses (important for streaming/SSE)
        proxy_buffering off;
    }

    # Health check endpoint
    location /api/healthz {
        proxy_pass http://jb_api;
        access_log off;
    }

    # Block hidden files
    location ~ /\. {
        deny all;
        return 404;
    }
}
```

### Step 5.3 — Enable the Config

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com \
           /etc/nginx/sites-enabled/api.yourdomain.com

# Remove the default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test the config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 5.4 — Verify It Works

```bash
# Test locally on the VPS
curl http://localhost/api/healthz
# Expected: {"status":"ok"}
```

---

## PART 6 — DOMAIN + CLOUDFLARE SETUP

### Step 6.1 — Add Your Domain to Cloudflare

1. Go to [cloudflare.com](https://cloudflare.com) → **Add a Site**
2. Enter your domain → Select **Free plan**
3. Cloudflare scans existing DNS records — review them

### Step 6.2 — Update Nameservers at Your Registrar

Cloudflare will give you two nameservers like:
```
alice.ns.cloudflare.com
bob.ns.cloudflare.com
```

Go to your domain registrar (Namecheap, GoDaddy, etc.) and replace the existing nameservers with these. Changes propagate in 0–24 hours.

### Step 6.3 — Add DNS Records in Cloudflare

Go to: DNS → Records → Add Record

| Type | Name | Value | Proxy | TTL |
|---|---|---|---|---|
| A | `@` | YOUR_VPS_IP | Proxied (orange cloud) | Auto |
| A | `www` | YOUR_VPS_IP | Proxied (orange cloud) | Auto |
| A | `api` | YOUR_VPS_IP | Proxied (orange cloud) | Auto |
| CNAME | `www` | `yourdomain.com` | Proxied | Auto |

> **Wait** — `www` should actually point to Vercel, not your VPS IP. After adding the domain in Vercel (Step 2.4), Vercel gives you a CNAME target:

| Type | Name | Value | Proxy | TTL |
|---|---|---|---|---|
| CNAME | `www` | `cname.vercel-dns.com` | Proxied (orange cloud) | Auto |
| A | `api` | YOUR_VPS_IP | Proxied (orange cloud) | Auto |
| CNAME | `@` | `www.yourdomain.com` (redirect) | Proxied | Auto |

### Step 6.4 — SSL/TLS Mode

Go to: SSL/TLS → Overview → Set mode to **Full (Strict)**

> **Why Full (Strict)**: "Flexible" only encrypts browser→Cloudflare, leaving Cloudflare→VPS unencrypted. "Full (Strict)" encrypts the entire chain. You need a valid SSL cert on your VPS (Step 7) for this to work.

### Step 6.5 — Cache Settings

Go to: Rules → Cache Rules — Create a rule:

- **Cache everything** for `www.yourdomain.com/*` with browser TTL of 1 hour
- **Bypass cache** for `api.yourdomain.com/*` (API responses should not be cached)

Go to: Speed → Optimization:
- Enable **Auto Minify** (JavaScript, CSS, HTML)
- Enable **Brotli** compression

### Step 6.6 — Security Settings

Go to: Security → Settings:
- **Security Level**: Medium (blocks known bad IPs)
- **Bot Fight Mode**: On (free bot protection)

Go to: SSL/TLS → Edge Certificates:
- Enable **Always Use HTTPS**
- Enable **HTTP Strict Transport Security (HSTS)** — after confirming HTTPS works
- Set **Minimum TLS Version** to TLS 1.2

---

## PART 7 — HTTPS / SSL SETUP

Even with Cloudflare handling HTTPS externally, you need a valid certificate on your VPS for Cloudflare Full (Strict) mode to work.

### Step 7.1 — Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 7.2 — Temporarily Allow Direct Traffic

Certbot needs to reach your server directly. Temporarily set the `api` DNS record in Cloudflare to **DNS Only** (grey cloud, not orange) so traffic bypasses Cloudflare during certificate issuance.

### Step 7.3 — Generate the SSL Certificate

```bash
sudo certbot --nginx -d api.yourdomain.com
```

Certbot will:
1. Verify domain ownership
2. Generate certificates in `/etc/letsencrypt/live/api.yourdomain.com/`
3. Automatically update your Nginx config to use HTTPS and redirect HTTP

### Step 7.4 — Re-enable Cloudflare Proxy

After Certbot succeeds, go back to Cloudflare DNS and set `api` back to **Proxied** (orange cloud).

### Step 7.5 — Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

Certbot installs a systemd timer automatically. Certificates auto-renew every 90 days. Verify the timer is active:

```bash
sudo systemctl status certbot.timer
```

If you need to force renewal manually:
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

---

## PART 8 — ENVIRONMENT VARIABLES

### Frontend .env (used at build time by Vercel)

These are set in the Vercel dashboard, not in a file. For local development, create `artifacts/jb-jewellery/.env.local`:

```bash
# ─── API ─────────────────────────────────────────────────────────────
# Development:
VITE_API_URL=http://localhost:8080
# Production (set in Vercel dashboard):
# VITE_API_URL=https://api.yourdomain.com

# ─── SUPABASE (public — safe to expose) ──────────────────────────────
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ─── FIREBASE (public — safe to expose) ──────────────────────────────
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

### Backend .env (on VPS — NEVER commit this file)

Location: `/home/deploy/apps/jb-jewellery/artifacts/api-server/.env`

```bash
# ─── SERVER ──────────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# ─── PUBLIC BASE URL ─────────────────────────────────────────────────
PUBLIC_BASE_URL=https://www.yourdomain.com

# ─── DATABASE ────────────────────────────────────────────────────────
# Use pooled connection string from Supabase (recommended for production)
DATABASE_URL=postgresql://postgres.YOUR-REF:YOUR-PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true

# ─── SUPABASE (PRIVATE — server-side only) ───────────────────────────
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ─── EMAIL (ZOHO) ────────────────────────────────────────────────────
ZOHO_EMAIL=hello@yourdomain.com
ZOHO_APP_PASSWORD=your-zoho-app-password

# ─── JWT (generate a long random string) ─────────────────────────────
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=a1b2c3d4e5f6...your-64-char-hex-secret...
```

### Which Variables Are Public vs. Private

| Variable | Visibility | Reason |
|---|---|---|
| `VITE_SUPABASE_URL` | Public (browser) | Supabase URL is not secret |
| `VITE_SUPABASE_ANON_KEY` | Public (browser) | Designed to be public — protected by RLS |
| `VITE_FIREBASE_API_KEY` | Public (browser) | Firebase API key is not secret — protected by Firebase rules |
| `VITE_API_URL` | Public (browser) | It's just a URL, not a secret |
| `SUPABASE_SERVICE_ROLE_KEY` | **PRIVATE** | Bypasses ALL RLS — full database access |
| `DATABASE_URL` | **PRIVATE** | Contains DB password — direct DB access |
| `JWT_SECRET` | **PRIVATE** | Used to sign auth tokens |
| `ZOHO_APP_PASSWORD` | **PRIVATE** | Email account password |

**Rules:**
- Any variable in `artifacts/api-server/.env` must never be in a `VITE_` variable or committed to GitHub
- Add `.env` and `.env.local` to `.gitignore` — verify this before pushing

---

## PART 9 — SECURITY HARDENING

### Step 9.1 — Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (before enabling — critical!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS (Nginx)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Do NOT open port 3000 — only Nginx needs access, not the internet
# The Express server should only be reachable via localhost

sudo ufw enable
sudo ufw status verbose
```

### Step 9.2 — Fail2Ban (Brute Force Protection)

```bash
sudo apt install -y fail2ban

sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

Update these values:
```ini
[DEFAULT]
bantime  = 3600       # 1 hour ban
findtime = 600        # 10 minute window
maxretry = 5          # 5 failures = ban

[sshd]
enabled = true
port    = 22
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status sshd
```

### Step 9.3 — SSH Security

```bash
sudo nano /etc/ssh/sshd_config
```

Set these values:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 20
```

```bash
sudo systemctl restart sshd
```

> **Before restarting sshd**: Make sure your SSH key is copied to the `deploy` user and you can log in as `deploy`. Disabling password auth and root login with no key = locked out of your server.

### Step 9.4 — CORS Hardening

Your current Express app uses `cors()` with no restrictions. In production, lock it down:

```typescript
// In artifacts/api-server/src/app.ts
import cors from "cors";

app.use(cors({
  origin: [
    "https://www.yourdomain.com",
    "https://yourdomain.com",
    // Development:
    ...(process.env.NODE_ENV === "development" ? ["http://localhost:5173"] : []),
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
```

### Step 9.5 — Add Helmet and Rate Limiting

Install security packages:
```bash
cd /home/deploy/apps/jb-jewellery
pnpm --filter @workspace/api-server add helmet express-rate-limit
```

Add to `artifacts/api-server/src/app.ts`:
```typescript
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Vercel handles CSP for frontend
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Stricter limit for auth endpoints — 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many auth attempts, please try again later." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
```

### Step 9.6 — Protect the .env File

```bash
# Restrict .env to read-only by the deploy user only
chmod 600 /home/deploy/apps/jb-jewellery/artifacts/api-server/.env

# Make sure .env is in .gitignore
echo "artifacts/api-server/.env" >> .gitignore
echo "artifacts/jb-jewellery/.env.local" >> .gitignore
git add .gitignore
git commit -m "Ensure .env files are gitignored"
```

---

## PART 10 — PERFORMANCE OPTIMIZATION

### Step 10.1 — Add Swap Memory

Your VPS has 1 GB RAM. pnpm install and builds can spike RAM usage. Add 2 GB of swap as a safety net:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Reduce swap aggressiveness (only use swap when RAM is 90%+ full)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Verify
free -h
```

### Step 10.2 — PM2 Memory Management

Already configured in your `ecosystem.config.cjs`:
- `max_memory_restart: "400M"` — PM2 restarts if the process exceeds 400 MB
- `instances: 1` — Single process on 1 vCPU (cluster mode would fight for the same core anyway)

### Step 10.3 — Why Vercel Handles the Frontend

This is the most important RAM optimization. Serving static files from Node.js is wasteful — file reads, HTTP handling, and memory usage for something a CDN does better and for free. By deploying the frontend to Vercel:

- **0 RAM used on your VPS** for serving HTML/CSS/JS
- **Global CDN** caches assets at 300+ edge locations
- **Your VPS RAM** is 100% dedicated to API processing

The result: your 1 GB VPS can handle significantly more concurrent API requests than if it were also serving the frontend.

### Step 10.4 — Node.js Memory Limit

Tell Node.js to limit its heap (prevents it from using all 1 GB):
```bash
# In ecosystem.config.cjs, update interpreter_args:
interpreter_args: "--enable-source-maps --max-old-space-size=512",
```

This caps Node.js heap at 512 MB, leaving ~400 MB for the OS, Nginx, and other processes.

### Step 10.5 — Nginx Gzip (Already Configured)

The Nginx config in Part 5 already includes gzip for JSON responses. API responses are typically text/JSON and compress 60–80%, reducing bandwidth and response time.

### Step 10.6 — Frontend Performance

These are already built into the Vite config:
- **Code splitting**: Vite automatically splits vendor chunks
- **Tree shaking**: Unused code is removed at build time
- **Asset hashing**: `main.abc123.js` — enables aggressive browser caching
- **Image lazy loading**: Use `loading="lazy"` on images below the fold

Cloudflare also handles:
- **Brotli compression** (better than gzip for text)
- **HTTP/2** for parallel asset loading
- **Image resizing** (available on Pro plan)

---

## PART 11 — DEPLOYMENT WORKFLOW

### Frontend Changes — GitHub → Vercel (Automatic)

1. Make changes in `artifacts/jb-jewellery/`
2. Commit and push to `main`:
   ```bash
   git add artifacts/jb-jewellery/
   git commit -m "feat: update product carousel"
   git push origin main
   ```
3. Vercel detects the push, triggers a build automatically
4. Build takes ~60–90 seconds
5. New version is live at `www.yourdomain.com` with zero downtime

To check build status: Vercel dashboard → Deployments tab

### Backend Changes — Manual Deploy to VPS

SSH into your VPS and run:

```bash
cd /home/deploy/apps/jb-jewellery

# 1. Pull latest code
git pull origin main

# 2. Install any new dependencies
pnpm install --frozen-lockfile

# 3. Rebuild the backend
pnpm --filter @workspace/api-server run build

# 4. Zero-downtime reload (PM2 keeps app alive during reload)
pm2 reload jb-api

# 5. Verify it's running
pm2 status
curl http://localhost:3000/api/healthz
```

### One-Command Deploy Script

Create a deploy script on your VPS for convenience:

```bash
nano /home/deploy/deploy-backend.sh
```

```bash
#!/bin/bash
set -e

echo "=== Starting backend deployment ==="

cd /home/deploy/apps/jb-jewellery

echo "--- Pulling latest code..."
git pull origin main

echo "--- Installing dependencies..."
pnpm install --frozen-lockfile

echo "--- Building backend..."
pnpm --filter @workspace/api-server run build

echo "--- Reloading PM2..."
pm2 reload jb-api

echo "--- Verifying health..."
sleep 2
curl -s http://localhost:3000/api/healthz

echo "=== Backend deployment complete ==="
```

```bash
chmod +x /home/deploy/deploy-backend.sh
# Run with:
./deploy-backend.sh
```

---

## PART 12 — MONITORING + MAINTENANCE

### Checking Server Health

```bash
# System overview
htop                     # Interactive process viewer (install: sudo apt install htop)
free -h                  # RAM and swap usage
df -h                    # Disk usage
uptime                   # Load average

# Network
ss -tlnp                 # Listening ports
netstat -an | grep 3000  # Check if API port is listening

# Nginx
sudo systemctl status nginx
sudo nginx -t             # Test config validity

# PM2
pm2 status
pm2 monit                 # Real-time dashboard
```

### Monitoring RAM on 1 GB VPS

```bash
# Quick RAM check
free -h

# Detailed process memory
ps aux --sort=-%mem | head -10

# Watch RAM every 2 seconds
watch -n 2 free -h

# Check if swap is being used heavily (bad sign)
swapon --show
```

If you consistently see swap being used > 500 MB, it's time to upgrade your VPS RAM.

### Checking Logs

```bash
# PM2 application logs
pm2 logs jb-api               # Stream live
pm2 logs jb-api --lines 100   # Last 100 lines
pm2 logs jb-api --err          # Errors only

# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f    # Nginx system journal
sudo journalctl -xe            # Recent system errors
```

### Restarting Services

```bash
# Restart API (zero-downtime)
pm2 reload jb-api

# Restart API (hard — use if reload fails)
pm2 restart jb-api

# Restart Nginx
sudo systemctl reload nginx    # Graceful reload (preferred)
sudo systemctl restart nginx   # Full restart

# If VPS reboots — PM2 and Nginx start automatically (configured in Part 4 and systemctl enable)
```

### Update Strategy

**Monthly:**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check for Node.js LTS updates (only major LTS releases: 18 → 20 → 22)
node --version
```

**Weekly:**
```bash
# Check PM2 logs for recurring errors
pm2 logs jb-api --err --lines 500 | grep -i "error\|exception\|crash"
```

**Every deploy:**
```bash
# After deploying, always verify health
curl https://api.yourdomain.com/api/healthz
pm2 status
```

### Backup Strategy

**Database** (Supabase):
```bash
# Automate weekly SQL dumps
crontab -e

# Add this line (runs every Sunday at 2 AM):
0 2 * * 0 pg_dump "$DATABASE_URL" --no-owner --no-acl -f /home/deploy/backups/jb_$(date +\%Y\%m\%d).sql && find /home/deploy/backups -name "jb_*.sql" -mtime +30 -delete
```

```bash
mkdir -p /home/deploy/backups
```

**Application files** (VPS):
- Your code is in GitHub — that's your backup
- The `.env` file is NOT in GitHub — back it up securely (1Password, Bitwarden, etc.)

---

## PART 13 — FINAL PRODUCTION CHECKLIST

Run through this before announcing your site is live.

### Infrastructure
- [ ] VPS is running Ubuntu, updated to latest packages
- [ ] `deploy` user created, root login disabled
- [ ] SSH key-based auth only (password auth disabled)
- [ ] UFW firewall enabled — only ports 22, 80, 443 open
- [ ] Fail2ban installed and protecting SSH
- [ ] Swap memory (2 GB) configured
- [ ] `/home/deploy/logs/` directory created

### Backend
- [ ] Code cloned from GitHub to `/home/deploy/apps/jb-jewellery`
- [ ] `.env` file created at `artifacts/api-server/.env` with all required vars
- [ ] `pnpm install` completed successfully
- [ ] Backend builds without errors (`pnpm --filter @workspace/api-server run build`)
- [ ] PM2 running (`pm2 status` shows `online`)
- [ ] PM2 startup saved (`pm2 save` + systemd unit installed)
- [ ] `curl http://localhost:3000/api/healthz` returns `{"status":"ok"}`
- [ ] Helmet and rate limiting added to `app.ts`
- [ ] CORS locked to production domain only

### Nginx
- [ ] Nginx installed and enabled
- [ ] Config at `/etc/nginx/sites-available/api.yourdomain.com`
- [ ] `sudo nginx -t` passes
- [ ] `http://YOUR_VPS_IP/api/healthz` responds correctly

### Supabase
- [ ] Supabase project created in the correct region
- [ ] Database migrations run (supabase-migration.sql + supabase-migration-categories.sql)
- [ ] RLS enabled on all user data tables
- [ ] Auth redirect URLs configured for production domain
- [ ] Connection string tested (pooled, not direct)
- [ ] Weekly backup cron job configured

### Cloudflare
- [ ] Domain transferred to Cloudflare nameservers (verified)
- [ ] DNS records added: `www` → Vercel, `api` → VPS IP
- [ ] SSL/TLS mode set to **Full (Strict)**
- [ ] Always Use HTTPS enabled
- [ ] Bot Fight Mode enabled
- [ ] API subdomain cache set to bypass

### SSL
- [ ] Certbot installed
- [ ] Certificate issued for `api.yourdomain.com`
- [ ] `sudo certbot renew --dry-run` succeeds
- [ ] `https://api.yourdomain.com/api/healthz` returns 200 OK

### Frontend (Vercel)
- [ ] GitHub repo connected to Vercel
- [ ] Root directory set to `artifacts/jb-jewellery`
- [ ] Build command and output directory correct
- [ ] All `VITE_` environment variables set in Vercel dashboard
- [ ] `VITE_API_URL` = `https://api.yourdomain.com`
- [ ] Custom domain (`www.yourdomain.com`) connected and verified
- [ ] Deployment completes without build errors
- [ ] Site loads at `https://www.yourdomain.com`

### End-to-End Verification
- [ ] Homepage loads with images and styles
- [ ] Product browsing works
- [ ] Login / signup flow works
- [ ] Cart adds items correctly
- [ ] Checkout process completes
- [ ] Admin panel accessible at `/admin`
- [ ] Site tested on mobile (Chrome + Safari)
- [ ] No console errors in browser DevTools
- [ ] API response time < 500ms on `https://api.yourdomain.com/api/healthz`

---

## APPENDIX — QUICK REFERENCE

### Key File Locations on VPS

```
/home/deploy/apps/jb-jewellery/             ← Project root
├── artifacts/api-server/
│   ├── .env                                ← Backend secrets (never commit)
│   └── dist/index.mjs                      ← Compiled backend
├── ecosystem.config.cjs                    ← PM2 config
└── deploy-backend.sh                       ← Deploy script

/home/deploy/logs/                          ← PM2 logs
/home/deploy/backups/                       ← Database backups

/etc/nginx/sites-available/api.yourdomain.com   ← Nginx config
/etc/letsencrypt/live/api.yourdomain.com/       ← SSL certificates
```

### Essential Commands Cheatsheet

```bash
# Deploy backend update
./deploy-backend.sh

# Check everything is running
pm2 status && sudo systemctl status nginx

# Stream live logs
pm2 logs jb-api

# Restart after .env change
pm2 restart jb-api

# Check RAM
free -h && pm2 monit

# Test API
curl https://api.yourdomain.com/api/healthz

# Nginx test + reload
sudo nginx -t && sudo systemctl reload nginx

# Manual DB backup
pg_dump "$DATABASE_URL" -f /home/deploy/backups/jb_$(date +%Y%m%d).sql
```

---

*Guide generated for JB Jewellery Collection — Vite+React frontend, Express API server, Supabase PostgreSQL, Cloudflare CDN. Architecture optimized for startup scale on a 1 GB VPS.*
