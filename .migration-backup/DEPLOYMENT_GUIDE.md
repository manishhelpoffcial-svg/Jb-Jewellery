# JB Jewellery Collection — Full Deployment Guide

Deploy the **entire app — frontend + API — to a single Vercel project**. No separate backend needed.

---

## How It Works

```
Browser
  └─▶ Vercel (your-app.vercel.app)
        ├─▶ /jb-api/*  →  Vercel Serverless Function (Express API)
        └─▶ /*         →  Static React frontend
                              └─▶ Supabase (Database + Auth + Storage)
```

- **Frontend** — React/Vite app served as static files from Vercel's CDN
- **API** — Express app bundled into a Vercel serverless function
- **Database** — Supabase (Postgres + Auth + File Storage)

> **Dev vs Prod databases:** Right now Replit (development) and Vercel (production) share the same Supabase database. This is fine while building, but once you have real customers, create a **second Supabase project** for production and point only Vercel to it. See the "Switching to a Separate Production Database" section at the bottom.

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → Sign in → **New Project**
2. Choose a name, set a strong **Database Password** (save it — you'll need it for `DATABASE_URL`)
3. Select the region closest to your customers
4. Wait ~2 minutes for the project to be ready

Once ready, go to **Settings → API** and copy these three values — you'll need them for env vars:
- **Project URL** (looks like `https://xxxxxx.supabase.co`)
- **anon public** key (long JWT string)
- **service_role** key (another long JWT — keep this secret, never put it in frontend code)

---

## Step 2 — Run the Database Migration

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file `DATABASE_MIGRATION.sql` from this repo, copy all its contents, paste into the editor
4. Click **Run** — this creates all tables, indexes, and row-level security policies
5. Next, open `supabase-migration-categories.sql`, paste and run it too — this seeds the home page sections (vibe tiles, budget categories, combo deals)

---

## Step 3 — Configure Authentication

1. In Supabase → **Authentication → Providers → Email**
2. Turn **OFF** "Confirm email" (so customers can register and log in instantly without verifying)
3. Optionally turn off "Secure email change" as well

---

## Step 4 — Create Storage Buckets

Go to **Storage** in the left sidebar. You need to create **5 buckets**. For each one:
- Click **New Bucket**
- Enter the bucket name exactly as shown
- Toggle **Public bucket** ON (except `invoices` — that stays private)
- Click **Create bucket**

| Bucket Name | Public? | Used For |
|-------------|---------|----------|
| `products` | ✅ Yes | Product images uploaded by admin |
| `categories` | ✅ Yes | Category/banner images for home page |
| `site-assets` | ✅ Yes | Hero banners, logo, announcement images |
| `review-images` | ✅ Yes | Photos customers attach to product reviews |
| `invoices` | ❌ No (Private) | PDF invoices generated per order |

### Storage Policies Explained

Supabase storage uses **Row Level Security (RLS) policies** to control who can read and upload files. After creating each bucket, you set policies under **Storage → [bucket name] → Policies**.

For each bucket below, click **New Policy → For full customization**.

---

#### `products` bucket (Public)

**Policy 1 — Allow anyone to view product images**
- Policy name: `Public read for products`
- Allowed operation: `SELECT`
- Target roles: `anon, authenticated`
- Policy definition (USING expression):
```sql
true
```

**Policy 2 — Allow admin uploads via service role (API handles this)**

No additional policy needed here — the API server uses the `service_role` key which bypasses all RLS policies automatically. All image uploads from the admin panel go through the API, not directly from the browser.

---

#### `categories` bucket (Public)

**Policy 1 — Allow anyone to view category images**
- Policy name: `Public read for categories`
- Allowed operation: `SELECT`
- Target roles: `anon, authenticated`
- Policy definition:
```sql
true
```

Same as `products` — uploads go through the API (service_role), so no upload policy needed.

---

#### `site-assets` bucket (Public)

**Policy 1 — Allow anyone to view site assets**
- Policy name: `Public read for site-assets`
- Allowed operation: `SELECT`
- Target roles: `anon, authenticated`
- Policy definition:
```sql
true
```

---

#### `review-images` bucket (Public)

Customers upload their own review photos directly from the browser, so this bucket needs both read and write policies.

**Policy 1 — Allow anyone to view review images**
- Policy name: `Public read for review-images`
- Allowed operation: `SELECT`
- Target roles: `anon, authenticated`
- Policy definition:
```sql
true
```

**Policy 2 — Allow logged-in customers to upload review images**
- Policy name: `Authenticated upload for review-images`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- Policy definition (WITH CHECK expression):
```sql
bucket_id = 'review-images' AND auth.role() = 'authenticated'
```

**Policy 3 — Allow customers to delete their own review images**
- Policy name: `Owner delete for review-images`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- Policy definition:
```sql
auth.uid()::text = (storage.foldername(name))[1]
```

---

#### `invoices` bucket (Private)

Invoices are generated by the API (service_role) and only the specific customer should be able to download their own invoice.

**Policy 1 — Allow customers to download their own invoice**
- Policy name: `Owner read for invoices`
- Allowed operation: `SELECT`
- Target roles: `authenticated`
- Policy definition (USING expression):
```sql
auth.uid()::text = (storage.foldername(name))[1]
```

> This works because the API saves invoice files as `invoices/{user_id}/invoice-{orderId}.pdf`, so the first folder segment is the user's ID.

No INSERT/DELETE policies needed — the API server uses `service_role` key which bypasses RLS for writing.

---

## Step 5 — Deploy to Vercel

1. Push this repository to GitHub (if not already done)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → **Import Git Repository**
3. Select this repo
4. In the configuration screen:
   - **Root Directory**: Leave as `/` (the repo root — do NOT change this)
   - **Framework Preset**: Other
   - **Build Command**: leave blank (Vercel reads it from `vercel.json`)
   - **Output Directory**: leave blank (Vercel reads it from `vercel.json`)
5. Expand **Environment Variables** and add every variable from the table in Step 6
6. Click **Deploy** — the build takes about 2–3 minutes

---

## Step 6 — Environment Variables

Add all of these in **Vercel → your project → Settings → Environment Variables**.

Set each variable for **Production**, **Preview**, and **Development** environments (tick all three checkboxes).

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SUPABASE (used by API server — server-side only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUPABASE_URL
  → Your Supabase Project URL
  → Example: https://glpsidmtigfepgowliia.supabase.co
  → Where to find: Supabase → Settings → API → Project URL

SUPABASE_ANON_KEY
  → Supabase public anonymous key (safe to expose to clients)
  → Where to find: Supabase → Settings → API → anon public

SUPABASE_SERVICE_ROLE_KEY
  → Supabase secret admin key — NEVER put this in any VITE_ variable
  → Bypasses all Row Level Security policies
  → Where to find: Supabase → Settings → API → service_role

DATABASE_URL
  → Direct Postgres connection string for the API server
  → Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  → Where to find: Supabase → Settings → Database → Connection string
    → Switch to "URI" tab → copy the "Transaction" pooler connection string
  → Replace [YOUR-PASSWORD] with your Supabase database password

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SUPABASE (used by frontend — must have VITE_ prefix)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VITE_SUPABASE_URL
  → Same value as SUPABASE_URL above
  → The frontend uses this to connect to Supabase Auth directly from the browser

VITE_SUPABASE_ANON_KEY
  → Same value as SUPABASE_ANON_KEY above
  → Safe to be public — Supabase RLS policies protect your data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ADMIN PANEL (server-side only — no VITE_ prefix)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ADMIN_EMAIL
  → The email address you use to log into /admin
  → Example: amritabiswas7432@gmail.com
  → Checked by the API server at login time — never sent to the browser

ADMIN_PASSWORD
  → The password you use to log into /admin
  → Example: admin123 (use something stronger in production)
  → Checked by the API server at login time — never sent to the browser

ADMIN_NAME
  → Display name shown in the admin panel header
  → Example: Admin

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EMAIL — ZOHO MAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ZOHO_EMAIL
  → The Zoho email address that sends order confirmation emails
  → Example: manish@grafxcore.in

ZOHO_APP_PASSWORD
  → Zoho Mail app-specific password (not your Zoho login password)
  → How to get it: Zoho Mail → Settings → Security → App Passwords → Generate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FIREBASE (used by frontend — must have VITE_ prefix)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Used for push notifications and analytics.
  Where to find: Firebase Console → your project → Project Settings → Your apps → Config

VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN        → format: your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET     → format: your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID     → format: G-XXXXXXXXXX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SECURITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JWT_SECRET
  → Secret key used to sign customer login tokens
  → Use any long random string (32+ characters)
  → Generate one: https://generate-secret.vercel.app/64

SESSION_SECRET
  → Secret key used to sign server sessions
  → Can be the same value as JWT_SECRET or a different random string

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BUILD CONFIG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NODE_ENV
  → Set to: production

BASE_PATH
  → Set to: /
```

---

## Step 7 — Set Up the Admin Account

The admin panel login (`/admin`) is separate from customer accounts. It checks the `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars you set above.

1. Go to your live site at `https://your-site.vercel.app/admin`
2. Enter your `ADMIN_EMAIL` and `ADMIN_PASSWORD` values
3. Click **Login to Admin Panel**

You do not need to create an admin user in Supabase — the admin panel is independent of Supabase Auth.

---

## Step 8 — Quick Reference: Current Credentials

These are the values currently configured in this project:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | `https://glpsidmtigfepgowliia.supabase.co` |
| `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscHNpZG10aWdmZXBnb3dsaWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjUyMjMsImV4cCI6MjA5MjUwMTIyM30.DSPbzbud6h5PxPc0KvrZeb_FbMg4r5gwzY9FhsXbNpE` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscHNpZG10aWdmZXBnb3dsaWlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjkyNTIyMywiZXhwIjoyMDkyNTAxMjIzfQ.Xv899oADgZIt9lP9T6y4uC4IlM_khJYnTR27WOnxxO8` |
| `DATABASE_URL` | `postgresql://postgres:[YOUR-DB-PASSWORD]@db.glpsidmtigfepgowliia.supabase.co:5432/postgres` |
| `ADMIN_EMAIL` | `amritabiswas7432@gmail.com` |
| `ADMIN_PASSWORD` | `admin123` |
| `ADMIN_NAME` | `admin` |
| `ZOHO_EMAIL` | `manish@grafxcore.in` |
| `ZOHO_APP_PASSWORD` | `2DccDD98mu1f` |
| `VITE_FIREBASE_API_KEY` | `AIzaSyAQta3YKiao4_2JD5oLF4_IfL75h83scAY` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `jb-jewellery.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `jb-jewellery` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `jb-jewellery.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `350196066764` |
| `VITE_FIREBASE_APP_ID` | `1:350196066764:web:2599ec34c09a476ae51569` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-CSE46DXRRG` |
| `JWT_SECRET` | `oww20rDQvHzVlC0ks+c0smzRDB2YIWEHUv5YPGHzIzT4tMJEgUV4272ezwUTSeUK6NUbsOtzuZd44zTY0oKFpw==` |
| `SESSION_SECRET` | `oww20rDQvHzVlC0ks+c0smzRDB2YIWEHUv5YPGHzIzT4tMJEgUV4272ezwUTSeUK6NUbsOtzuZd44zTY0oKFpw==` |
| `NODE_ENV` | `production` |
| `BASE_PATH` | `/` |

---

## Switching to a Separate Production Database

Right now both Replit (dev) and Vercel (prod) share the same Supabase database. When you are ready for real customers, follow these steps to separate them:

### Step A — Create a new Supabase project for production

1. Supabase → **New Project** (name it something like "jb-jewellery-production")
2. Choose a strong database password
3. Run `DATABASE_MIGRATION.sql` in the new project's SQL Editor
4. Run `supabase-migration-categories.sql` in the new project's SQL Editor
5. Create the same 5 storage buckets (`products`, `categories`, `site-assets`, `review-images`, `invoices`) and apply the same policies as described in Step 4 above
6. Copy the new project's URL, anon key, service_role key, and database URI

### Step B — Update Vercel to point to the new database

In Vercel → your project → **Settings → Environment Variables**, update these variables with the new project's values:

- `SUPABASE_URL` → new project URL
- `SUPABASE_ANON_KEY` → new project anon key
- `SUPABASE_SERVICE_ROLE_KEY` → new project service_role key
- `VITE_SUPABASE_URL` → new project URL
- `VITE_SUPABASE_ANON_KEY` → new project anon key
- `DATABASE_URL` → new project database URI

Then click **Redeploy** in Vercel (Deployments tab → three dots → Redeploy).

### Step C — Keep Replit pointing to the old database

You do not need to change anything in Replit. It will keep using the original Supabase project as your development/testing database. The two environments will be fully isolated.

---

## Custom Domain (optional)

Vercel → your project → **Settings → Domains** → **Add** → enter your domain → follow the DNS instructions shown.

---

## Environment Variables Quick Reference Table

| Variable | Used By | Where to Set | Description |
|----------|---------|-------------|-------------|
| `SUPABASE_URL` | API server | Vercel + Replit | Supabase project URL |
| `SUPABASE_ANON_KEY` | API server | Vercel + Replit | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | API server | Vercel + Replit | Supabase secret admin key |
| `DATABASE_URL` | API server | Vercel + Replit | Postgres connection string |
| `VITE_SUPABASE_URL` | Frontend (build time) | Vercel + Replit | Same as SUPABASE_URL — baked into JS bundle |
| `VITE_SUPABASE_ANON_KEY` | Frontend (build time) | Vercel + Replit | Same as SUPABASE_ANON_KEY — baked into JS bundle |
| `ADMIN_EMAIL` | API server only | Vercel + Replit | Admin panel login email |
| `ADMIN_PASSWORD` | API server only | Vercel + Replit | Admin panel login password |
| `ADMIN_NAME` | API server only | Vercel + Replit | Admin display name |
| `ZOHO_EMAIL` | API server | Vercel | Sender email for order emails |
| `ZOHO_APP_PASSWORD` | API server | Vercel | Zoho Mail app password |
| `VITE_FIREBASE_*` | Frontend (build time) | Vercel + Replit | Firebase push + analytics config |
| `JWT_SECRET` | API server | Vercel + Replit | Signs customer session tokens |
| `SESSION_SECRET` | API server | Vercel + Replit | Signs server sessions |
| `NODE_ENV` | Both | Vercel | Set to `production` |
| `BASE_PATH` | Frontend (build time) | Vercel | Set to `/` |

> **VITE_ prefix explained:** Any variable that starts with `VITE_` is embedded into the JavaScript bundle at build time and is visible in the browser. Only put public, non-secret values in VITE_ variables. Server secrets (`SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ZOHO_APP_PASSWORD`, `JWT_SECRET`) must never have the VITE_ prefix.

---

## Troubleshooting

**"No Output Directory named public"**
→ You set the wrong Root Directory in Vercel. It must be `/` (the repo root). Do not point it to `artifacts/jb-jewellery` or `artifacts/api-server`.

**Admin panel shows "Admin credentials not configured on server"**
→ `ADMIN_EMAIL` and `ADMIN_PASSWORD` are missing from Vercel environment variables
→ Add them (no `VITE_` prefix), then redeploy

**Admin panel shows "Invalid admin email or password"**
→ The email/password you typed does not match `ADMIN_EMAIL` / `ADMIN_PASSWORD` in Vercel
→ Double-check for extra spaces or wrong capitalisation

**API returns 500 errors / admin dashboard is empty**
→ Vercel Dashboard → your project → **Functions** tab → click on the function → view logs
→ Most common causes: missing `SUPABASE_SERVICE_ROLE_KEY`, wrong `DATABASE_URL`, or `DATABASE_URL` still has `[YOUR-DB-PASSWORD]` placeholder

**Product / category images not showing**
→ The storage bucket (`products` or `categories`) does not exist or is not set to Public
→ The `SELECT` policy on the bucket is missing — re-apply it from Step 4 above

**Review image upload fails**
→ The `review-images` bucket is missing the `INSERT` policy for authenticated users
→ Re-apply the policies from Step 4 above

**Invoice download fails**
→ The `invoices` bucket policy is missing the `SELECT` policy that checks `auth.uid()`
→ Re-apply it from Step 4 above

**Emails not sending**
→ Check `ZOHO_EMAIL` and `ZOHO_APP_PASSWORD` are correct in Vercel
→ Generate a new app password: Zoho Mail → Settings → Security → App Passwords
→ Make sure SMTP access is enabled on your Zoho account

**Home page sections (vibes, budget, combos) not showing**
→ The `supabase-migration-categories.sql` migration has not been run
→ Open your Supabase project → SQL Editor → paste and run that file

**Vercel function timeout on email routes**
→ Free Vercel accounts have a 10-second function limit. Email sending can be slow.
→ Upgrade to Vercel Pro (60-second limit) or switch to Resend / SendGrid for faster delivery

**Changes deployed but site still shows old version**
→ Vercel → your project → **Deployments** → find latest → check build logs
→ If build succeeded, do a hard refresh in your browser (Ctrl+Shift+R / Cmd+Shift+R)
