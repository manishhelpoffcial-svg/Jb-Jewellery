import { Router } from "express";
import type { Request, Response } from "express";
import { simpleAdminMiddleware } from "../lib/auth.js";
import { supabaseAdmin, isSupabaseAdminConfigured } from "../lib/supabaseAdmin.js";

const router = Router();

router.use(simpleAdminMiddleware);

router.use((_req, res, next) => {
  if (!isSupabaseAdminConfigured) {
    res.status(500).json({
      error:
        "Supabase admin client is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).",
    });
    return;
  }
  next();
});

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  created_at: string | null;
}

interface AddressRow {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
  is_default: boolean | null;
  created_at: string | null;
}

// ── List all customers (auth users + profile + addresses) ────────────────────
router.get("/customers", async (_req: Request, res: Response) => {
  try {
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw error;

    const ids = list.users.map((u) => u.id);
    if (ids.length === 0) {
      res.json({ customers: [] });
      return;
    }

    const [{ data: profiles }, { data: addresses }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").in("id", ids),
      supabaseAdmin.from("addresses").select("*").in("user_id", ids),
    ]);

    const profileById = new Map<string, ProfileRow>();
    (profiles as ProfileRow[] | null)?.forEach((p) => profileById.set(p.id, p));

    const addressesByUser = new Map<string, AddressRow[]>();
    (addresses as AddressRow[] | null)?.forEach((a) => {
      const arr = addressesByUser.get(a.user_id) || [];
      arr.push(a);
      addressesByUser.set(a.user_id, arr);
    });

    const customers = list.users.map((u) => {
      const p = profileById.get(u.id);
      const addrs = addressesByUser.get(u.id) || [];
      return {
        id: u.id,
        email: u.email || "",
        name:
          p?.full_name ||
          (u.user_metadata?.["full_name"] as string | undefined) ||
          (u.email ? u.email.split("@")[0] : "Customer"),
        phone: p?.phone || (u.user_metadata?.["phone"] as string | undefined) || "",
        role: p?.role || "user",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        addresses: addrs,
        address_count: addrs.length,
      };
    });

    res.json({ customers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to list customers";
    res.status(500).json({ error: msg });
  }
});

// ── Single customer detail ────────────────────────────────────────────────────
router.get("/customers/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: u, error: uErr } = await supabaseAdmin.auth.admin.getUserById(id);
    if (uErr || !u.user) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    const [{ data: profile }, { data: addresses }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabaseAdmin
        .from("addresses")
        .select("*")
        .eq("user_id", id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true }),
    ]);
    const p = profile as ProfileRow | null;
    res.json({
      customer: {
        id: u.user.id,
        email: u.user.email || "",
        name:
          p?.full_name ||
          (u.user.user_metadata?.["full_name"] as string | undefined) ||
          (u.user.email ? u.user.email.split("@")[0] : "Customer"),
        phone: p?.phone || (u.user.user_metadata?.["phone"] as string | undefined) || "",
        role: p?.role || "user",
        created_at: u.user.created_at,
        last_sign_in_at: u.user.last_sign_in_at,
        email_confirmed_at: u.user.email_confirmed_at,
      },
      addresses: addresses || [],
    });
  } catch (err: unknown) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Failed to load customer" });
  }
});

// ── Create new customer ───────────────────────────────────────────────────────
router.post("/customers", async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, address } = req.body as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        pincode?: string;
      };
    };

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name || "", phone: phone || "" },
      });
    if (createErr || !created.user) throw createErr || new Error("Failed to create user");

    const newUser = created.user;

    await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: newUser.id, full_name: name || "", phone: phone || "", role: "user" },
        { onConflict: "id" },
      );

    if (address && address.line1 && address.city && address.pincode) {
      await supabaseAdmin.from("addresses").insert({
        user_id: newUser.id,
        full_name: name || "",
        phone: phone || "",
        line1: address.line1,
        line2: address.line2 || "",
        city: address.city,
        state: address.state || "",
        pincode: address.pincode,
        country: "India",
        is_default: true,
      });
    }

    res.status(201).json({ id: newUser.id, email: newUser.email });
  } catch (err: unknown) {
    res
      .status(400)
      .json({ error: err instanceof Error ? err.message : "Failed to create customer" });
  }
});

// ── Delete customer ───────────────────────────────────────────────────────────
router.delete("/customers/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    res
      .status(400)
      .json({ error: err instanceof Error ? err.message : "Failed to delete customer" });
  }
});

// ── Change customer password ──────────────────────────────────────────────────
router.patch("/customers/:id/password", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body as { password?: string };
    if (!password || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password,
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    res
      .status(400)
      .json({ error: err instanceof Error ? err.message : "Failed to update password" });
  }
});

// ── Generate one-tap admin login link for a customer ──────────────────────────
router.post("/customers/:id/login-link", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
    if (!u.user?.email) {
      res.status(404).json({ error: "Customer email not found" });
      return;
    }
    const redirectTo = (req.body?.redirectTo as string) || undefined;
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: u.user.email,
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (error) throw error;
    res.json({
      action_link: data.properties?.action_link,
      email: u.user.email,
    });
  } catch (err: unknown) {
    res
      .status(400)
      .json({ error: err instanceof Error ? err.message : "Failed to generate link" });
  }
});

export default router;
