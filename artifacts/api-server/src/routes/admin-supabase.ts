import { Router } from "express";
import type { Request, Response } from "express";
import { simpleAdminMiddleware } from "../lib/auth.js";
import { supabaseAdmin, isSupabaseAdminConfigured } from "../lib/supabaseAdmin.js";
import {
  sendOrderConfirmedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
} from "../lib/mailer.js";

const router = Router();

// ── Login endpoint — NO auth middleware, validates credentials server-side ──
router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const ADMIN_EMAIL = (
    process.env['ADMIN_EMAIL'] ||
    process.env['VITE_ADMIN_EMAIL'] ||
    ''
  ).toLowerCase();
  const ADMIN_PASSWORD =
    process.env['ADMIN_PASSWORD'] || process.env['VITE_ADMIN_PASSWORD'] || '';
  const ADMIN_NAME =
    process.env['ADMIN_NAME'] || process.env['VITE_ADMIN_NAME'] || 'Admin';

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    res.status(500).json({
      error:
        'Admin credentials not configured on server. Set ADMIN_EMAIL and ADMIN_PASSWORD in your environment variables.',
    });
    return;
  }
  if (
    !email ||
    !password ||
    email.trim().toLowerCase() !== ADMIN_EMAIL ||
    password !== ADMIN_PASSWORD
  ) {
    res.status(401).json({ error: 'Invalid admin email or password.' });
    return;
  }
  res.json({ token: ADMIN_PASSWORD, name: ADMIN_NAME, email: ADMIN_EMAIL });
});

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

// ════════════════════════════════════════════════════════════════════════════
// CUSTOMERS
// ════════════════════════════════════════════════════════════════════════════

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

router.get("/customers/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params["id"]);
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

router.delete("/customers/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params["id"]);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    res
      .status(400)
      .json({ error: err instanceof Error ? err.message : "Failed to delete customer" });
  }
});

router.patch("/customers/:id/password", async (req: Request, res: Response) => {
  try {
    const id = String(req.params["id"]);
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

router.post("/customers/:id/login-link", async (req: Request, res: Response) => {
  try {
    const id = String(req.params["id"]);
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

// ════════════════════════════════════════════════════════════════════════════
// PRODUCTS  (admin CRUD)
// ════════════════════════════════════════════════════════════════════════════

router.get("/products", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ products: data || [] });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to list products" });
  }
});

router.post("/products", async (req: Request, res: Response) => {
  try {
    const b = req.body as Record<string, unknown>;
    const id = (b["id"] as string) || `prod-${Date.now()}`;
    const row = {
      id,
      name: b["name"],
      category: b["category"],
      price: Number(b["price"] || 0),
      original_price: Number(b["original_price"] ?? b["originalPrice"] ?? 0),
      discount: Number(b["discount"] ?? 0),
      rating: Number(b["rating"] ?? 4.5),
      reviews: Number(b["reviews"] ?? 0),
      image: (b["image"] as string) || null,
      is_new: Boolean(b["is_new"] ?? b["isNew"] ?? false),
      is_bestseller: Boolean(b["is_bestseller"] ?? b["isBestseller"] ?? false),
      stock: Number(b["stock"] ?? 100),
      description: (b["description"] as string) || null,
    };
    const { data, error } = await supabaseAdmin
      .from("products")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ product: data });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to create product" });
  }
});

router.patch("/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const b = req.body as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (b["name"] !== undefined) patch["name"] = b["name"];
    if (b["category"] !== undefined) patch["category"] = b["category"];
    if (b["price"] !== undefined) patch["price"] = Number(b["price"]);
    if (b["original_price"] !== undefined || b["originalPrice"] !== undefined)
      patch["original_price"] = Number(b["original_price"] ?? b["originalPrice"]);
    if (b["discount"] !== undefined) patch["discount"] = Number(b["discount"]);
    if (b["rating"] !== undefined) patch["rating"] = Number(b["rating"]);
    if (b["reviews"] !== undefined) patch["reviews"] = Number(b["reviews"]);
    if (b["image"] !== undefined) patch["image"] = b["image"];
    if (b["is_new"] !== undefined || b["isNew"] !== undefined)
      patch["is_new"] = Boolean(b["is_new"] ?? b["isNew"]);
    if (b["is_bestseller"] !== undefined || b["isBestseller"] !== undefined)
      patch["is_bestseller"] = Boolean(b["is_bestseller"] ?? b["isBestseller"]);
    if (b["stock"] !== undefined) patch["stock"] = Number(b["stock"]);
    if (b["description"] !== undefined) patch["description"] = b["description"];
    const { data, error } = await supabaseAdmin
      .from("products")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    res.json({ product: data });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to update product" });
  }
});

router.delete("/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to delete product" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// COUPONS  (admin CRUD)
// ════════════════════════════════════════════════════════════════════════════

router.get("/coupons", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ coupons: data || [] });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to list coupons" });
  }
});

router.post("/coupons", async (req: Request, res: Response) => {
  try {
    const b = req.body as Record<string, unknown>;
    const code = String(b["code"] || "").trim().toUpperCase();
    if (!code) {
      res.status(400).json({ error: "Coupon code is required" });
      return;
    }
    const row = {
      code,
      type: (b["type"] as string) || "percentage",
      value: Number(b["value"] || 0),
      min_order: Number(b["min_order"] ?? b["minOrder"] ?? 0),
      max_discount: Number(b["max_discount"] ?? b["maxDiscount"] ?? 0),
      expiry: (b["expiry"] as string) || null,
      usage_limit: Number(b["usage_limit"] ?? b["usageLimit"] ?? 0),
      used_count: Number(b["used_count"] ?? b["usedCount"] ?? 0),
      is_active: b["is_active"] !== undefined ? Boolean(b["is_active"]) : Boolean(b["isActive"] ?? true),
    };
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ coupon: data });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to create coupon" });
  }
});

router.patch("/coupons/:code", async (req: Request, res: Response) => {
  try {
    const code = String(req.params["code"] || "").toUpperCase();
    const b = req.body as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (b["type"] !== undefined) patch["type"] = b["type"];
    if (b["value"] !== undefined) patch["value"] = Number(b["value"]);
    if (b["min_order"] !== undefined || b["minOrder"] !== undefined)
      patch["min_order"] = Number(b["min_order"] ?? b["minOrder"]);
    if (b["max_discount"] !== undefined || b["maxDiscount"] !== undefined)
      patch["max_discount"] = Number(b["max_discount"] ?? b["maxDiscount"]);
    if (b["expiry"] !== undefined) patch["expiry"] = b["expiry"];
    if (b["usage_limit"] !== undefined || b["usageLimit"] !== undefined)
      patch["usage_limit"] = Number(b["usage_limit"] ?? b["usageLimit"]);
    if (b["used_count"] !== undefined || b["usedCount"] !== undefined)
      patch["used_count"] = Number(b["used_count"] ?? b["usedCount"]);
    if (b["is_active"] !== undefined) patch["is_active"] = Boolean(b["is_active"]);
    else if (b["isActive"] !== undefined) patch["is_active"] = Boolean(b["isActive"]);
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .update(patch)
      .eq("code", code)
      .select()
      .single();
    if (error) throw error;
    res.json({ coupon: data });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to update coupon" });
  }
});

router.delete("/coupons/:code", async (req: Request, res: Response) => {
  try {
    const code = String(req.params["code"] || "").toUpperCase();
    const { error } = await supabaseAdmin.from("coupons").delete().eq("code", code);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to delete coupon" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ORDERS  (admin views + status updates)
// ════════════════════════════════════════════════════════════════════════════

router.get("/orders", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ orders: data || [] });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to list orders" });
  }
});

router.patch("/orders/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note, tracking_number } = req.body as {
      status?: string;
      note?: string;
      tracking_number?: string;
    };
    if (!status) {
      res.status(400).json({ error: "status is required" });
      return;
    }

    const { data: existing, error: getErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (getErr) throw getErr;
    if (!existing) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const history = Array.isArray(existing["status_history"])
      ? (existing["status_history"] as { status: string; timestamp: string; note: string }[])
      : [];
    history.push({ status, timestamp: new Date().toISOString(), note: note || "" });

    const patch: Record<string, unknown> = { status, status_history: history };
    if (tracking_number) patch["tracking_number"] = tracking_number;

    const { data: updated, error: updErr } = await supabaseAdmin
      .from("orders")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (updErr) throw updErr;

    // Trigger themed status emails (best-effort, never blocks the response).
    try {
      const orderId = String(req.params["id"]);
      const baseInfo = {
        id: orderId,
        customer_name: String(existing["customer_name"] || ""),
        email: String(existing["email"] || ""),
        grand_total: Number(existing["grand_total"]),
        note: note || "",
      };
      const items = Array.isArray(existing["items"])
        ? (existing["items"] as { name: string; quantity: number; price: number }[])
        : [];
      const addressObj =
        existing["address"] && typeof existing["address"] === "object"
          ? (existing["address"] as Record<string, string>)
          : {};
      let p: Promise<void> | null = null;
      if (status === "confirmed") {
        p = sendOrderConfirmedEmail({ ...baseInfo, items });
      } else if (status === "shipped") {
        p = sendOrderShippedEmail({ ...baseInfo, address: addressObj });
      } else if (status === "delivered") {
        p = sendOrderDeliveredEmail({ ...baseInfo, items });
      }
      if (p)
        p.then(() =>
          console.log(`[Mailer] ${status} email sent to ${existing["email"]} ✓`),
        ).catch((err) => console.error(`[Mailer] ${status} email failed:`, err));
    } catch {
      /* never block status update on email */
    }

    res.json({ order: updated });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to update order" });
  }
});

// Upload / overwrite the invoice PDF for an order.
// Body: { pdf_base64: string }   (raw base64 of PDF bytes, NO data: prefix)
router.post("/orders/:id/invoice", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pdf_base64 } = req.body as { pdf_base64?: string };
    if (!pdf_base64) {
      res.status(400).json({ error: "pdf_base64 is required" });
      return;
    }
    const buffer = Buffer.from(pdf_base64, "base64");
    const path = `orders/${id}.pdf`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("invoices")
      .upload(path, buffer, {
        contentType: "application/pdf",
        upsert: true,
        cacheControl: "3600",
      });
    if (upErr) throw upErr;

    const { data: urlData } = supabaseAdmin.storage.from("invoices").getPublicUrl(path);
    const invoice_url = urlData.publicUrl;

    const { error: dbErr } = await supabaseAdmin
      .from("orders")
      .update({ invoice_url, invoice_path: path })
      .eq("id", id);
    if (dbErr) throw dbErr;

    res.json({ invoice_url, invoice_path: path });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to upload invoice" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD  (aggregated analytics)
// ════════════════════════════════════════════════════════════════════════════

router.get("/dashboard", async (_req: Request, res: Response) => {
  try {
    const [
      { data: orders, error: oErr },
      { count: productCount },
      { count: couponCount },
      { count: customerCount },
    ] = await Promise.all([
      supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("products").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("coupons")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    ]);
    if (oErr) throw oErr;

    const allOrders = (orders || []) as Array<Record<string, unknown>>;
    const totalRevenue = allOrders
      .filter((o) => o["status"] !== "cancelled")
      .reduce((s, o) => s + Number(o["grand_total"] || 0), 0);
    const pending = allOrders.filter((o) => o["status"] === "pending").length;
    const delivered = allOrders.filter((o) => o["status"] === "delivered").length;

    // 7-day revenue chart
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const label = d.toLocaleDateString("en-IN", { weekday: "short" });
      const dayKey = d.toDateString();
      const dayOrders = allOrders.filter(
        (o) => new Date(String(o["created_at"])).toDateString() === dayKey,
      );
      return {
        label,
        date: d.toISOString().split("T")[0],
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + Number(o["grand_total"] || 0), 0),
      };
    });

    const statusBreakdown: Record<string, number> = {};
    allOrders.forEach((o) => {
      const k = String(o["status"] || "pending");
      statusBreakdown[k] = (statusBreakdown[k] || 0) + 1;
    });

    res.json({
      stats: {
        total_orders: allOrders.length,
        pending_orders: pending,
        delivered_orders: delivered,
        total_revenue: Math.round(totalRevenue),
        product_count: productCount || 0,
        coupon_count: couponCount || 0,
        customer_count: customerCount || 0,
      },
      chart_7d: days,
      status_breakdown: statusBreakdown,
      recent_orders: allOrders.slice(0, 10),
    });
  } catch (err: unknown) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Failed to load dashboard" });
  }
});

export default router;
