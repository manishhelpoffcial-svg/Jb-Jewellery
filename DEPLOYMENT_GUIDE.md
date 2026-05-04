# JB Jewellery Collection — Vercel Deployment Guide

This guide deploys the **entire app — frontend and API — to Vercel only**. No Railway or separate backend host is needed.

---

## How It Works

```
Browser
  └─▶ Vercel (your-app.vercel.app)
        ├─▶ /jb-api/*  →  Vercel Serverless Function (Express API)
        └─▶ /*         →  Static React frontend
```

Vercel hosts everything:
- **Frontend** — React/Vite app built to static files
- **API** — Express app bundled into a single Vercel serverless function

---

## Step 1 — Set Up Supabase

> Skip if you are keeping your existing Supabase project.

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a name, region closest to your users, and a strong DB password
3. Once created, go to **Settings → API** and copy:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key _(keep secret — never put in frontend code)_
4. **Settings → Authentication → Email** → turn off "Confirm email" (so users can log in without confirming)
5. Open the **SQL Editor** and paste + run the entire contents of `DATABASE_MIGRATION.sql`
6. Go to **Storage** → **New Bucket** → Name: `invoices`, set to **Public**. Then also create buckets named `products`, `categories`, `review-images`, `site-assets` (all Public)

---

## Step 2 — Deploy to Vercel

1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
3. Select this repository
4. Vercel reads `vercel.json` automatically. Leave all build settings as detected:
   - **Framework**: Other (auto-detected from vercel.json)
5. **Before clicking Deploy**, go to **Environment Variables** and add all of these:

```
# Supabase
VITE_SUPABASE_URL          = https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY     = your-anon-public-key
SUPABASE_URL               = https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY          = your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY  = your-service-role-key

# Admin panel credentials (you choose these)
VITE_ADMIN_EMAIL           = youremail@example.com
VITE_ADMIN_PASSWORD        = choose-a-strong-password
VITE_ADMIN_NAME            = Admin

# Email sending via Zoho
ZOHO_EMAIL                 = your-zoho-email@yourdomain.com
ZOHO_APP_PASSWORD          = your-zoho-app-password

# JWT secret for customer sessions (generate any random 64-char string)
JWT_SECRET                 = random-64-character-string-here

# Required for the Vite build
BASE_PATH                  = /
NODE_ENV                   = production
```

6. Click **Deploy**
7. Wait for build to finish (~2–3 minutes). Your site is live at `https://your-project.vercel.app`

---

## Step 3 — Create the Admin Account in Supabase

After deployment:

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
4. Log in to your live site at `/admin/login` using the `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD` you set

---

## Step 4 — Configure a Custom Domain (optional)

Vercel Dashboard → your project → **Settings → Domains** → Add your domain → follow the DNS instructions

---

## Switching to a New Supabase Project (Migrating Data)

If you are moving from one Supabase project to another and want to keep existing data:

1. Run `DATABASE_MIGRATION.sql` on the new project (creates schema + seeds products, categories, coupons)
2. **Orders**: Supabase Dashboard → Table Editor → orders → Export CSV → import into new project
3. **Product images**: If images are uploaded to Supabase Storage, download them and re-upload to new project's storage buckets. Images that are already public URLs (e.g. from another CDN) need no migration
4. **Users/customers**: Supabase auth users cannot be migrated via SQL. Customers will need to re-register on the new project
5. Update all Vercel environment variables to point to the new Supabase project URL and keys, then redeploy

---

## Environment Variables Reference

| Variable | Where it's used | Description |
|----------|----------------|-------------|
| `VITE_SUPABASE_URL` | Frontend build + API | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend build | Supabase public anon key |
| `SUPABASE_URL` | API serverless function | Supabase project URL (server-side) |
| `SUPABASE_ANON_KEY` | API serverless function | Supabase anon key (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | API serverless function | Secret admin key (never put in VITE_ vars) |
| `VITE_ADMIN_EMAIL` | Frontend + API | Admin panel login email |
| `VITE_ADMIN_PASSWORD` | Frontend + API | Admin panel login password |
| `VITE_ADMIN_NAME` | Frontend | Display name shown in admin panel |
| `ZOHO_EMAIL` | API serverless function | Zoho Mail sender address |
| `ZOHO_APP_PASSWORD` | API serverless function | Zoho Mail app password |
| `JWT_SECRET` | API serverless function | Secret for customer JWT tokens |
| `BASE_PATH` | Frontend build only | Must be set to `/` |
| `NODE_ENV` | Both | Set to `production` |

---

## Troubleshooting

**Build fails with "BASE_PATH not set"**
→ Add `BASE_PATH=/` to Vercel environment variables

**API returns 500 errors**
→ Check Vercel → your project → **Functions** tab → look at function logs
→ Most common cause: missing `SUPABASE_SERVICE_ROLE_KEY` or wrong Supabase URL

**"Invalid credentials" on admin login**
→ Your `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD` Vercel env vars must match exactly what you type in the login form

**Emails not sending**
→ Check `ZOHO_EMAIL` and `ZOHO_APP_PASSWORD` are correct
→ Make sure your Zoho account allows SMTP access and the app password is generated from **Zoho Mail → Settings → Security → App Passwords**
→ To use Gmail instead: edit `artifacts/api-server/src/lib/mailer.ts` and change the SMTP host/port to Gmail's settings

**Product images not showing**
→ Upload product images via Admin → Products. Images are stored in Supabase Storage.
→ Make sure the `products` storage bucket exists and is set to **Public**

**Vercel function timeout**
→ Free Vercel accounts have a 10-second function timeout. Email-sending operations may be slow.
→ Upgrade to Vercel Pro for 60-second timeout, or use a dedicated email service like Resend/SendGrid for faster delivery

**Changes not reflecting after redeploy**
→ Vercel → your project → **Deployments** → click the latest → check build logs for errors
