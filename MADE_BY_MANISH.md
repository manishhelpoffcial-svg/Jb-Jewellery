# JB Jewellery Collection — Complete A‑to‑Z Guide

**Made by Manish**
Full‑stack e‑commerce site for **JB Jewellery Collection**
Stack: React + Vite + TypeScript · Tailwind · Supabase · Express API · Zoho Mail

---

## Table of Contents

1. [What this project is](#1-what-this-project-is)
2. [Repository / monorepo layout](#2-repository--monorepo-layout)
3. [Frontend (`artifacts/jb-jewellery`)](#3-frontend-artifactsjb-jewellery)
4. [Backend API server (`artifacts/api-server`)](#4-backend-api-server-artifactsapi-server)
5. [How the website works (request flow)](#5-how-the-website-works-request-flow)
6. [Environment variables (`.env`) — full reference](#6-environment-variables-env--full-reference)
7. [Replit Secrets — what to set and where](#7-replit-secrets--what-to-set-and-where)
8. [Supabase — A to Z setup guide](#8-supabase--a-to-z-setup-guide)
9. [Database schema (full SQL)](#9-database-schema-full-sql)
10. [Storage buckets (product images)](#10-storage-buckets-product-images)
11. [Zoho Mail setup (transactional emails)](#11-zoho-mail-setup-transactional-emails)
12. [Admin panel guide](#12-admin-panel-guide)
13. [Customer flow guide](#13-customer-flow-guide)
14. [Local development & running](#14-local-development--running)
15. [Deployment / publishing](#15-deployment--publishing)
16. [Troubleshooting](#16-troubleshooting)
17. [File-by-file map](#17-file-by-file-map)

---

## 1. What this project is

A modern e‑commerce store for jewellery sales. Customers browse products, add to cart, checkout (with optional WhatsApp confirmation), receive themed transactional emails, and can view their order history. An admin panel lets the owner manage customers, products, orders, coupons, and view analytics dashboards.

**Three deployable artifacts in this monorepo:**
| Artifact | Path | Purpose | Default port |
|---|---|---|---|
| `jb-jewellery` (web) | `artifacts/jb-jewellery` | Customer storefront + admin UI (React + Vite) | provided by `PORT` env |
| `api-server` (api) | `artifacts/api-server` | Express backend for ops needing service role | `8080` |
| `mockup-sandbox` (design) | `artifacts/mockup-sandbox` | Internal component preview canvas (dev only) | `8081` |

The frontend talks to the backend via the **`/jb-api`** path — Vite's dev server proxies it to `http://localhost:8080` and rewrites the path to `/api`.

---

## 2. Repository / monorepo layout

```
artifacts-monorepo/
├── artifacts/
│   ├── jb-jewellery/      # Storefront + admin (React + Vite)
│   ├── api-server/        # Express API (port 8080)
│   └── mockup-sandbox/    # Dev-only canvas previews
├── lib/
│   ├── api-spec/          # OpenAPI spec + Orval codegen
│   ├── api-client-react/  # Generated React Query hooks
│   ├── api-zod/           # Generated Zod schemas
│   └── db/                # Drizzle ORM schema + DB connection
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

Managed with **pnpm workspaces** (Node 24, TypeScript 5.9).

---

## 3. Frontend (`artifacts/jb-jewellery`)

### Stack
- **React 18 + Vite 7 + TypeScript**
- **Tailwind CSS** + **shadcn/ui** components
- **Framer Motion** for animations
- **wouter** for routing
- **@supabase/supabase-js** for auth, products, orders, addresses
- **jsPDF + html2canvas** for invoice PDFs
- **Recharts** for admin dashboard charts

### Folder structure
```
src/
├── App.tsx                # Routes + global providers
├── main.tsx               # React root
├── index.css              # Tailwind + global styles
├── lib/
│   ├── supabase.ts        # Supabase client (hybrid local/session storage)
│   ├── adminApi.ts        # Calls /jb-api/sb-admin/* with x-admin-token
│   ├── api.ts             # Calls /jb-api/* legacy endpoints
│   ├── orders.ts          # WhatsApp builder, order helpers
│   ├── mailer.ts          # (front-side helpers)
│   └── utils.ts           # cn(), formatPrice(), etc.
├── context/
│   ├── AuthContext.tsx    # Customer auth (Supabase) + signup-with-address
│   ├── AdminAuthContext.tsx # Admin password gate (VITE_ADMIN_PASSWORD)
│   └── CartContext.tsx    # Cart state + localStorage
├── components/
│   ├── auth/AuthModal.tsx # Login / Signup (with address) / Forgot password
│   ├── admin/AdminLayout.tsx
│   ├── cart/CartDrawer.tsx
│   ├── home/              # Marquee, HeroSlider, Categories, Bestsellers...
│   ├── layout/            # Navbar, Footer
│   ├── product/           # Product cards, gallery, reviews
│   ├── profile/           # ProfileLayout, sidebar
│   └── ui/                # shadcn/ui primitives
├── pages/
│   ├── Home.tsx
│   ├── Products.tsx
│   ├── Checkout.tsx
│   ├── OrderSuccess.tsx
│   ├── MyOrders.tsx
│   ├── profile/           # Profile, Orders, Reviews, OrderDetail
│   └── admin/             # Dashboard, Orders, Products, Customers, Coupons
└── data/                  # Static product seeds, categories
```

### Routing
- `/` → Home
- `/products` → Catalog with filters
- `/checkout` → 3‑step checkout
- `/order-success` → After‑order page
- `/my-orders`, `/profile/*` → Customer area (Supabase auth required)
- `/admin/*` → Admin (gated by `VITE_ADMIN_PASSWORD` via `AdminAuthContext`)

### Key features
- **Auth:** Supabase email+password with **Remember Me** (hybrid `localStorage`/`sessionStorage`). Signup auto-logs‑in and accepts an **optional delivery address** that's saved to the `addresses` table.
- **Cart:** Persistent cart in `localStorage` (`jb-cart`).
- **Checkout:** 3 steps — Address → Review → Confirm. Coupon codes (`JBFIRST`, `FLAT100`, `WELCOME20`), 5% tax, free shipping above ₹399. WhatsApp message auto‑built.
- **Orders:** Persisted in Supabase (also in `localStorage` as fallback). PDF invoice via jsPDF.
- **Admin panel:** Dashboard (Recharts), Orders, Products CRUD, **Customers (Supabase‑backed)**, Coupons.

---

## 4. Backend API server (`artifacts/api-server`)

### Stack
- **Express 5** on Node 24
- **TypeScript** built with **esbuild** (single bundle in `dist/index.mjs`)
- **@supabase/supabase-js** with the **service‑role key** (bypasses RLS)
- **nodemailer** + **Zoho SMTP** for transactional emails
- **pino** structured logger

### Folder structure
```
src/
├── index.ts               # Reads PORT, starts Express
├── app.ts                 # CORS, JSON parsing, mounts routes at /api
├── lib/
│   ├── auth.ts            # JWT middleware + simpleAdminMiddleware (x-admin-token)
│   ├── supabaseAdmin.ts   # Service-role Supabase client
│   ├── mailer.ts          # 7 themed gold/dark HTML emails via Zoho SMTP
│   ├── db.ts              # Postgres pool (legacy)
│   └── logger.ts
├── middlewares/
└── routes/
    ├── index.ts           # Mounts all sub-routers
    ├── health.ts          # GET /health
    ├── auth.ts            # Legacy JWT auth
    ├── orders.ts          # Order CRUD + email triggers
    ├── addresses.ts       # User addresses (legacy)
    ├── reviews.ts         # Product reviews
    ├── subscribers.ts     # Newsletter
    ├── notify.ts          # Manual notifications
    ├── admin-customers.ts # Legacy customer admin
    └── admin-supabase.ts  # NEW Supabase-backed admin (mounted at /sb-admin)
```

### Endpoint map (all under `/api` on the server, reached via `/jb-api/...` from the frontend)

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET` | `/health` | Liveness check | — |
| `POST` | `/auth/login` | Legacy login | — |
| `*` | `/orders/*` | Order CRUD + email | JWT |
| `*` | `/addresses/*` | Address CRUD (legacy) | JWT |
| `*` | `/reviews/*` | Product reviews | JWT |
| `POST` | `/subscribers` | Newsletter signup | — |
| `POST` | `/notify` | Manual email | Admin |
| `*` | `/admin/customers/*` | Legacy admin (Postgres) | Admin JWT |
| **`GET`** | **`/sb-admin/customers`** | **List all Supabase users + addresses** | **`x-admin-token`** |
| **`GET`** | **`/sb-admin/customers/:id`** | **Single user detail** | **`x-admin-token`** |
| **`POST`** | **`/sb-admin/customers`** | **Create user (auto-confirmed) + profile + address** | **`x-admin-token`** |
| **`DELETE`** | **`/sb-admin/customers/:id`** | **Permanent delete** | **`x-admin-token`** |
| **`PATCH`** | **`/sb-admin/customers/:id/password`** | **Set new password instantly** | **`x-admin-token`** |
| **`POST`** | **`/sb-admin/customers/:id/login-link`** | **Generate Supabase magic-link "Login as" URL** | **`x-admin-token`** |

The `x-admin-token` header is the value of `VITE_ADMIN_PASSWORD` (or `ADMIN_PASSWORD` on the server). The browser's admin panel sends it automatically through `src/lib/adminApi.ts`.

---

## 5. How the website works (request flow)

```
┌──────────────────┐      ┌────────────────────┐
│  Customer (web)  │      │  Admin (web)       │
└────────┬─────────┘      └─────────┬──────────┘
         │                          │
         ▼                          ▼
┌─────────────────────────────────────────────┐
│   React app (artifacts/jb-jewellery)        │
│                                              │
│   ┌──────────────┐    ┌────────────────┐    │
│   │ AuthContext  │    │ AdminAuthCtx   │    │
│   │ (Supabase)   │    │ (password gate)│    │
│   └──────┬───────┘    └────────┬───────┘    │
│          │                     │             │
└──────────┼─────────────────────┼─────────────┘
           │                     │
   ┌───────▼─────────┐    ┌──────▼──────────────────────┐
   │ supabase-js     │    │ fetch /jb-api/sb-admin/...  │
   │ (anon key)      │    │ + x-admin-token header      │
   └───────┬─────────┘    └──────┬──────────────────────┘
           │                     │ vite proxy
           ▼                     ▼ rewrite /jb-api → /api
   ┌────────────────┐    ┌─────────────────────────────┐
   │   Supabase     │    │  Express API (port 8080)    │
   │  (auth, DB,    │    │  ┌───────────────────────┐  │
   │   storage,     │◄───┤  │ supabaseAdmin client  │  │
   │   RLS)         │    │  │ (service-role key)    │  │
   └───────┬────────┘    │  └───────────────────────┘  │
           │             │  ┌───────────────────────┐  │
           │             │  │ Zoho SMTP (mailer.ts) │──┼──► Zoho Mail
           │             │  └───────────────────────┘  │
           │             └─────────────────────────────┘
           ▼
   PostgreSQL (managed by Supabase)
```

**Key principles:**
- The browser **never** holds the service‑role key — only the API server does.
- Customer reads/writes go directly to Supabase using the **anon key** + Row Level Security policies that confine each user to their own rows.
- Admin operations that need to bypass RLS (list all users, create accounts, change passwords, generate magic links) go through `/jb-api/sb-admin/*`.

---

## 6. Environment variables (`.env`) — full reference

There is no committed `.env` file — Replit injects everything via Replit Secrets. For **local non‑Replit dev** create `.env.local` files at:
- `artifacts/jb-jewellery/.env.local`
- `artifacts/api-server/.env.local`

### Frontend (`artifacts/jb-jewellery/.env.local`)
```env
# --- Provided automatically on Replit ---
PORT=5000
BASE_PATH=/

# --- Supabase (public, safe in frontend) ---
VITE_SUPABASE_URL=https://glpsidmtigfepgowliia.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key-here

# --- Admin gate (used by AdminAuthContext + adminApi headers) ---
VITE_ADMIN_EMAIL=amritabiswas7432@gmail.com
VITE_ADMIN_NAME=Admin
VITE_ADMIN_PASSWORD=admin123          # CHANGE THIS in production

# --- Optional: WhatsApp helper ---
VITE_WHATSAPP_NUMBER=919999999999
```

### Backend (`artifacts/api-server/.env.local`)
```env
PORT=8080
NODE_ENV=development

# --- Supabase ---
SUPABASE_URL=https://glpsidmtigfepgowliia.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-SERVICE-ROLE-key (SECRET)

# Fallbacks (server reads either set of names)
VITE_SUPABASE_URL=https://glpsidmtigfepgowliia.supabase.co

# --- Admin token shared with frontend ---
ADMIN_PASSWORD=admin123                # OR reuse VITE_ADMIN_PASSWORD

# --- Zoho Mail (transactional) ---
ZOHO_EMAIL=manish@grafxcore.in
ZOHO_APP_PASSWORD=********             # Zoho app-specific password (SECRET)
ZOHO_HOST=smtp.zoho.in                 # smtp.zoho.com for global; smtp.zoho.in for India
ZOHO_PORT=465
ZOHO_FROM_NAME=JB Jewellery Collection

# --- Admin notification recipient ---
ADMIN_EMAIL=amritabiswas7432@gmail.com

# --- Optional legacy DB ---
DATABASE_URL=postgresql://...          # Auto-provided on Replit
JWT_SECRET=replace-with-long-random-string
```

> **Never commit `.env.local` to git.** Add it to `.gitignore`.

---

## 7. Replit Secrets — what to set and where

On Replit, secrets are managed in the **Secrets tab** (lock icon in the left sidebar). Anything set there is exposed as `process.env.NAME` to every workflow.

### Required secrets (set these in Replit Secrets)
| Secret name | Where it's used | Notes |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | api-server | **Highly sensitive.** Get from Supabase → Project Settings → API → `service_role` key. |
| `ZOHO_APP_PASSWORD` | api-server (mailer) | Generate in Zoho → Account → Security → App Passwords. **Not** your normal Zoho login password. |
| `VITE_SUPABASE_URL` | both | Public Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | both | Public anon key — safe in browser. |
| `VITE_ADMIN_PASSWORD` | both | Admin login password and `x-admin-token` value. **Change from default `admin123`.** |
| `VITE_ADMIN_EMAIL` | frontend | Admin login email (default: `amritabiswas7432@gmail.com`). |
| `ZOHO_EMAIL` | api-server | Sender mailbox (e.g. `manish@grafxcore.in`). |
| `ADMIN_EMAIL` | api-server | Where new‑order alert emails are sent. |
| `ZOHO_HOST`, `ZOHO_PORT` | api-server | `smtp.zoho.in` / `465` for India region. |

### Currently configured in this Replit
- ✅ `SUPABASE_SERVICE_ROLE_KEY` — already added
- ✅ `ZOHO_APP_PASSWORD` — already added
- ✅ Auto-provided: `DATABASE_URL`, `PORT`, `BASE_PATH`, `REPL_ID`, `REPLIT_DEV_DOMAIN`

### How to add a new secret
1. Click **🔒 Secrets** in the left sidebar.
2. Key = the variable name (e.g. `ZOHO_APP_PASSWORD`).
3. Value = paste the secret value.
4. Click **Add Secret**.
5. Restart the relevant workflow (api-server or web) so it picks up the new env.

> ⚠️ **Security:** Never paste secret *values* into code, comments, README, or chat. The names listed above are safe to share — the values must stay in Replit Secrets only.

---

## 8. Supabase — A to Z setup guide

### A. Create a project
1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Name: `jb-jewellery` · Region: closest to your customers (e.g. Mumbai for India).
3. Set a strong **Database Password** and save it.
4. Wait ~2 minutes for provisioning.

### B. Grab your keys
**Project Settings → API**:
- **Project URL** → set as `VITE_SUPABASE_URL` and `SUPABASE_URL`.
- **`anon` public key** → set as `VITE_SUPABASE_ANON_KEY`.
- **`service_role` secret key** → set as `SUPABASE_SERVICE_ROLE_KEY` (server only, never in browser code).

### C. Configure Auth
**Authentication → Providers → Email**:
- ✅ Enable **Email + Password**.
- For development, you can disable **Confirm email** so signups log in instantly.
- For production, leave email confirmation **enabled** and configure SMTP under **Authentication → Settings → SMTP** (you can reuse Zoho).

**Authentication → URL Configuration**:
- **Site URL:** your production domain (or your `*.replit.app` URL).
- **Redirect URLs:** add `http://localhost:5000/*` and your production URL with `/*`.

### D. Run the SQL
Open **SQL Editor → New query**, paste everything from [Section 9](#9-database-schema-full-sql), click **Run**.

### E. Create storage buckets
See [Section 10](#10-storage-buckets-product-images).

### F. Test
1. Restart Replit workflows.
2. On the storefront, click **Sign Up** → fill name/email/phone/password + optional address → submit.
3. In Supabase **Authentication → Users**, verify the user appears.
4. In **Table Editor → profiles** and **addresses**, verify rows exist.
5. In the admin panel `/admin → Customers`, the user shows up with their address pill.

---

## 9. Database schema (full SQL)

Paste this **entire block** into Supabase SQL Editor and run.

```sql
-- =========================================================================
-- 0. Helpers
-- =========================================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- =========================================================================
-- 1. PROFILES — extends auth.users with display info + role
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'user',           -- 'user' | 'admin'
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create a profile when a new auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

drop policy if exists "Profiles: read own" on public.profiles;
create policy "Profiles: read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Profiles: update own" on public.profiles;
create policy "Profiles: update own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Profiles: insert own" on public.profiles;
create policy "Profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- =========================================================================
-- 2. ADDRESSES — delivery addresses per user
-- =========================================================================
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  pincode text not null,
  country text default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists addresses_user_id_idx on public.addresses(user_id);

drop trigger if exists addresses_updated_at on public.addresses;
create trigger addresses_updated_at
  before update on public.addresses
  for each row execute function public.handle_updated_at();

-- One default per user
create or replace function public.unset_other_default_addresses()
returns trigger language plpgsql as $$
begin
  if new.is_default then
    update public.addresses
       set is_default = false
     where user_id = new.user_id
       and id <> new.id
       and is_default = true;
  end if;
  return new;
end; $$;

drop trigger if exists addresses_single_default on public.addresses;
create trigger addresses_single_default
  after insert or update of is_default on public.addresses
  for each row execute function public.unset_other_default_addresses();

alter table public.addresses enable row level security;
drop policy if exists "Addresses: own select" on public.addresses;
create policy "Addresses: own select" on public.addresses
  for select using (auth.uid() = user_id);
drop policy if exists "Addresses: own insert" on public.addresses;
create policy "Addresses: own insert" on public.addresses
  for insert with check (auth.uid() = user_id);
drop policy if exists "Addresses: own update" on public.addresses;
create policy "Addresses: own update" on public.addresses
  for update using (auth.uid() = user_id);
drop policy if exists "Addresses: own delete" on public.addresses;
create policy "Addresses: own delete" on public.addresses
  for delete using (auth.uid() = user_id);

-- =========================================================================
-- 3. PRODUCTS
-- =========================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  mrp numeric(10,2),
  stock integer not null default 0,
  category text,
  tags text[] default '{}',
  images jsonb default '[]'::jsonb,
  is_featured boolean default false,
  is_new boolean default false,
  rating numeric(3,2) default 0,
  rating_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category);
create index if not exists products_featured_idx on public.products(is_featured);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

alter table public.products enable row level security;
drop policy if exists "Products: public read" on public.products;
create policy "Products: public read" on public.products
  for select using (true);   -- products are public

-- =========================================================================
-- 4. ORDERS
-- =========================================================================
create table if not exists public.orders (
  id text primary key,                          -- e.g. JB-2026-0001
  user_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  customer_name text,
  customer_phone text,
  items jsonb not null,                         -- [{product_id, name, qty, price}]
  subtotal numeric(10,2) not null,
  discount numeric(10,2) default 0,
  shipping numeric(10,2) default 0,
  tax numeric(10,2) default 0,
  grand_total numeric(10,2) not null,
  coupon_code text,
  shipping_address jsonb,
  status text not null default 'received',       -- received | confirmed | shipped | delivered | cancelled
  tracking_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

alter table public.orders enable row level security;
drop policy if exists "Orders: own read" on public.orders;
create policy "Orders: own read" on public.orders
  for select using (auth.uid() = user_id);
drop policy if exists "Orders: own insert" on public.orders;
create policy "Orders: own insert" on public.orders
  for insert with check (auth.uid() = user_id);

-- =========================================================================
-- 5. REVIEWS
-- =========================================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_product_idx on public.reviews(product_id);

alter table public.reviews enable row level security;
drop policy if exists "Reviews: public read" on public.reviews;
create policy "Reviews: public read" on public.reviews
  for select using (true);
drop policy if exists "Reviews: own write" on public.reviews;
create policy "Reviews: own write" on public.reviews
  for insert with check (auth.uid() = user_id);
drop policy if exists "Reviews: own update" on public.reviews;
create policy "Reviews: own update" on public.reviews
  for update using (auth.uid() = user_id);
drop policy if exists "Reviews: own delete" on public.reviews;
create policy "Reviews: own delete" on public.reviews
  for delete using (auth.uid() = user_id);

-- =========================================================================
-- 6. COUPONS
-- =========================================================================
create table if not exists public.coupons (
  code text primary key,
  type text not null check (type in ('flat','percent')),
  value numeric(10,2) not null,
  min_order numeric(10,2) default 0,
  max_discount numeric(10,2),
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;
drop policy if exists "Coupons: public read active" on public.coupons;
create policy "Coupons: public read active" on public.coupons
  for select using (is_active = true);

-- Seed sample coupons
insert into public.coupons (code, type, value, min_order) values
  ('JBFIRST', 'percent', 10, 0),
  ('FLAT100', 'flat', 100, 500),
  ('WELCOME20', 'percent', 20, 999)
on conflict (code) do nothing;

-- =========================================================================
-- 7. NEWSLETTER SUBSCRIBERS
-- =========================================================================
create table if not exists public.subscribers (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;
drop policy if exists "Subscribers: public insert" on public.subscribers;
create policy "Subscribers: public insert" on public.subscribers
  for insert with check (true);
```

> The **service-role key** (used by the api-server) **bypasses every RLS policy**, so the admin sees and can modify everything.

---

## 10. Storage buckets (product images)

In Supabase **Storage → New bucket**, create:

| Bucket | Public | Purpose |
|---|---|---|
| `products` | ✅ Yes | Product photos referenced by `products.images` |
| `avatars` | ✅ Yes | User avatars (optional) |
| `invoices` | ❌ No | Generated PDFs (optional) |

For each public bucket, add a public read policy:
```sql
-- Run in SQL Editor (replace 'products' for each bucket)
create policy "Public read products"
  on storage.objects for select
  using (bucket_id = 'products');

create policy "Authenticated upload products"
  on storage.objects for insert
  with check (bucket_id = 'products' and auth.role() = 'authenticated');
```

---

## 11. Zoho Mail setup (transactional emails)

The api-server uses **nodemailer** + Zoho SMTP to send 7 themed (gold #FFD700 / dark) HTML emails:

1. Order received (to customer)
2. Admin alert (new order)
3. Order confirmed
4. Order shipped (with tracking)
5. Order delivered
6. New arrival announcement
7. Restock notification

### Setup steps
1. Create / log into your Zoho Mail account using your domain mailbox (e.g. `manish@grafxcore.in`).
2. Go to **Zoho Account → Security → App Passwords**.
3. Click **Generate New Password** → name it "JB Jewellery API" → copy the 16‑char password.
4. In **Replit Secrets**, set:
   - `ZOHO_EMAIL` = your full mailbox address
   - `ZOHO_APP_PASSWORD` = the 16‑char app password
   - `ZOHO_HOST` = `smtp.zoho.in` (India) or `smtp.zoho.com` (global)
   - `ZOHO_PORT` = `465`
   - `ADMIN_EMAIL` = where order alerts go
5. Restart the **api-server** workflow.

### Verify
Place a test order — you should receive **two emails** (one to the customer, one to the admin) within seconds.

---

## 12. Admin panel guide

Open `/admin` and log in:
- **Email:** value of `VITE_ADMIN_EMAIL` (default `amritabiswas7432@gmail.com`)
- **Password:** value of `VITE_ADMIN_PASSWORD` (default `admin123` — **change this!**)

### Customers page (`/admin/customers`)
| Action | Button | Result |
|---|---|---|
| Create account | "Create Account" (top right) | Modal: email + password (min 6) + name + phone + optional address → creates Supabase user (auto‑verified), profile row, address row. |
| View addresses | Click address pill in row | Side drawer with all addresses, default badge, contact info, last login. |
| Login as user | 🔵 Login icon | Generates a Supabase magic link — opening it logs **your browser** in as that customer (your admin session is replaced — log out & back in to return). Or "Copy" to share. |
| Change password | 🟡 Key icon | Sets new password (min 6). Instant, no email sent. |
| Delete account | 🔴 Trash icon | Permanent — cascades and removes profile + addresses. |
| Search | top search bar | Filters by name, email, or phone. |

### Other admin pages
- **Dashboard** — Recharts overview (orders, revenue, products).
- **Orders** — All orders, status timeline, mark confirmed/shipped/delivered (triggers emails).
- **Products** — CRUD with image upload to the `products` Supabase bucket.
- **Coupons** — Create/edit coupon codes (saved to `public.coupons`).

---

## 13. Customer flow guide

1. **Browse** `/products` — filter by category, price, vibe.
2. **Add to cart** — persists in `localStorage` (`jb-cart`).
3. **Sign up / log in** via the Auth modal. Signup form has an **optional address section** that's saved on submit.
4. **Checkout** (`/checkout`):
   - Step 1: Pick or add address.
   - Step 2: Apply coupon, review totals (5% tax, free shipping ≥ ₹399).
   - Step 3: Confirm → order saved to Supabase, both emails sent, optional WhatsApp deep-link.
5. **My Orders** (`/my-orders`) — full history, status timeline, **Download PDF Invoice**, WhatsApp support shortcut.
6. **Profile** (`/profile`) — edit info, manage addresses, see reviews.

---

## 14. Local development & running

### One-time setup
```bash
pnpm install
```

### Run all three workflows on Replit
They're already configured. Use the **Workflows panel** to start/restart:
- `artifacts/jb-jewellery: web`
- `artifacts/api-server: API Server`
- `artifacts/mockup-sandbox: Component Preview Server`

### Run individually from terminal
```bash
# Storefront (port from $PORT)
pnpm --filter @workspace/jb-jewellery run dev

# API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Type-check the entire monorepo
pnpm run typecheck
```

### Access points
- Storefront: opens automatically in the Replit preview pane
- API health check: `https://<your-repl-domain>/jb-api/health`
- Admin panel: append `/admin` to the storefront URL

---

## 15. Deployment / publishing

1. In Replit, click **Publish** (top right).
2. Choose **Autoscale** deployment for the storefront.
3. Confirm all required Secrets are present (Section 7).
4. After publish, get a `*.replit.app` URL.
5. In Supabase **Auth → URL Configuration**, add the production URL to **Site URL** + **Redirect URLs**.
6. Update `VITE_ADMIN_PASSWORD` to a strong value before going live.

---

## 16. Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:8080` in Vite logs | api-server not running yet | Restart the **API Server** workflow. |
| Admin endpoints return `401 Unauthorized admin` | Wrong/missing `x-admin-token` | Make sure `VITE_ADMIN_PASSWORD` is set in both web and api-server, and that they match. |
| Admin endpoints return `500 Supabase admin not configured` | Missing service-role key on server | Add `SUPABASE_SERVICE_ROLE_KEY` to Replit Secrets, restart api-server. |
| Signup fails with "duplicate key" on profiles | Old trigger conflict | Re-run the **profiles** SQL block — it's idempotent. |
| Customer can't see their addresses | RLS not enabled / policies missing | Re-run **addresses** SQL block. |
| Emails not sending | Wrong Zoho host / app password | Check `ZOHO_HOST` (`smtp.zoho.in` for India) and regenerate the app password. |
| "Login as" link does nothing | Supabase Site URL not configured | Add your storefront URL to Supabase Auth → URL Configuration. |
| Image proxy 404 | Bucket isn't public | Re-create the bucket as public, or add the public-read SQL policy from Section 10. |

---

## 17. File-by-file map

### Frontend critical files
| File | What it does |
|---|---|
| `src/lib/supabase.ts` | Creates the Supabase client with hybrid `localStorage`/`sessionStorage` for "Remember Me". |
| `src/lib/adminApi.ts` | Wraps `fetch('/jb-api/sb-admin/...')` and adds the `x-admin-token` header. |
| `src/context/AuthContext.tsx` | Customer auth (signup with optional address, login, logout, reset). |
| `src/context/AdminAuthContext.tsx` | Admin password-gated session, stored in local/session storage. |
| `src/components/auth/AuthModal.tsx` | Login + Signup-with-address + Forgot password UI. |
| `src/pages/admin/AdminCustomers.tsx` | The Supabase-backed Customers admin page (Create / Login as / Set password / Delete / View addresses). |
| `vite.config.ts` | Configures the `/jb-api` → `localhost:8080` proxy. |

### Backend critical files
| File | What it does |
|---|---|
| `src/lib/supabaseAdmin.ts` | Service-role Supabase client — never exposed to browser. |
| `src/lib/auth.ts` | `simpleAdminMiddleware` validates the `x-admin-token` header. |
| `src/routes/admin-supabase.ts` | All `/sb-admin/*` endpoints (customers CRUD + login-link). |
| `src/lib/mailer.ts` | All 7 themed HTML emails + Zoho SMTP transport. |
| `src/routes/orders.ts` | Order CRUD + triggers customer/admin emails on status changes. |

---

## Credits

**Made by Manish** · April 2026
Built with React, Supabase, Express, and a lot of attention to detail. ✨
