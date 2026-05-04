# JB Jewellery Collection — Vercel Deployment Guide

Deploy the **entire app — frontend + API — to a single Vercel project**. No separate backend host needed.

---

## How It Works

```
Browser
  └─▶ Vercel (your-app.vercel.app)
        ├─▶ /jb-api/*  →  Vercel Serverless Function (Express API)
        └─▶ /*         →  Static React frontend
```

- **Frontend** — React/Vite app (static files, fast CDN delivery)
- **API** — Express app bundled into a single Vercel serverless function at `/api/*`
- **Database** — Supabase (Postgres + Auth + Storage)

---

## Step 1 — Supabase Setup

> Skip if you are keeping your existing Supabase project.

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Once created, go to **Settings → API** and copy:
   - **Project URL**
   - **anon public** key
   - **service_role** key _(keep secret — never expose in frontend code)_
3. **Settings → Database → Connection string → URI** — copy the Postgres URI (needed for `DATABASE_URL`)
4. **Settings → Authentication → Email** → turn off "Confirm email"
5. Open **SQL Editor** → paste and run the full contents of `DATABASE_MIGRATION.sql`
6. Go to **Storage → New Bucket** → create these buckets (all set to **Public**):
   - `invoices`, `products`, `categories`, `review-images`, `site-assets`

---

## Step 2 — Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
3. Select this repository
4. Settings to confirm:
   - **Root Directory**: `/` (leave as repo root — do not set a subdirectory)
   - **Framework Preset**: Other
   - Vercel auto-reads `vercel.json` — do not change build settings
5. Go to **Environment Variables** and add every variable from the table below
6. Click **Deploy** → build takes ~2–3 minutes → site goes live

---

## Environment Variables (copy these into Vercel)

```env
# ── Supabase ────────────────────────────────────────────────────────────────
SUPABASE_URL               = https://glpsidmtigfepgowliia.supabase.co
SUPABASE_ANON_KEY          = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscHNpZG10aWdmZXBnb3dsaWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjUyMjMsImV4cCI6MjA5MjUwMTIyM30.DSPbzbud6h5PxPc0KvrZeb_FbMg4r5gwzY9FhsXbNpE
SUPABASE_SERVICE_ROLE_KEY  = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscHNpZG10aWdmZXBnb3dsaWlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjkyNTIyMywiZXhwIjoyMDkyNTAxMjIzfQ.Xv899oADgZIt9lP9T6y4uC4IlM_khJYnTR27WOnxxO8

VITE_SUPABASE_URL          = https://glpsidmtigfepgowliia.supabase.co
VITE_SUPABASE_ANON_KEY     = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscHNpZG10aWdmZXBnb3dsaWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjUyMjMsImV4cCI6MjA5MjUwMTIyM30.DSPbzbud6h5PxPc0KvrZeb_FbMg4r5gwzY9FhsXbNpE

# Supabase direct Postgres connection (Settings → Database → Connection string → URI)
# Replace [YOUR-DB-PASSWORD] with your Supabase database password
DATABASE_URL               = postgresql://postgres:[YOUR-DB-PASSWORD]@db.glpsidmtigfepgowliia.supabase.co:5432/postgres

# ── Admin Panel (server-side only — NOT VITE_ prefixed) ──────────────────────
# These are checked by the API server at login time. Never exposed in the browser bundle.
ADMIN_EMAIL                = amritabiswas7432@gmail.com
ADMIN_PASSWORD             = admin123
ADMIN_NAME                 = admin

# ── Email (Zoho) ─────────────────────────────────────────────────────────────
ZOHO_EMAIL                 = manish@grafxcore.in
ZOHO_APP_PASSWORD          = 2DccDD98mu1f

# ── Firebase ─────────────────────────────────────────────────────────────────
VITE_FIREBASE_API_KEY              = AIzaSyAQta3YKiao4_2JD5oLF4_IfL75h83scAY
VITE_FIREBASE_AUTH_DOMAIN          = jb-jewellery.firebaseapp.com
VITE_FIREBASE_PROJECT_ID           = jb-jewellery
VITE_FIREBASE_STORAGE_BUCKET       = jb-jewellery.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID  = 350196066764
VITE_FIREBASE_APP_ID               = 1:350196066764:web:2599ec34c09a476ae51569
VITE_FIREBASE_MEASUREMENT_ID       = G-CSE46DXRRG

# ── Security ─────────────────────────────────────────────────────────────────
JWT_SECRET                 = oww20rDQvHzVlC0ks+c0smzRDB2YIWEHUv5YPGHzIzT4tMJEgUV4272ezwUTSeUK6NUbsOtzuZd44zTY0oKFpw==
SESSION_SECRET             = oww20rDQvHzVlC0ks+c0smzRDB2YIWEHUv5YPGHzIzT4tMJEgUV4272ezwUTSeUK6NUbsOtzuZd44zTY0oKFpw==

# ── Build Config ─────────────────────────────────────────────────────────────
BASE_PATH                  = /
NODE_ENV                   = production
```

> **DATABASE_URL note**: Go to your Supabase project → **Settings → Database → Connection string → URI** and copy the full URI. It looks like `postgresql://postgres:[password]@db.glpsidmtigfepgowliia.supabase.co:5432/postgres`. Replace `[password]` with the database password you chose when creating the Supabase project.

---

## Step 3 — Create the Admin Account

After your first deployment:

1. Supabase Dashboard → **Authentication → Users → Add User**
2. Enter `amritabiswas7432@gmail.com` as the email, set a password, check **Auto Confirm User**
3. Open **SQL Editor** and run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = (
     SELECT id FROM auth.users WHERE email = 'amritabiswas7432@gmail.com'
   );
   ```
4. Log in at `https://your-site.vercel.app/admin` using `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD`

---

## Step 4 — Run the Categories Migration

If you want the dynamic home page sections (vibe tiles, price buckets, combo deals), run the second migration:

1. Supabase SQL Editor → paste + run `supabase-migration-categories.sql`
2. This seeds all default category tiles. Go to `/admin/categories` to manage them.

---

## Step 5 — Custom Domain (optional)

Vercel Dashboard → your project → **Settings → Domains** → Add your domain → follow the DNS instructions

---

## Environment Variables Reference

| Variable | Used by | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | API (server-side) | Supabase project URL |
| `SUPABASE_ANON_KEY` | API (server-side) | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | API (server-side) | Secret admin key — never use in VITE_ vars |
| `VITE_SUPABASE_URL` | Frontend build | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend build | Supabase anon key |
| `DATABASE_URL` | API (server-side) | Direct Postgres connection (Supabase URI) |
| `ADMIN_EMAIL` | API (server-side) | Admin panel login email — checked at login time |
| `ADMIN_PASSWORD` | API (server-side) | Admin panel login password — never sent to browser |
| `ADMIN_NAME` | API (server-side) | Display name shown in admin panel |
| `ZOHO_EMAIL` | API | Zoho Mail sender address |
| `ZOHO_APP_PASSWORD` | API | Zoho Mail app password |
| `VITE_FIREBASE_*` | Frontend | Firebase config (analytics, notifications) |
| `JWT_SECRET` | API | Signs customer session tokens |
| `SESSION_SECRET` | API | Session cookie signing |
| `BASE_PATH` | Frontend build | Must be `/` |
| `NODE_ENV` | Both | Set to `production` |

---

## Troubleshooting

**"No Output Directory named public"**
→ You are deploying the wrong folder. Set Root Directory to `/` (the repo root), not `artifacts/jb-jewellery` or `artifacts/api-server`. The root `vercel.json` handles everything.

**API returns 500 errors**
→ Vercel Dashboard → your project → **Functions** tab → view function logs
→ Most common cause: missing `SUPABASE_SERVICE_ROLE_KEY` or wrong `DATABASE_URL`

**"Admin credentials not configured on server" on admin login**
→ Add `ADMIN_EMAIL` and `ADMIN_PASSWORD` to Vercel → Environment Variables, then redeploy
→ These are server-side vars (no `VITE_` prefix). The API checks them at login time — they are never embedded in the browser bundle

**"Invalid credentials" on admin login**
→ `ADMIN_EMAIL` and `ADMIN_PASSWORD` in Vercel must match exactly what you type in the login form

**Emails not sending**
→ Check `ZOHO_EMAIL` and `ZOHO_APP_PASSWORD` are correct
→ Make sure your Zoho account allows SMTP. Generate app password from: Zoho Mail → Settings → Security → App Passwords

**Product images not showing**
→ Make sure the `products` storage bucket in Supabase exists and is set to **Public**

**Vercel function timeout**
→ Free Vercel accounts have a 10-second limit. Email operations can be slow.
→ Upgrade to Vercel Pro for 60-second timeout, or use Resend/SendGrid for faster email delivery

**Changes not live after redeploy**
→ Vercel → your project → **Deployments** → click latest → check build logs
