import { Router } from "express";
import type { Request, Response } from "express";
import { simpleAdminMiddleware } from "../lib/auth.js";
import { supabaseAdmin, isSupabaseAdminConfigured } from "../lib/supabaseAdmin.js";

const router = Router();

// ─── Server-side memory cache (60 s TTL) ─────────────────────────────────────
const CACHE_TTL_MS = 60_000;
interface CacheEntry { data: unknown; expires: number }
const _cache = new Map<string, CacheEntry>();

function getCached(key: string): unknown | null {
  const e = _cache.get(key);
  if (!e || Date.now() > e.expires) { _cache.delete(key); return null; }
  return e.data;
}
function setCached(key: string, data: unknown) {
  _cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}
function bustCache() { _cache.clear(); }

router.use((_req, res, next) => {
  if (!isSupabaseAdminConfigured) {
    res.status(500).json({ error: "Supabase not configured" });
    return;
  }
  next();
});

type CategoryType = "main" | "vibe" | "price" | "combo";

interface CategoryBody {
  slug?: string;
  name?: string;
  type?: CategoryType;
  image?: string | null;
  subtitle?: string | null;
  description?: string | null;
  product_category?: string | null;
  max_price?: number | null;
  combo_count?: number | null;
  combo_price?: number | null;
  combo_extra?: string | null;
  is_visible?: boolean;
  sort_order?: number;
}

function normalizeRow(b: CategoryBody) {
  const row: Record<string, unknown> = {};
  if (b.slug !== undefined) row["slug"] = String(b.slug).trim().toLowerCase();
  if (b.name !== undefined) row["name"] = String(b.name).trim();
  if (b.type !== undefined) row["type"] = b.type;
  if (b.image !== undefined) row["image"] = b.image || null;
  if (b.subtitle !== undefined) row["subtitle"] = b.subtitle || null;
  if (b.description !== undefined) row["description"] = b.description || null;
  if (b.product_category !== undefined) row["product_category"] = b.product_category || null;
  if (b.max_price !== undefined) row["max_price"] = b.max_price === null ? null : Number(b.max_price);
  if (b.combo_count !== undefined) row["combo_count"] = b.combo_count === null ? null : Number(b.combo_count);
  if (b.combo_price !== undefined) row["combo_price"] = b.combo_price === null ? null : Number(b.combo_price);
  if (b.combo_extra !== undefined) row["combo_extra"] = b.combo_extra || null;
  if (b.is_visible !== undefined) row["is_visible"] = !!b.is_visible;
  if (b.sort_order !== undefined) row["sort_order"] = Number(b.sort_order) || 0;
  return row;
}

async function fetchProductsForCategory(category: Record<string, unknown>) {
  const type = category["type"] as CategoryType;
  if (type === "main" && category["product_category"]) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("*")
      .ilike("category", String(category["product_category"]))
      .order("created_at", { ascending: false });
    return data || [];
  }
  if (type === "price" && category["max_price"] != null) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("*")
      .lte("price", Number(category["max_price"]))
      .order("price", { ascending: true });
    return data || [];
  }
  // vibe / combo: products via join table
  const { data: links } = await supabaseAdmin
    .from("product_categories")
    .select("product_id, sort_order")
    .eq("category_id", category["id"] as string)
    .order("sort_order", { ascending: true });
  const ids = (links || []).map((l) => l.product_id as string);
  if (ids.length === 0) return [];
  const { data: prods } = await supabaseAdmin
    .from("products")
    .select("*")
    .in("id", ids);
  // preserve link order
  const byId = new Map((prods || []).map((p) => [p.id as string, p]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────────────

// All visible categories in ONE query, grouped by type — used by home page sections
router.get("/all", async (_req: Request, res: Response) => {
  try {
    const cacheKey = "all-grouped";
    const cached = getCached(cacheKey);
    if (cached) {
      res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
      res.json(cached);
      return;
    }
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const categories = data || [];
    const result = {
      categories,
      byType: {
        main:  categories.filter((c) => c["type"] === "main"),
        vibe:  categories.filter((c) => c["type"] === "vibe"),
        price: categories.filter((c) => c["type"] === "price"),
        combo: categories.filter((c) => c["type"] === "combo"),
      },
    };
    setCached(cacheKey, result);
    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load" });
  }
});

// List visible categories (optionally filtered by type)
router.get("/", async (req: Request, res: Response) => {
  try {
    const type = req.query["type"] as string | undefined;
    const cacheKey = `list:${type ?? "all"}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
      res.json(cached);
      return;
    }
    let q = supabaseAdmin
      .from("categories")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });
    if (type) q = q.eq("type", type);
    const { data, error } = await q;
    if (error) throw error;
    const result = { categories: data || [] };
    setCached(cacheKey, result);
    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load" });
  }
});

// Single visible category by slug + its products
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { data: cat, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .eq("slug", req.params["slug"])
      .eq("is_visible", true)
      .maybeSingle();
    if (error) throw error;
    if (!cat) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    const products = await fetchProductsForCategory(cat);
    res.json({ category: cat, products });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load" });
  }
});

// ─── ADMIN ROUTES ──────────────────────────────────────────────────────────

// List all categories (incl. hidden), optionally with assigned product ids for vibe/combo
router.get("/admin/list", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { data: cats, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("type", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) throw error;

    // Attach assigned product ids for vibe/combo categories
    const manualIds = (cats || []).filter((c) => c.type === "vibe" || c.type === "combo").map((c) => c.id as string);
    let mapping: Record<string, string[]> = {};
    if (manualIds.length > 0) {
      const { data: links } = await supabaseAdmin
        .from("product_categories")
        .select("category_id, product_id")
        .in("category_id", manualIds);
      mapping = (links || []).reduce((acc: Record<string, string[]>, l) => {
        const cid = String(l.category_id);
        if (!acc[cid]) acc[cid] = [];
        acc[cid].push(String(l.product_id));
        return acc;
      }, {});
    }
    const enriched = (cats || []).map((c) => ({
      ...c,
      product_ids: mapping[c.id as string] || [],
    }));
    res.json({ categories: enriched });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load" });
  }
});

router.post("/admin", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const b = req.body as CategoryBody;
    if (!b.slug || !b.name || !b.type) {
      res.status(400).json({ error: "slug, name and type are required" });
      return;
    }
    const row = normalizeRow(b);
    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    bustCache();
    res.status(201).json({ category: data });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to create" });
  }
});

router.patch("/admin/:id", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const b = req.body as CategoryBody;
    const row = { ...normalizeRow(b), updated_at: new Date().toISOString() };
    const { data, error } = await supabaseAdmin
      .from("categories")
      .update(row)
      .eq("id", req.params["id"])
      .select()
      .single();
    if (error) throw error;
    bustCache();
    res.json({ category: data });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to update" });
  }
});

router.delete("/admin/:id", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", req.params["id"]);
    if (error) throw error;
    bustCache();
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to delete" });
  }
});

// Replace the assigned product list for a category (vibe/combo)
router.put("/admin/:id/products", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params["id"];
    const productIds = ((req.body as { product_ids?: string[] }).product_ids || []).filter(Boolean);
    // Remove all existing links for this category
    const { error: delErr } = await supabaseAdmin
      .from("product_categories")
      .delete()
      .eq("category_id", id);
    if (delErr) throw delErr;
    if (productIds.length > 0) {
      const rows = productIds.map((pid, i) => ({
        category_id: id,
        product_id: pid,
        sort_order: i,
      }));
      const { error: insErr } = await supabaseAdmin
        .from("product_categories")
        .insert(rows);
      if (insErr) throw insErr;
    }
    bustCache();
    res.json({ success: true, count: productIds.length });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to assign products" });
  }
});

export default router;
