# JB Jewellery Collection — Vercel Deployment Guide

This guide walks you through deploying the full app (frontend + backend + database) to production using **Vercel** (frontend) + **Railway** (API server) + **Supabase** (database).

---

## Overview

| Service | What it hosts | Cost |
|---------|--------------|------|
| **Vercel** | React storefront + admin panel | Free tier available |
| **Railway** | Express API server (orders, email, uploads) | ~$5/month |
| **Supabase** | Database, auth, file storage | Free tier available |

---

## Step 1 — Set Up a New Supabase Project

> Skip this if you are keeping your existing Supabase project.

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a name, region closest to your users, and a strong database password
3. Once created, go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret — never share it)
4. Go to **Settings → Authentication** and:
   - Enable **Email** provider
   - Turn ON **Confirm email** → OFF (so users can login without confirming email) — this is "mailer_autoconfirm" in the Auth settings
5. Open the **SQL Editor** and run the full contents of `DATABASE_MIGRATION.sql` from this project

---

## Step 2 — Deploy the API Server to Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select this repository
3. Railway will auto-detect it as a Node.js app. Set the **Root Directory** to: `/` (leave as root — the `railway.json` handles the build)
4. Go to your service settings → **Variables** and add all of these:

```
PORT=8080
NODE_ENV=production

# Supabase (from Step 1)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin panel credentials (you choose these)
VITE_ADMIN_EMAIL=youremail@example.com
VITE_ADMIN_PASSWORD=choose-a-strong-password
VITE_ADMIN_NAME=Admin

# Email (Zoho Mail SMTP — or change mailer.ts to use Gmail/SendGrid)
ZOHO_EMAIL=your-zoho-email@yourdomain.com
ZOHO_APP_PASSWORD=your-zoho-app-password

# JWT secret (generate a random string)
JWT_SECRET=your-random-64-char-secret-here

# Database (Railway provides this automatically if you add a PostgreSQL plugin)
DATABASE_URL=postgresql://...
```

5. Click **Deploy** and wait for the build to finish
6. Copy your Railway **public domain** (looks like `https://your-app.up.railway.app`)

---

## Step 3 — Configure the Vercel Proxy

Open `vercel.json` at the root of this project and replace `REPLACE_WITH_YOUR_RAILWAY_URL` with your Railway domain:

```json
{
  "rewrites": [
    {
      "source": "/jb-api/:path*",
      "destination": "https://your-app.up.railway.app/api/:path*"
    },
    ...
  ]
}
```

Save and commit this change to Git.

---

## Step 4 — Deploy the Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import Git Repository
2. Select this repository
3. Vercel will detect the `vercel.json`. Override settings if needed:
   - **Framework Preset**: Other
   - **Build Command**: `pnpm install && pnpm --filter @workspace/jb-jewellery run build`
   - **Output Directory**: `artifacts/jb-jewellery/dist/public`
   - **Install Command**: `pnpm install --frozen-lockfile`
4. Go to **Settings → Environment Variables** and add:

```
# Required for the Vite build
BASE_PATH=/
NODE_ENV=production

# Supabase (same values as Railway)
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Admin panel credentials (must match Railway values)
VITE_ADMIN_EMAIL=youremail@example.com
VITE_ADMIN_PASSWORD=choose-a-strong-password
VITE_ADMIN_NAME=Admin
```

5. Click **Deploy**
6. Your site will be live at `https://your-project.vercel.app`

---

## Step 5 — Create the Admin Account in Supabase

After deployment, create your admin user:

1. Supabase Dashboard → **Authentication → Users → Add User**
2. Enter your admin email and password, check **Auto Confirm User**
3. Open **SQL Editor** and run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = (
     SELECT id FROM auth.users WHERE email = 'youremail@example.com'
   );
   ```
4. Also set your `VITE_ADMIN_EMAIL` / `VITE_ADMIN_PASSWORD` environment variables (these are for the admin panel's own login, separate from Supabase auth)

---

## Step 6 — Configure a Custom Domain (optional)

**Vercel**: Settings → Domains → Add your domain  
**Railway**: Settings → Networking → Generate Domain or add custom domain

---

## Switching Databases (Migrating Data)

If you are moving from one Supabase project to another and want to keep all existing data:

1. Run `DATABASE_MIGRATION.sql` on the new project (creates schema + seed data)
2. For **orders**: Export from old project → Supabase Dashboard → Table Editor → orders → Export CSV, then import to new project
3. For **product images**: Images are stored as URLs. If you used Supabase Storage for images, re-upload them to the new project's storage bucket
4. For **users/customers**: Supabase auth users cannot be migrated via SQL. Ask customers to re-register, or use the Supabase admin API to recreate accounts
5. Update all environment variables to point to the new Supabase project URL and keys

---

## Environment Variables Reference

| Variable | Used by | Description |
|----------|---------|-------------|
| `VITE_SUPABASE_URL` | Frontend + API | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | API only | Secret key for admin operations |
| `VITE_ADMIN_EMAIL` | Frontend + API | Admin panel login email |
| `VITE_ADMIN_PASSWORD` | Frontend + API | Admin panel login password |
| `VITE_ADMIN_NAME` | Frontend | Display name in admin panel |
| `ZOHO_EMAIL` | API | Zoho Mail sender address |
| `ZOHO_APP_PASSWORD` | API | Zoho Mail app password |
| `JWT_SECRET` | API | Secret for customer session tokens |
| `DATABASE_URL` | API | PostgreSQL connection string |
| `BASE_PATH` | Frontend build | Set to `/` for Vercel |
| `PORT` | API | Port to listen on (Railway auto-sets this) |

---

## Troubleshooting

**Build fails on Vercel with "BASE_PATH not set"**  
→ Add `BASE_PATH=/` to Vercel environment variables

**API calls return 502/504**  
→ Check Railway logs. The API might be crashed — check env vars are all set

**Login says "invalid credentials"**  
→ Check that `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD` match exactly in both Vercel and Railway env vars

**Email not sending**  
→ Verify `ZOHO_EMAIL` and `ZOHO_APP_PASSWORD` are correct. If using Gmail, change the SMTP settings in `artifacts/api-server/src/lib/mailer.ts`

**Product images not showing**  
→ Upload images to Supabase Storage and update product image URLs via Admin → Products
