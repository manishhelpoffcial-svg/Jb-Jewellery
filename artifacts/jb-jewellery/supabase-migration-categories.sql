-- ════════════════════════════════════════════════════════════════════════════
-- JB JEWELLERY — CATEGORIES SYSTEM (run AFTER supabase-migration.sql)
-- Run this in your Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════════════════

-- 1) CATEGORIES table — supports 4 types
--    - 'main'  : Earrings, Necklaces, etc. (auto-filter via products.category text)
--    - 'vibe'  : Boss Babe Basic, Glam Girl Hours, etc. (manual product picks)
--    - 'price' : Under ₹99/199/299/499 (auto-filter where products.price <= max_price)
--    - 'combo' : Buy any 6 @ ₹499, etc. (manual product picks + combo deal)
CREATE TABLE IF NOT EXISTS categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  name            text NOT NULL,
  type            text NOT NULL CHECK (type IN ('main', 'vibe', 'price', 'combo')),
  image           text,                                  -- public storage URL or external link
  subtitle        text,                                  -- optional caption
  description     text,
  product_category text,                                 -- for type='main' → matches products.category
  max_price       numeric,                               -- for type='price'
  combo_count     integer,                               -- for type='combo' (e.g. 6)
  combo_price     numeric,                               -- for type='combo' (e.g. 499)
  combo_extra     text,                                  -- e.g. 'Flat 10% Off' or 'Free Gift'
  is_visible      boolean NOT NULL DEFAULT true,
  sort_order      int     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_type    ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_visible ON categories(is_visible);
CREATE INDEX IF NOT EXISTS idx_categories_sort    ON categories(sort_order);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone reads visible categories" ON categories;
CREATE POLICY "anyone reads visible categories" ON categories
  FOR SELECT USING (is_visible = true);


-- 2) PRODUCT ↔ CATEGORY join table (for vibe + combo manual assignments)
CREATE TABLE IF NOT EXISTS product_categories (
  product_id  text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_cat ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_prd ON product_categories(product_id);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone reads product_categories" ON product_categories;
CREATE POLICY "anyone reads product_categories" ON product_categories FOR SELECT USING (true);


-- 3) STORAGE bucket for category banners/tiles
INSERT INTO storage.buckets (id, name, public)
VALUES ('categories', 'categories', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "categories bucket read" ON storage.objects;
CREATE POLICY "categories bucket read" ON storage.objects
  FOR SELECT USING (bucket_id = 'categories');


-- 4) SEED default categories (idempotent — uses ON CONFLICT slug DO NOTHING)
INSERT INTO categories (slug, name, type, product_category, sort_order) VALUES
  ('earrings',         'Earrings',         'main', 'Earrings',         10),
  ('necklaces',        'Necklaces',        'main', 'Necklaces',        20),
  ('rings',            'Rings',            'main', 'Rings',            30),
  ('bracelets',        'Bracelets',        'main', 'Bracelets',        40),
  ('hair-accessories', 'Hair Accessories', 'main', 'Hair Accessories', 50),
  ('gift-hampers',     'Gift Hampers',     'main', 'Combos',           60)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (slug, name, type, subtitle, sort_order) VALUES
  ('boss-babe-basic',  'Boss Babe Basic',  'vibe', 'Power. Poise. Polish.',         10),
  ('glam-girl-hours',  'Glam Girl Hours',  'vibe', 'Sparkle that turns heads.',     20),
  ('everyday-slay',    'Everyday Slay',    'vibe', 'Light, lovely, all-day pretty.', 30),
  ('campus-girl',      'Campus Girl',      'vibe', 'Cute, easy, never overdone.',   40),
  ('bold-babe-edit',   'Bold Babe Edit',   'vibe', 'Statement only. No apologies.', 50)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (slug, name, type, max_price, sort_order) VALUES
  ('under-99',  'Under ₹99',  'price',  99, 10),
  ('under-199', 'Under ₹199', 'price', 199, 20),
  ('under-299', 'Under ₹299', 'price', 299, 30),
  ('under-499', 'Under ₹499', 'price', 499, 40)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (slug, name, type, combo_count, combo_price, combo_extra, sort_order) VALUES
  ('combo-6-at-499',  'Buy Any 6 @ ₹499',  'combo',  6, 499, 'Flat 10% Off', 10),
  ('combo-8-at-597',  'Buy Any 8 @ ₹597',  'combo',  8, 597, 'Flat 10% Off', 20),
  ('combo-10-at-999', 'Buy Any 10 @ ₹999', 'combo', 10, 999, 'Free Gift',    30)
ON CONFLICT (slug) DO NOTHING;
