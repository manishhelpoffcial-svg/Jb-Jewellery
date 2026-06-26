---
name: JB Jewellery null-safety crashes
description: Root causes and fixes for admin panel "Cannot read properties of undefined" crashes
---

## Root Causes

**DB-level:** Supabase `product_reviews.images` column returns `null` for rows inserted before the NOT NULL default was set.

**Frontend:** Several admin pages accessed properties on potentially-null fields without guards.

**Backend:** Supabase realtime-js requires `ws` package as transport on Node.js 20 (no native WebSocket). Missing this caused immediate server crash on startup.

## Fixes Applied

**Backend (supabaseAdmin.ts):**
- Install `ws` package and pass as `realtime.transport` to `createClient()` — required for Node.js < 22.

**Backend (admin-supabase.ts):**
- Products POST/PATCH: now handles `images[]` field, syncs legacy `image` from `images[0]`, clears `image` to null when `images=[]`.
- Products PATCH: sets `updated_at` timestamp (requires `updated_at` column — added in SQL).

**Frontend null-safety:**
- `AdminProductReviews.tsx`: `r.images.length` → `(r.images||[]).length`; `setReviews(reviews)` → `setReviews(revList ?? [])`.
- `AdminProductReviews.tsx`: `r.customer_name.charAt(0)` → `(r.customer_name||'?').charAt(0)`.
- `AdminOrders.tsx`: `o.items.length` → `(o.items||[]).length` in table row and modal.
- `AdminOrders.tsx`: search filter uses `(o.customerName||'').toLowerCase()` and `(o.phone||'').includes(q)`.

**SQL (supabase-schema.sql):**
- All policies made idempotent with DO blocks (safe to re-run).
- `products`: added `updated_at` column + `ALTER TABLE ADD COLUMN IF NOT EXISTS`.
- `orders`: added `updated_at`, `tracking_number`, `invoice_path` with `ADD COLUMN IF NOT EXISTS`.
- `product_reviews.images`: enforced NOT NULL default '[]'.
- Storage buckets: `invoices`, `product-images`, `category-images` all created with policies.

**Why:**
- Supabase returns `null` for jsonb columns when no default was enforced at insert time.
- Node.js 20 lacks native WebSocket; supabase-js v2 realtime throws on startup without `ws`.
