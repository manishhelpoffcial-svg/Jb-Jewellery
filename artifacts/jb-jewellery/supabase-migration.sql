-- ════════════════════════════════════════════════════════════════════════════
-- JB JEWELLERY — Site Settings + Product Reviews + Multi-Image Storage
-- Run this in your Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════════════════

-- 1) PRODUCTS: support up to 5 images per product (legacy `image` column kept)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill the new images[] array from the existing single image (one-time)
UPDATE products
   SET images = jsonb_build_array(image)
 WHERE jsonb_array_length(images) = 0
   AND image IS NOT NULL
   AND image <> '';


-- 2) SITE SETTINGS: a single-row JSON store (SEO / footer / social / reviews-meta)
CREATE TABLE IF NOT EXISTS site_settings (
  key        text PRIMARY KEY DEFAULT 'global',
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_settings (key, data)
VALUES ('global', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone reads site settings" ON site_settings;
CREATE POLICY "anyone reads site settings" ON site_settings
  FOR SELECT USING (true);


-- 3) PRODUCT REVIEWS: customer reviews + admin-added (with up to 2 images each)
CREATE TABLE IF NOT EXISTS product_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    text REFERENCES products(id) ON DELETE CASCADE,
  product_name  text,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_initial text,
  rating        int  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text   text NOT NULL DEFAULT '',
  images        jsonb NOT NULL DEFAULT '[]'::jsonb,  -- max 2 URLs (enforced in API)
  is_visible    boolean NOT NULL DEFAULT true,        -- admin can hide
  is_verified   boolean NOT NULL DEFAULT false,       -- true if from a real order
  source        text NOT NULL DEFAULT 'customer',     -- 'customer' or 'admin'
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product   ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_visible   ON product_reviews(is_visible);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user      ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created   ON product_reviews(created_at DESC);

-- One review per (user, product) pair (admin entries with NULL user_id are not constrained)
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_reviews_user_product
  ON product_reviews(user_id, product_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone reads visible reviews" ON product_reviews;
CREATE POLICY "anyone reads visible reviews" ON product_reviews
  FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "users insert own reviews" ON product_reviews;
CREATE POLICY "users insert own reviews" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users update own reviews" ON product_reviews;
CREATE POLICY "users update own reviews" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id);


-- 4) STORAGE BUCKETS: products (max 5 imgs/product) + review-images (max 2 imgs/review)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read on both buckets
DROP POLICY IF EXISTS "products bucket read"        ON storage.objects;
CREATE POLICY "products bucket read" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

DROP POLICY IF EXISTS "review-images bucket read"   ON storage.objects;
CREATE POLICY "review-images bucket read" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-images');

-- Authenticated users can upload review images
DROP POLICY IF EXISTS "review-images authenticated upload" ON storage.objects;
CREATE POLICY "review-images authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'review-images' AND auth.role() = 'authenticated');

-- (Product image uploads are admin-only and go through the API using the service-role key,
--  which bypasses RLS — so no INSERT policy is needed for the 'products' bucket here.)


-- 5) AUTO-RECOMPUTE PRODUCT RATING WHEN REVIEWS CHANGE
CREATE OR REPLACE FUNCTION recompute_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  pid text;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);
  IF pid IS NULL THEN RETURN NULL; END IF;
  UPDATE products
     SET rating  = COALESCE(
                     (SELECT ROUND(AVG(rating)::numeric, 1)
                        FROM product_reviews
                       WHERE product_id = pid AND is_visible = true), 0),
         reviews = (SELECT COUNT(*)
                      FROM product_reviews
                     WHERE product_id = pid AND is_visible = true)
   WHERE id = pid;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recompute_rating_ins ON product_reviews;
CREATE TRIGGER trg_recompute_rating_ins
AFTER INSERT ON product_reviews
FOR EACH ROW EXECUTE FUNCTION recompute_product_rating();

DROP TRIGGER IF EXISTS trg_recompute_rating_upd ON product_reviews;
CREATE TRIGGER trg_recompute_rating_upd
AFTER UPDATE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION recompute_product_rating();

DROP TRIGGER IF EXISTS trg_recompute_rating_del ON product_reviews;
CREATE TRIGGER trg_recompute_rating_del
AFTER DELETE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION recompute_product_rating();
