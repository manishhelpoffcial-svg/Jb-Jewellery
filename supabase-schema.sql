t exists (select 1 from pg_policies where tablename='products' and policyname='Service role full access products') then
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
