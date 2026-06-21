import { Router } from "express";
import type { Request, Response } from "express";
import { simpleAdminMiddleware } from "../lib/auth.js";
import { supabaseAdmin, isSupabaseAdminConfigured } from "../lib/supabaseAdmin.js";

const router = Router();

router.use((_req, res, next) => {
  if (!isSupabaseAdminConfigured) {
    res.status(500).json({ error: "Supabase not configured" });
    return;
  }
  next();
});

const MAX_REVIEW_IMAGES = 2;

interface ReviewBody {
  product_id?: string;
  product_name?: string;
  user_id?: string;
  customer_name?: string;
  rating?: number;
  review_text?: string;
  images?: string[];
  source?: "customer" | "admin";
  is_visible?: boolean;
  is_verified?: boolean;
}

function buildRow(b: ReviewBody, defaults: Partial<{ source: "customer" | "admin"; is_verified: boolean }> = {}) {
  const name = (b.customer_name || "").trim() || "Anonymous";
  const images = Array.isArray(b.images) ? b.images.filter(Boolean).slice(0, MAX_REVIEW_IMAGES) : [];
  return {
    product_id: b.product_id || null,
    product_name: b.product_name || null,
    user_id: b.user_id || null,
    customer_name: name,
    customer_initial: name.charAt(0).toUpperCase(),
    rating: Math.max(1, Math.min(5, Number(b.rating) || 5)),
    review_text: (b.review_text || "").slice(0, 2000),
    images,
    source: b.source || defaults.source || "customer",
    is_verified: typeof b.is_verified === "boolean" ? b.is_verified : !!defaults.is_verified,
    is_visible: typeof b.is_visible === "boolean" ? b.is_visible : true,
  };
}

// ─── PUBLIC ROUTES ─────────────────────────────────────────────────────────

// List visible reviews for a product (homepage / product detail)
router.get("/product/:id", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("product_reviews")
      .select("*")
      .eq("product_id", req.params["id"])
      .eq("is_visible", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ reviews: data || [] });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load reviews" });
  }
});

// Public submit (called from the customer site)
router.post("/", async (req: Request, res: Response) => {
  try {
    const b = req.body as ReviewBody;
    if (!b.product_id || !b.rating) {
      res.status(400).json({ error: "product_id and rating are required" });
      return;
    }
    const row = buildRow(b, { source: "customer", is_verified: !!b.user_id });
    const { data, error } = await supabaseAdmin
      .from("product_reviews")
      .upsert(row, { onConflict: "user_id,product_id", ignoreDuplicates: false })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ review: data });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to submit review" });
  }
});

// ─── ADMIN ROUTES ──────────────────────────────────────────────────────────

router.get("/", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const productId = req.query["product_id"] as string | undefined;
    let q = supabaseAdmin.from("product_reviews").select("*").order("created_at", { ascending: false });
    if (productId) q = q.eq("product_id", productId);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ reviews: data || [] });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to list reviews" });
  }
});

// Admin add a review manually (e.g. from offline customer feedback)
router.post("/admin", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const b = req.body as ReviewBody;
    if (!b.product_id || !b.rating || !b.customer_name) {
      res.status(400).json({ error: "product_id, rating and customer_name are required" });
      return;
    }
    const row = buildRow(b, { source: "admin", is_verified: false });
    const { data, error } = await supabaseAdmin
      .from("product_reviews")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ review: data });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to add review" });
  }
});

router.patch("/:id", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const b = req.body as ReviewBody;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof b.is_visible === "boolean") patch["is_visible"] = b.is_visible;
    if (typeof b.is_verified === "boolean") patch["is_verified"] = b.is_verified;
    if (b.rating !== undefined) patch["rating"] = Math.max(1, Math.min(5, Number(b.rating)));
    if (b.review_text !== undefined) patch["review_text"] = String(b.review_text).slice(0, 2000);
    if (b.customer_name !== undefined) {
      patch["customer_name"] = b.customer_name;
      patch["customer_initial"] = String(b.customer_name).charAt(0).toUpperCase();
    }
    if (Array.isArray(b.images)) patch["images"] = b.images.slice(0, MAX_REVIEW_IMAGES);

    const { data, error } = await supabaseAdmin
      .from("product_reviews")
      .update(patch)
      .eq("id", req.params["id"])
      .select()
      .single();
    if (error) throw error;
    res.json({ review: data });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to update review" });
  }
});

router.delete("/:id", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin
      .from("product_reviews")
      .delete()
      .eq("id", req.params["id"]);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to delete" });
  }
});

export default router;
