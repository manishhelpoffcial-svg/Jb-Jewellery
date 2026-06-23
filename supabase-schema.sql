-- ============================================================
-- JB Jewellery — Complete Supabase Schema
-- Run this in your Supabase project → SQL Editor → New Query
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
create policy "Users can read own profile"  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Service role full access"     on public.profiles using (true) with check (true);

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
create policy "Users manage own addresses" on public.addresses using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Service role full access"   on public.addresses using (true) with check (true);

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
create policy "Public read categories"  on public.categories for select using (true);
create policy "Service role full access" on public.categories using (true) with check (true);

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
  created_at     timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "Public read products"    on public.products for select using (true);
create policy "Service role full access" on public.products using (true) with check (true);

-- 5. PRODUCT_CATEGORIES (many-to-many)
create table if not exists public.product_categories (
  category_id  uuid not null references public.categories(id) on delete cascade,
  product_id   text not null references public.products(id) on delete cascade,
  sort_order   integer default 0,
  primary key (category_id, product_id)
);
alter table public.product_categories enable row level security;
create policy "Public read product_categories"  on public.product_categories for select using (true);
create policy "Service role full access"         on public.product_categories using (true) with check (true);

-- 6. ORDERS
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
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
  created_at       timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "Users read own orders"   on public.orders for select using (auth.uid() = user_id);
create policy "Users insert own orders" on public.orders for insert with check (auth.uid() = user_id or user_id is null);
create policy "Service role full access" on public.orders using (true) with check (true);

-- 7. COUPONS
create table if not exists public.coupons (
  code          text primary key,
  type          text not null default 'percentage',  -- percentage | fixed
  value         numeric(10,2) not null,
  min_order     numeric(10,2) default 0,
  max_discount  numeric(10,2),
  expiry        timestamptz,
  usage_limit   integer,
  used_count    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
alter table public.coupons enable row level security;
create policy "Public read active coupons" on public.coupons for select using (is_active = true);
create policy "Service role full access"    on public.coupons using (true) with check (true);

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
  images            jsonb default '[]',
  source            text default 'customer',  -- customer | admin
  is_verified       boolean default false,
  is_visible        boolean default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.product_reviews enable row level security;
create policy "Public read visible reviews" on public.product_reviews for select using (is_visible = true);
create policy "Users insert own reviews"    on public.product_reviews for insert with check (auth.uid() = user_id or user_id is null);
create policy "Service role full access"    on public.product_reviews using (true) with check (true);

-- 9. SITE_SETTINGS
create table if not exists public.site_settings (
  key        text primary key,
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
create policy "Public read site_settings"  on public.site_settings for select using (true);
create policy "Service role full access"   on public.site_settings using (true) with check (true);

-- Seed default settings row
insert into public.site_settings (key, data)
values ('global', '{"storeName":"JB Jewellery","currency":"INR","supportEmail":"","supportPhone":"","shippingFee":0,"freeShippingAbove":0}')
on conflict (key) do nothing;

-- 10. Storage bucket for invoice PDFs
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true)
on conflict (id) do nothing;

create policy "Public read invoices"  on storage.objects for select using (bucket_id = 'invoices');
create policy "Service role upload invoices" on storage.objects for insert with check (bucket_id = 'invoices');
create policy "Service role update invoices" on storage.objects for update using (bucket_id = 'invoices');
create policy "Service role delete invoices" on storage.objects for delete using (bucket_id = 'invoices');
