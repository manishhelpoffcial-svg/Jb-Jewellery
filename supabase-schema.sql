-- ============================================================
-- JB Jewellery — Complete Supabase Schema
-- Run this in your Supabase project → SQL Editor → New Query
-- Safe to re-run: all statements use IF NOT EXISTS / DO NOTHING
-- ============================================================

-- 1. PROFILES (mirrors auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  role        text not null default 'user',
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can read own profile') then
    create policy "Users can read own profile"  on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can update own profile') then
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Service role full access profiles') then
    create policy "Service role full access profiles" on public.profiles using (true) with check (true);
  end if;
end $$;

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. ADDRESSES
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
  created_at  timestamptz not null default now()
);
alter table public.addresses enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='addresses' and policyname='Users manage own addresses') then
    create policy "Users manage own addresses" on public.addresses using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='addresses' and policyname='Service role full access addresses') then
    create policy "Service role full access addresses" on public.addresses using (true) with check (true);
  end if;
end $$;

-- 3. CATEGORIES
create table if not exists public.categories (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  name             text not null,
  type             text not null default 'main',  -- main | vibe | price | combo
  image            text,
  subtitle         text,
  description      text,
  product_category text,
  max_price        numeric(10,2),
  combo_count      integer,
  combo_price      numeric(10,2),
  combo_extra      text,
  is_visible       boolean not null default true,
  sort_order       integer not null default 0,
  updated_at       timestamptz not null default now()
);
alter table public.categories enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='categories' and policyname='Public read categories') then
    create policy "Public read categories"  on public.categories for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='categories' and policyname='Service role full access categories') then
    create policy "Service role full access categories" on public.categories using (true) with check (true);
  end if;
end $$;

-- 4. PRODUCTS
create table if not exists public.products (
  id             text primary key default gen_random_uuid()::text,
  name           text not null,
  category       text,
  price          numeric(10,2) not null,
  original_price numeric(10,2),
  discount       numeric(5,2) default 0,
  rating         numeric(3,2) default 0,
  reviews        integer default 0,
  image          text,
  images         jsonb default '[]',
  is_new         boolean default false,
  is_bestseller  boolean default false,
  stock          integer default 100,
  description    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
-- Add updated_at if upgrading from an older schema that didn't have it
alter table public.products add column if not exists updated_at timestamptz not null default now();
-- Add images if upgrading from an older schema
alter table public.products add column if not exists images jsonb default '[]';

alter table public.products enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='products' and policyname='Public read products') then
    create policy "Public read products"    on public.products for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='products' and policyname='Service role full access products') then
    create policy "Service role full access products" on public.products using (true) with check (true);
  end if;
end $$;

-- 5. PRODUCT_CATEGORIES (many-to-many)
create table if not exists public.product_categories (
  category_id  uuid not null references public.categories(id) on delete cascade,
  product_id   text not null references public.products(id) on delete cascade,
  sort_order   integer default 0,
  primary key (category_id, product_id)
);
alter table public.product_categories enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='product_categories' and policyname='Public read product_categories') then
    create policy "Public read product_categories"  on public.product_categories for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='product_categories' and policyname='Service role full access product_categories') then
    create policy "Service role full access product_categories" on public.product_categories using (true) with check (true);
  end if;
end $$;

-- 6. ORDERS
create table if not exists public.orders (
  id               text primary key default gen_random_uuid()::text,
  user_id          uuid references auth.users(id) on delete set null,
  customer_name    text,
  email            text,
  phone            text,
  items            jsonb not null default '[]',
  address          jsonb,
  subtotal         numeric(10,2) default 0,
  shipping         numeric(10,2) default 0,
  tax              numeric(10,2) default 0,
  discount         numeric(10,2) default 0,
  coupon_code      text,
  grand_total      numeric(10,2) default 0,
  status           text not null default 'pending',
  status_history   jsonb default '[]',
  tracking_number  text,
  invoice_url      text,
  invoice_path     text,
  whatsapp_sent    boolean default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
-- Add updated_at and tracking_number if upgrading from an older schema
alter table public.orders add column if not exists updated_at     timestamptz not null default now();
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists invoice_path    text;
-- Fix id type if older schema used uuid (text id allows the JB2024-XXXX format)
-- Note: if you get a type error on orders.id, you may need to recreate the table.

alter table public.orders enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='orders' and policyname='Users read own orders') then
    create policy "Users read own orders"   on public.orders for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='orders' and policyname='Users insert own orders') then
    create policy "Users insert own orders" on public.orders for insert with check (auth.uid() = user_id or user_id is null);
  end if;
  if not exists (select 1 from pg_policies where tablename='orders' and policyname='Service role full access orders') then
    create policy "Service role full access orders" on public.orders using (true) with check (true);
  end if;
end $$;

-- 7. COUPONS
create table if not exists public.coupons (
  code          text primary key,
  type          text not null default 'percentage',  -- percentage | flat
  value         numeric(10,2) not null,
  min_order     numeric(10,2) default 0,
  max_discount  numeric(10,2),
  expiry        timestamptz,
  usage_limit   integer,
  used_count    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.coupons add column if not exists updated_at timestamptz not null default now();
alter table public.coupons enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='coupons' and policyname='Public read active coupons') then
    create policy "Public read active coupons" on public.coupons for select using (is_active = true);
  end if;
  if not exists (select 1 from pg_policies where tablename='coupons' and policyname='Service role full access coupons') then
    create policy "Service role full access coupons" on public.coupons using (true) with check (true);
  end if;
end $$;

-- 8. PRODUCT_REVIEWS
create table if not exists public.product_reviews (
  id                uuid primary key default gen_random_uuid(),
  product_id        text references public.products(id) on delete cascade,
  product_name      text,
  user_id           uuid references auth.users(id) on delete set null,
  customer_name     text,
  customer_initial  text,
  rating            integer not null check (rating between 1 and 5),
  review_text       text,
  images            jsonb not null default '[]',
  source            text default 'customer',  -- customer | admin
  is_verified       boolean default false,
  is_visible        boolean default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
-- Ensure images is never null in existing rows
update public.product_reviews set images = '[]' where images is null;
alter table public.product_reviews alter column images set not null;
alter table public.product_reviews alter column images set default '[]';

alter table public.product_reviews enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='product_reviews' and policyname='Public read visible reviews') then
    create policy "Public read visible reviews" on public.product_reviews for select using (is_visible = true);
  end if;
  if not exists (select 1 from pg_policies where tablename='product_reviews' and policyname='Users insert own reviews') then
    create policy "Users insert own reviews"    on public.product_reviews for insert with check (auth.uid() = user_id or user_id is null);
  end if;
  if not exists (select 1 from pg_policies where tablename='product_reviews' and policyname='Service role full access reviews') then
    create policy "Service role full access reviews" on public.product_reviews using (true) with check (true);
  end if;
end $$;

-- 9. SITE_SETTINGS
create table if not exists public.site_settings (
  key        text primary key,
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='site_settings' and policyname='Public read site_settings') then
    create policy "Public read site_settings"  on public.site_settings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='site_settings' and policyname='Service role full access site_settings') then
    create policy "Service role full access site_settings" on public.site_settings using (true) with check (true);
  end if;
end $$;

-- Seed default settings row
insert into public.site_settings (key, data)
values ('global', '{"storeName":"JB Jewellery","currency":"INR","supportEmail":"","supportPhone":"","shippingFee":0,"freeShippingAbove":0}')
on conflict (key) do nothing;

-- 10. Storage buckets
-- invoices
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true)
on conflict (id) do nothing;

-- product-images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- category-images
insert into storage.buckets (id, name, public)
values ('category-images', 'category-images', true)
on conflict (id) do nothing;

-- Storage policies (idempotent via DO block)
do $$ begin
  -- invoices
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Public read invoices') then
    create policy "Public read invoices" on storage.objects for select using (bucket_id = 'invoices');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Service role upload invoices') then
    create policy "Service role upload invoices" on storage.objects for insert with check (bucket_id = 'invoices');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Service role update invoices') then
    create policy "Service role update invoices" on storage.objects for update using (bucket_id = 'invoices');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Service role delete invoices') then
    create policy "Service role delete invoices" on storage.objects for delete using (bucket_id = 'invoices');
  end if;
  -- product-images
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Public read product images') then
    create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Service role manage product images') then
    create policy "Service role manage product images" on storage.objects for insert with check (bucket_id = 'product-images');
  end if;
  -- category-images
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Public read category images') then
    create policy "Public read category images" on storage.objects for select using (bucket_id = 'category-images');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Service role manage category images') then
    create policy "Service role manage category images" on storage.objects for insert with check (bucket_id = 'category-images');
  end if;
end $$;
