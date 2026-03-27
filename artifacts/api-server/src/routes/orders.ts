import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../lib/db.js";
import { authMiddleware, adminMiddleware, type JwtPayload } from "../lib/auth.js";
import {
  sendOrderConfirmation,
  sendAdminOrderNotification,
  sendOrderConfirmedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  ADMIN_EMAIL,
} from "../lib/mailer.js";
import type { Request, Response } from "express";

const router = Router();

// ── Create Order ──────────────────────────────────────────────────────────────
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user: JwtPayload }).user;
    const { customerName, phone, email, items, address, subtotal, shipping, tax, discount, couponCode, grandTotal } = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();
    const statusHistory = [{ status: "pending", timestamp: now, note: "Order placed" }];

    await query(
      `INSERT INTO jb_orders 
        (id, user_id, customer_name, phone, email, items, address, subtotal, shipping, tax, discount, coupon_code, grand_total, status, status_history, whatsapp_sent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        id, user.userId, customerName, phone, email,
        JSON.stringify(items), JSON.stringify(address),
        subtotal, shipping, tax, discount, couponCode || "", grandTotal,
        "pending", JSON.stringify(statusHistory), false,
      ]
    );

    const result = await query("SELECT * FROM jb_orders WHERE id = $1", [id]);
    const order = result.rows[0];

    const emailOrder = {
      id,
      customer_name: customerName,
      email,
      phone,
      items,
      address,
      subtotal,
      shipping,
      discount,
      grand_total: grandTotal,
      coupon_code: couponCode,
      created_at: now,
    };

    // Send order received confirmation + admin alert
    Promise.allSettled([
      sendOrderConfirmation(emailOrder),
      sendAdminOrderNotification({ ...emailOrder, grand_total: grandTotal }),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`[Mailer] ${i === 0 ? "Customer confirmation" : "Admin alert"} failed:`, r.reason);
        } else {
          console.log(`[Mailer] ${i === 0 ? "Customer confirmation" : "Admin alert"} sent ✓`);
        }
      });
    });

    res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ── My Orders ─────────────────────────────────────────────────────────────────
router.get("/my", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user: JwtPayload }).user;
    const result = await query(
      "SELECT * FROM jb_orders WHERE user_id = $1 ORDER BY created_at DESC",
      [user.userId]
    );
    res.json({ orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ── All Orders (admin) ────────────────────────────────────────────────────────
router.get("/all", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const result = await query("SELECT * FROM jb_orders ORDER BY created_at DESC");
    res.json({ orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ── Update Order Status (admin) ───────────────────────────────────────────────
router.patch("/:id/status", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const existing = await query("SELECT * FROM jb_orders WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const order = existing.rows[0];
    const history = Array.isArray(order.status_history) ? order.status_history : [];
    history.push({ status, timestamp: new Date().toISOString(), note: note || "" });

    await query(
      "UPDATE jb_orders SET status = $1, status_history = $2 WHERE id = $3",
      [status, JSON.stringify(history), id]
    );

    const updated = await query("SELECT * FROM jb_orders WHERE id = $1", [id]);
    const updatedOrder = updated.rows[0];

    // Trigger specific emails based on status change
    if (order.email) {
      const baseInfo = {
        id,
        customer_name: order.customer_name,
        email: order.email,
        grand_total: Number(order.grand_total),
        note: note || "",
      };

      let emailPromise: Promise<void> | null = null;

      if (status === "confirmed") {
        emailPromise = sendOrderConfirmedEmail({
          ...baseInfo,
          items: Array.isArray(order.items) ? order.items : [],
        });
      } else if (status === "shipped") {
        emailPromise = sendOrderShippedEmail({
          ...baseInfo,
          address: typeof order.address === "object" ? order.address : {},
        });
      } else if (status === "delivered") {
        emailPromise = sendOrderDeliveredEmail({
          ...baseInfo,
          items: Array.isArray(order.items) ? order.items : [],
        });
      }

      if (emailPromise) {
        emailPromise
          .then(() => console.log(`[Mailer] ${status} email sent to ${order.email} ✓`))
          .catch((err) => console.error(`[Mailer] ${status} email failed:`, err));
      }
    }

    res.json({ order: updatedOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// ── Customers (admin) ─────────────────────────────────────────────────────────
router.get("/customers", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
              COUNT(o.id) as order_count,
              COALESCE(SUM(o.grand_total), 0) as total_spent
       FROM jb_users u
       LEFT JOIN jb_orders o ON o.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json({ customers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

export default router;
