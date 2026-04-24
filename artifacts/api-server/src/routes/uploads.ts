import { Router } from "express";
import type { Request, Response } from "express";
import { simpleAdminMiddleware } from "../lib/auth.js";
import { supabaseAdmin, isSupabaseAdminConfigured } from "../lib/supabaseAdmin.js";

const router = Router();

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per image

router.use((_req, res, next) => {
  if (!isSupabaseAdminConfigured) {
    res.status(500).json({ error: "Supabase storage not configured" });
    return;
  }
  next();
});

function extOf(name: string, mime?: string): string {
  const lower = (name || "").toLowerCase();
  const m = lower.match(/\.([a-z0-9]+)$/);
  if (m) return m[1];
  if (mime?.includes("png")) return "png";
  if (mime?.includes("webp")) return "webp";
  if (mime?.includes("jpeg") || mime?.includes("jpg")) return "jpg";
  return "jpg";
}

async function uploadToBucket(
  bucket: string,
  prefix: string,
  filename: string,
  base64: string,
  mime: string,
): Promise<string> {
  const cleanedBase64 = base64.replace(/^data:[^,]+,/, "");
  const buffer = Buffer.from(cleanedBase64, "base64");
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error(`Image too large (max ${MAX_BYTES / 1024 / 1024} MB)`);
  }
  const ext = extOf(filename, mime);
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mime || "image/jpeg", upsert: false, cacheControl: "31536000" });
  if (error) throw error;
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Admin: upload product image
router.post("/product-image", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { base64, filename, mime } = req.body as { base64?: string; filename?: string; mime?: string };
    if (!base64) {
      res.status(400).json({ error: "base64 is required" });
      return;
    }
    const url = await uploadToBucket(
      "products",
      "products",
      filename || "image.jpg",
      base64,
      mime || "image/jpeg",
    );
    res.json({ url });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
});

// Admin: upload review image (admin-added reviews, e.g. from AdminProductReviews)
router.post("/admin/review-image", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const { base64, filename, mime } = req.body as { base64?: string; filename?: string; mime?: string };
    if (!base64) {
      res.status(400).json({ error: "base64 is required" });
      return;
    }
    const url = await uploadToBucket(
      "review-images",
      "admin",
      filename || "image.jpg",
      base64,
      mime || "image/jpeg",
    );
    res.json({ url });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
});

// Public: customer review image upload (no auth — caller must pass user id in customer-review POST)
router.post("/review-image", async (req: Request, res: Response) => {
  try {
    const { base64, filename, mime } = req.body as { base64?: string; filename?: string; mime?: string };
    if (!base64) {
      res.status(400).json({ error: "base64 is required" });
      return;
    }
    const url = await uploadToBucket(
      "review-images",
      "customer",
      filename || "image.jpg",
      base64,
      mime || "image/jpeg",
    );
    res.json({ url });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
});

export default router;
