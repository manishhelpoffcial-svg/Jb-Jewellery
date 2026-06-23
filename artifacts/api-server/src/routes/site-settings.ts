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

// Public read
router.get("/", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("data, updated_at")
      .eq("key", "global")
      .maybeSingle();
    if (error) throw error;
    res.json({ settings: data?.data || {}, updated_at: data?.updated_at || null });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load settings" });
  }
});

// Admin save
router.put("/", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const body = req.body as { settings?: Record<string, unknown> };
    if (!body || typeof body.settings !== "object") {
      res.status(400).json({ error: "settings object required" });
      return;
    }
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "global", data: body.settings, updated_at: new Date().toISOString() })
      .select("data, updated_at")
      .single();
    if (error) throw error;
    res.json({ settings: data.data, updated_at: data.updated_at });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to save settings" });
  }
});

export default router;
