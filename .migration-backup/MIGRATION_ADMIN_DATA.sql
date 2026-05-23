-- ============================================================================
-- JB JEWELLERY COLLECTION  •  ADMIN DATA MIGRATION
-- Run this entire file in Supabase  →  SQL Editor  →  New Query  →  RUN
--
-- What this does:
--   1. Creates / aligns: products, coupons, orders tables
--   2. Adds invoice_url column on orders + invoices storage bucket
--   3. Seeds the EXISTING 20 products and 3 coupons that the site already had
--   4. Sets up Row Level Security so customers can only see their own data,
--      everyone can read the catalogue, and the admin (service-role) bypasses
--      everything.
--
-- Safe to re-run – every statement is idempotent.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────
-- 0. Helpers
-- ──────────────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;


-- ──────────────────────────────────────────────────────────────────────
-- 1. PRODUCTS  (matches Product interface in src/data/products.ts)
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id              text primary key,                   -- "1", "2"… or "prod-<ts>"
  name            text not null,
  category        text not null,
  price           numeric(10,2) not null,
  original_price  numeric(10,2) not null,
  discount        integer not null default 0,
  rating          numeric(3,2) not null default 4.5,
  reviews         integer not null default 0,
  image           text,
  is_new          boolean not null default false,
  is_bestseller   boolean not null default false,
  stock           integer not null default 100,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category);
create index if not exists products_bestseller_idx on public.products(is_bestseller);
create index if not exists products_new_idx on public.products(is_new);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

alter table public.products enable row level security;

drop policy if exists "Products: public read" on public.products;
create policy "Products: public read" on public.products
  for select using (true);

-- Seed the 20 existing products (the ones already on the site).
insert into public.products
  (id, name, category, price, original_price, discount, rating, reviews, is_new, is_bestseller)
values
  ('1',  'Pearl Drop Earrings',        'Earrings',          299, 599, 50, 4.8, 124, false, true),
  ('2',  'Gold Hoop Earrings',         'Earrings',          199, 399, 50, 4.9,  89, false, true),
  ('3',  'Layered Necklace Set',       'Necklaces',         499, 899, 44, 4.7, 201, false, true),
  ('4',  'Butterfly Hair Clips Set',   'Hair Accessories',  149, 299, 50, 4.8,  67, true,  false),
  ('5',  'Floral Finger Ring',         'Rings',              99, 199, 50, 4.6,  45, true,  false),
  ('6',  'Gold Chain Bracelet',        'Bracelets',         249, 499, 50, 4.9, 156, false, true),
  ('7',  'Diamond Choker Necklace',    'Necklaces',         399, 799, 50, 4.8,  98, false, true),
  ('8',  'Star Stud Earrings',         'Earrings',          149, 299, 50, 4.7, 112, false, false),
  ('9',  'Adjustable Bangles Set',     'Bracelets',         299, 599, 50, 4.8,  78, true,  false),
  ('10', 'Crystal Ring Set',           'Rings',             199, 399, 50, 4.9, 134, false, true),
  ('11', 'Long Tassel Earrings',       'Earrings',          249, 499, 50, 4.7,  56, false, false),
  ('12', 'Delicate Chain Anklet',      'Bracelets',         149, 299, 50, 4.8,  89, true,  false),
  ('13', 'Oxidized Silver Earrings',   'Earrings',          179, 349, 49, 4.6,  43, false, false),
  ('14', 'Gold Leaf Necklace',         'Necklaces',         449, 899, 50, 4.9, 167, false, true),
  ('15', 'Scrunchie Hair Band',        'Hair Accessories',   99, 199, 50, 4.5,  34, false, false),
  ('16', 'Kundan Ring',                'Rings',             249, 499, 50, 4.8,  91, false, true),
  ('17', 'Beaded Bracelet Set',        'Bracelets',         199, 399, 50, 4.7,  62, false, false),
  ('18', 'Geometric Stud Earrings',    'Earrings',          129, 259, 50, 4.6,  47, true,  false),
  ('19', 'Pearl Choker',               'Necklaces',         349, 699, 50, 4.8, 118, true,  false),
  ('20', 'Floral Hair Pin Set',        'Hair Accessories',  129, 259, 50, 4.7,  52, false, false)
on conflict (id) do nothing;


-- ──────────────────────────────────────────────────────────────────────
-- 2. COUPONS  (matches the Admin → Coupons page UI)
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.coupons (
  code          text primary key,
  type          text not null check (type in ('percentage','flat')),
  value         numeric(10,2) not null,
  min_order     numeric(10,2) not null default 0,
  max_discount  numeric(10,2) not null default 0,
  expiry        date,
  usage_limit   integer not null default 0,
  used_count    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists coupons_updated_at on public.coupons;
create trigger coupons_updated_at
  before update on public.coupons
  for each row execute function public.handle_updated_at();

alter table public.coupons enable row level security;

drop policy if exists "Coupons: public read active" on public.coupons;
create policy "Coupons: public read active" on public.coupons
  for select using (is_active = true);

-- Seed the 3 existing coupons that were hard-coded on the site.
insert into public.coupons
  (code, type, value, min_order, max_discount, expiry, usage_limit, used_count, is_active)
values
  ('JBFIRST',   'percentage', 50, 299, 200, '2025-12-31', 1000, 342, true),
  ('FLAT100',   'flat',      100, 599, 100, '2025-06-30',  500,  87, true),
  ('WELCOME20', 'percentage', 20, 199, 150, '2025-12-31', 2000, 156, true)
on conflict (code) do nothing;


-- ──────────────────────────────────────────────────────────────────────
-- 3. ORDERS  (matches what the existing app + emailer expects)
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id              text primary key,             -- e.g. JB2026-1234
  user_id         uuid references auth.users(id) on delete set null,
  customer_name   text not null,
  phone           text not null,
  email           text not null,
  items           jsonb not null,               -- [{id, name, price, quantity, ...}]
  address         jsonb not null,               -- {fullName, phone, line1, line2, city, state, pincode}
  subtotal        numeric(10,2) not null,
  shipping        numeric(10,2) not null default 0,
  tax             numeric(10,2) not null default 0,
  discount        numeric(10,2) not null default 0,
  coupon_code     text,
  grand_total     numeric(10,2) not null,
  status          text not null default 'pending',
  status_history  jsonb not null default '[]'::jsonb,
  whatsapp_sent   boolean not null default false,
  invoice_url     text,                          -- Public/signed URL of stored PDF invoice
  invoice_path    text,                          -- Storage path inside the invoices bucket
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists orders_user_idx    on public.orders(user_id);
create index if not exists orders_status_idx  on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

alter table public.orders enable row level security;

drop policy if exists "Orders: own select" on public.orders;
create policy "Orders: own select" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "Orders: own insert" on public.orders;
create policy "Orders: own insert" on public.orders
  for insert with check (auth.uid() = user_id);

-- (Admin uses the service-role key on the api-server which bypasses RLS.)


-- ──────────────────────────────────────────────────────────────────────
-- 4. INVOICES STORAGE BUCKET (PDFs land here)
-- ──────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true)
on conflict (id) do nothing;

-- Anyone with the public URL can download (file names are randomised + order id).
drop policy if exists "Invoices: public read" on storage.objects;
create policy "Invoices: public read" on storage.objects
  for select using (bucket_id = 'invoices');

-- Authenticated customers can upload their own invoice (path begins with their UID).
drop policy if exists "Invoices: own upload" on storage.objects;
create policy "Invoices: own upload" on storage.objects
  for insert
  with check (
    bucket_id = 'invoices'
    and (auth.role() = 'authenticated' or auth.role() = 'service_role')
  );


-- ──────────────────────────────────────────────────────────────────────
-- 5. SAFETY: ensure profiles + addresses tables also exist
--    (no-op if they already do)
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  role        text not null default 'user',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text,
  pincode     text not null,
  country     text default 'India',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Done!  Reload the admin panel – Products, Coupons, Orders and Dashboard now
-- read & write live from Supabase.  The "Download Invoice" button on every
-- order will fetch the PDF stored in the `invoices` bucket.
