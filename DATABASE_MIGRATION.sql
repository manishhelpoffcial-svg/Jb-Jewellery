-- =============================================================================
-- JB JEWELLERY COLLECTION — Full Database Migration
-- =============================================================================
-- Run this in your NEW Supabase project's SQL Editor (in order):
--   1. SCHEMA  → creates all tables
--   2. RLS     → security policies
--   3. TRIGGER → auto-creates profile on signup
--   4. DATA    → seeds current products, categories, coupons, settings
-- =============================================================================


-- =============================================================================
-- PART 1: SCHEMA
-- =============================================================================

-- Products catalog
CREATE TABLE IF NOT EXISTS public.products (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  category         TEXT,
  price            INTEGER NOT NULL DEFAULT 0,
  original_price   INTEGER DEFAULT 0,
  discount         INTEGER DEFAULT 0,
  rating           NUMERIC(3,1) DEFAULT 0,
  reviews          INTEGER DEFAULT 0,
  image            TEXT,
  images           TEXT[] DEFAULT '{}',
  is_new           BOOLEAN DEFAULT FALSE,
  is_bestseller    BOOLEAN DEFAULT FALSE,
  stock            INTEGER DEFAULT 100,
  description      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Navigation & shop categories
CREATE TABLE IF NOT EXISTS public.categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('main','vibe','price','combo')),
  image            TEXT,
  subtitle         TEXT,
  description      TEXT,
  product_category TEXT,
  max_price        INTEGER,
  combo_count      INTEGER,
  combo_price      INTEGER,
  combo_extra      TEXT,
  is_visible       BOOLEAN DEFAULT TRUE,
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Category ↔ Product junction (for combo/vibe categories)
CREATE TABLE IF NOT EXISTS public.product_categories (
  category_id  UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  product_id   TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (category_id, product_id)
);

-- Discount coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  code         TEXT PRIMARY KEY,
  type         TEXT NOT NULL CHECK (type IN ('percentage','flat')),
  value        NUMERIC NOT NULL,
  min_order    NUMERIC DEFAULT 0,
  max_discount NUMERIC DEFAULT 0,
  expiry       DATE,
  usage_limit  INTEGER DEFAULT 1000,
  used_count   INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Customer orders
CREATE TABLE IF NOT EXISTS public.orders (
  id             TEXT PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id),
  customer_name  TEXT,
  phone          TEXT,
  email          TEXT,
  items          JSONB DEFAULT '[]',
  address        JSONB DEFAULT '{}',
  subtotal       NUMERIC DEFAULT 0,
  shipping       NUMERIC DEFAULT 0,
  tax            NUMERIC DEFAULT 0,
  discount       NUMERIC DEFAULT 0,
  coupon_code    TEXT,
  grand_total    NUMERIC DEFAULT 0,
  status         TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  status_history JSONB DEFAULT '[]',
  whatsapp_sent  BOOLEAN DEFAULT FALSE,
  invoice_url    TEXT,
  invoice_path   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Customer profiles (auto-created on signup via trigger below)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  phone      TEXT,
  role       TEXT DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer delivery addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  phone      TEXT,
  line1      TEXT,
  line2      TEXT,
  city       TEXT,
  state      TEXT,
  pincode    TEXT,
  country    TEXT DEFAULT 'India',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  product_name     TEXT,
  user_id          UUID REFERENCES auth.users(id),
  customer_name    TEXT NOT NULL,
  customer_initial TEXT,
  rating           INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text      TEXT,
  images           TEXT[] DEFAULT '{}',
  is_visible       BOOLEAN DEFAULT TRUE,
  is_verified      BOOLEAN DEFAULT FALSE,
  source           TEXT DEFAULT 'customer' CHECK (source IN ('customer','admin')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Global site settings (single row, key = 'global')
CREATE TABLE IF NOT EXISTS public.site_settings (
  key        TEXT PRIMARY KEY,
  data       JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================================
-- PART 2: ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Profiles: each user sees/edits only their own row
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Addresses: each user manages their own
CREATE POLICY "addresses_select_own" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "addresses_insert_own" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addresses_update_own" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "addresses_delete_own" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- Orders: authenticated users see their own; anon can insert (guest checkout)
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "orders_insert_any" ON public.orders FOR INSERT WITH CHECK (true);

-- Products, categories, coupons — public read (service role writes via API)
CREATE POLICY "products_public_read"    ON public.products        FOR SELECT USING (true);
CREATE POLICY "categories_public_read"  ON public.categories      FOR SELECT USING (true);
CREATE POLICY "coupons_public_read"     ON public.coupons         FOR SELECT USING (true);
CREATE POLICY "reviews_public_read"     ON public.product_reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "settings_public_read"    ON public.site_settings   FOR SELECT USING (true);
CREATE POLICY "prodcat_public_read"     ON public.product_categories FOR SELECT USING (true);

-- Product reviews: authenticated users can submit their own
CREATE POLICY "reviews_insert_auth" ON public.product_reviews FOR INSERT WITH CHECK (true);


-- =============================================================================
-- PART 3: AUTO-CREATE PROFILE TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- PART 4: SEED DATA (current products, categories, coupons)
-- NOTE: Orders and profiles are user-specific — migrate those manually
--       if needed, or let users re-register in the new project.
-- =============================================================================

-- Products (19 items)
INSERT INTO public.products (id, name, category, price, original_price, discount, rating, reviews, image, images, is_new, is_bestseller, stock, description) VALUES
('1',  'Pearl Drop Earrings',       'Earrings',         299, 599, 50, 4.8, 124, NULL, '{}', FALSE, TRUE,  100, NULL),
('2',  'Gold Hoop Earrings',        'Earrings',         199, 399, 50, 4.9,  89, NULL, '{}', FALSE, TRUE,  100, NULL),
('3',  'Layered Necklace Set',      'Necklaces',        499, 899, 44, 4.7, 201, NULL, '{}', FALSE, TRUE,  100, NULL),
('4',  'Butterfly Hair Clips Set',  'Hair Accessories', 149, 299, 50, 4.8,  67, NULL, '{}', TRUE,  FALSE, 100, NULL),
('5',  'Floral Finger Ring',        'Rings',             99, 199, 50, 4.6,  45, NULL, '{}', TRUE,  FALSE, 100, NULL),
('6',  'Gold Chain Bracelet',       'Bracelets',        249, 499, 50, 4.9, 156, NULL, '{}', FALSE, TRUE,  100, NULL),
('7',  'Diamond Choker Necklace',   'Necklaces',        399, 799, 50, 4.8,  98, NULL, '{}', FALSE, TRUE,  100, NULL),
('8',  'Star Stud Earrings',        'Earrings',         149, 299, 50, 4.7, 112, NULL, '{}', FALSE, FALSE, 100, NULL),
('9',  'Adjustable Bangles Set',    'Bracelets',        299, 599, 50, 4.8,  78, NULL, '{}', TRUE,  FALSE, 100, NULL),
('10', 'Crystal Ring Set',          'Rings',            199, 399, 50, 4.9, 134, NULL, '{}', FALSE, TRUE,  100, NULL),
('11', 'Long Tassel Earrings',      'Earrings',         249, 499, 50, 4.7,  56, NULL, '{}', FALSE, FALSE, 100, NULL),
('12', 'Delicate Chain Anklet',     'Bracelets',        149, 299, 50, 4.8,  89, NULL, '{}', TRUE,  FALSE, 100, NULL),
('13', 'Oxidized Silver Earrings',  'Earrings',         179, 349, 49, 4.6,  43, NULL, '{}', FALSE, FALSE, 100, NULL),
('14', 'Gold Leaf Necklace',        'Necklaces',        449, 899, 50, 4.9, 167, NULL, '{}', FALSE, TRUE,  100, NULL),
('15', 'Scrunchie Hair Band',       'Hair Accessories',  99, 199, 50, 4.5,  34, NULL, '{}', FALSE, FALSE, 100, NULL),
('16', 'Kundan Ring',               'Rings',            249, 499, 50, 4.8,  91, NULL, '{}', FALSE, TRUE,  100, NULL),
('17', 'Beaded Bracelet Set',       'Bracelets',        199, 399, 50, 4.7,  62, NULL, '{}', FALSE, FALSE, 100, NULL),
('18', 'Geometric Stud Earrings',   'Earrings',         129, 259, 50, 4.6,  47, NULL, '{}', TRUE,  FALSE, 100, NULL),
('19', 'Pearl Choker',              'Necklaces',        349, 699, 50, 4.8, 118, NULL, '{}', TRUE,  FALSE, 100, NULL)
ON CONFLICT (id) DO NOTHING;

-- Categories (18 items: main, price, vibe, combo)
INSERT INTO public.categories (id, slug, name, type, image, subtitle, product_category, max_price, combo_count, combo_price, combo_extra, is_visible, sort_order) VALUES
('f400632b-728d-43e6-9d2f-619eca36dc12', 'earrings',         'Earrings',         'main',  '/images/earrings.jpeg',         NULL,                         'Earrings',         NULL, NULL, NULL, NULL, TRUE, 10),
('25d7f4b4-454d-4979-89ee-cb42bd3f469a', 'necklaces',        'Necklaces',        'main',  '/images/necklaces.jpeg',        NULL,                         'Necklaces',        NULL, NULL, NULL, NULL, TRUE, 20),
('4a00a70a-af58-487d-a5f6-eb3cb74341b0', 'rings',            'Rings',            'main',  '/images/rings.jpeg',            NULL,                         'Rings',            NULL, NULL, NULL, NULL, TRUE, 30),
('a456bf2e-003f-4897-9663-93491c28a38c', 'bracelets',        'Bracelets',        'main',  '/images/bracelets.jpeg',        NULL,                         'Bracelets',        NULL, NULL, NULL, NULL, TRUE, 40),
('bc61d34b-438b-410e-bcdc-f220276c7460', 'hair-accessories', 'Hair Accessories', 'main',  '/images/hair-accessories.jpeg', NULL,                         'Hair Accessories', NULL, NULL, NULL, NULL, TRUE, 50),
('12d556e7-9124-4c96-9e10-1b7793d9b7b6', 'gift-hampers',     'Gift Hampers',     'main',  '/images/gift-hampers.jpeg',     NULL,                         'Combos',           NULL, NULL, NULL, NULL, TRUE, 60),
('09ca8e96-4d43-409e-bf00-11a2d3769fa8', 'under-99',         'Under ₹99',        'price', '/images/under-99.png',          NULL,                         NULL,                 99, NULL, NULL, NULL, TRUE, 10),
('71c27b40-f1c6-48c8-8166-6f4c79e99108', 'under-199',        'Under ₹199',       'price', '/images/under-199.png',         NULL,                         NULL,                199, NULL, NULL, NULL, TRUE, 20),
('7d9ea5bb-6977-4540-bf35-ed64c0dde11c', 'under-299',        'Under ₹299',       'price', '/images/under-299.png',         NULL,                         NULL,                299, NULL, NULL, NULL, TRUE, 30),
('fb3f8575-8b8e-405e-9ba7-5010d8681b2d', 'under-499',        'Under ₹499',       'price', '/images/under-499.png',         NULL,                         NULL,                499, NULL, NULL, NULL, TRUE, 40),
('6ba381d9-0a2b-407d-8ff9-6673d95bfb5c', 'boss-babe-basic',  'Boss Babe Basic',  'vibe',  '/images/vibe-1.png',            'Power. Poise. Polish.',      NULL,               NULL, NULL, NULL, NULL, TRUE, 10),
('6765c3d6-db9d-4dc8-8a1c-f884994e8e02', 'glam-girl-hours',  'Glam Girl Hours',  'vibe',  '/images/vibe-2.png',            'Sparkle that turns heads.',  NULL,               NULL, NULL, NULL, NULL, TRUE, 20),
('b845ad98-89a0-467e-a365-a8e2f4b1921e', 'everyday-slay',    'Everyday Slay',    'vibe',  '/images/vibe-3.png',            'Light, lovely, all-day pretty.', NULL,            NULL, NULL, NULL, NULL, TRUE, 30),
('2be967df-1ae7-444d-9dd9-5b45c1914930', 'campus-girl',      'Campus Girl',      'vibe',  '/images/vibe-4.png',            'Cute, easy, never overdone.',NULL,               NULL, NULL, NULL, NULL, TRUE, 40),
('630e5e57-9efc-4ef5-a433-d8e49e1e19e2', 'bold-babe-edit',   'Bold Babe Edit',   'vibe',  '/images/vibe-5.png',            'Statement only. No apologies.', NULL,            NULL, NULL, NULL, NULL, TRUE, 50),
('3b32111e-0b37-43a8-92ab-0e3054e72996', 'combo-6-at-499',   'Buy Any 4 @ ₹299', 'combo', '/images/special-offer.png',    NULL, NULL, NULL, 4,  299, 'Free Gift Wrap', TRUE, 10),
('5aa62b8c-78a3-42cf-9ab0-8b76c12c7e8d', 'combo-8-at-597',   'Buy Any 6 @ ₹499', 'combo', '/images/jb-exclusive.png',     NULL, NULL, NULL, 6,  499, 'Flat 10% Off',   TRUE, 20),
('9028deb0-7033-42e6-bba4-dbfc446b264b', 'combo-10-at-999',  'Buy Any 10 @ ₹999','combo', '/images/special-offer.png',    NULL, NULL, NULL, 10, 999, 'Free Gift',      TRUE, 30)
ON CONFLICT (id) DO NOTHING;

-- Coupons (3 active codes)
INSERT INTO public.coupons (code, type, value, min_order, max_discount, expiry, usage_limit, used_count, is_active) VALUES
('JBFIRST',   'percentage', 50, 299, 200, '2026-12-31', 1000, 342, TRUE),
('FLAT100',   'flat',      100, 599, 100, '2026-12-31',  500,  87, TRUE),
('WELCOME20', 'percentage', 20, 199, 150, '2026-12-31', 2000, 156, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Default site settings
INSERT INTO public.site_settings (key, data) VALUES
('global', '{}')
ON CONFLICT (key) DO NOTHING;


-- =============================================================================
-- PART 5: ADMIN USER SETUP
-- =============================================================================
-- After running this SQL, create the admin user manually:
--
--  1. Go to Supabase Dashboard → Authentication → Users → Add User
--  2. Email: your-admin@email.com
--  3. Password: choose a strong password
--  4. Check "Auto Confirm User"
--  5. Then run this to give them admin role (replace the UUID):
--
--     UPDATE public.profiles
--     SET role = 'admin'
--     WHERE id = 'PASTE-ADMIN-USER-UUID-HERE';
--
-- Or use the API server's admin panel to create users after deployment.
-- =============================================================================


-- =============================================================================
-- PART 6: STORAGE BUCKET FOR INVOICES (run in SQL editor)
-- =============================================================================
-- The app stores PDF invoices in Supabase Storage.
-- Create the bucket via: Dashboard → Storage → New Bucket
--   Name: invoices
--   Public: YES
-- Then run:
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "invoices_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'invoices');
CREATE POLICY "invoices_service_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'invoices');
