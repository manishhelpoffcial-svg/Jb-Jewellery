import { Router } from "express";
import { query } from "../lib/db.js";
import { adminMiddleware } from "../lib/auth.js";
import { transporter, ADMIN_EMAIL } from "../lib/mailer.js";
import type { Request, Response } from "express";

const router = Router();

// Get all customers with stats
router.get("/", adminMiddleware, async (_req: Request, res: Response) => {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active,
            u.created_at,
            COUNT(DISTINCT o.id) as order_count,
            COALESCE(SUM(o.grand_total), 0) as total_spent,
            MAX(o.created_at) as last_order_date
     FROM jb_users u
     LEFT JOIN jb_orders o ON o.user_id = u.id
     WHERE u.role = 'user'
     GROUP BY u.id ORDER BY u.created_at DESC`
  );
  res.json({ customers: result.rows });
});

// Get single customer detail
router.get("/:id", adminMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const [userRes, ordersRes, reviewsRes, addressesRes] = await Promise.all([
    query("SELECT id,name,email,phone,is_active,created_at FROM jb_users WHERE id=$1", [id]),
    query("SELECT * FROM jb_orders WHERE user_id=$1 ORDER BY created_at DESC", [id]),
    query("SELECT * FROM jb_reviews WHERE user_id=$1 ORDER BY created_at DESC", [id]),
    query("SELECT * FROM jb_addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at ASC", [id]),
  ]);
  if (userRes.rows.length === 0) { res.status(404).json({ error: "Customer not found" }); return; }
  res.json({
    customer: userRes.rows[0],
    orders: ordersRes.rows,
    reviews: reviewsRes.rows,
    addresses: addressesRes.rows,
  });
});

// Suspend / Activate account
router.patch("/:id/status", adminMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const result = await query(
    "UPDATE jb_users SET is_active=$1 WHERE id=$2 RETURNING name,email",
    [isActive, id]
  );
  if (result.rows.length === 0) { res.status(404).json({ error: "User not found" }); return; }

  const { name, email } = result.rows[0];
  const action = isActive ? "reactivated" : "suspended";
  const subject = isActive ? "Your JB Jewellery Account Has Been Reactivated" : "Your JB Jewellery Account Has Been Suspended";
  const bodyMsg = isActive
    ? "Great news! Your JB Jewellery account has been <strong style='color:#16a34a;'>reactivated</strong>. You can now log in and continue shopping."
    : "Your JB Jewellery account has been <strong style='color:#dc2626;'>suspended</strong>. If you believe this is a mistake, please contact us.";

  transporter.sendMail({
    from: `"JB Jewellery Collection" <${process.env.ZOHO_EMAIL}>`,
    to: email,
    subject,
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f9f9f9;padding:32px;"><div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.1);"><div style="background:#1A1A1A;padding:24px;text-align:center;"><span style="color:#FFD700;font-size:20px;font-weight:900;">JB JEWELLERY COLLECTION</span></div><div style="padding:28px;"><h2 style="margin:0 0 12px;color:#111;">Account ${action.charAt(0).toUpperCase() + action.slice(1)}</h2><p style="color:#555;font-size:15px;line-height:1.7;">Hi ${name},<br>${bodyMsg}</p><p style="color:#aaa;font-size:13px;margin-top:20px;">Contact us at <a href="mailto:${ADMIN_EMAIL}" style="color:#d97706;">${ADMIN_EMAIL}</a> for any queries.</p></div></div></body></html>`,
  }).catch(() => {});

  res.json({ success: true, action });
});

// Send custom email to customer
router.post("/:id/email", adminMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { subject, message } = req.body;
  const result = await query("SELECT name, email FROM jb_users WHERE id=$1", [id]);
  if (result.rows.length === 0) { res.status(404).json({ error: "User not found" }); return; }
  const { name, email } = result.rows[0];

  await transporter.sendMail({
    from: `"JB Jewellery Collection" <${process.env.ZOHO_EMAIL}>`,
    to: email,
    subject: subject || "Message from JB Jewellery",
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f9f9f9;padding:32px;"><div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.1);"><div style="background:#1A1A1A;padding:24px;text-align:center;"><span style="color:#FFD700;font-size:20px;font-weight:900;">JB JEWELLERY COLLECTION</span></div><div style="padding:28px;"><p style="color:#555;font-size:15px;line-height:1.8;white-space:pre-line;">${message}</p><p style="color:#aaa;font-size:12px;margin-top:20px;">— JB Jewellery Team</p></div></div></body></html>`,
  });
  res.json({ success: true });
});

// Export customers as CSV
router.get("/export/csv", adminMiddleware, async (_req: Request, res: Response) => {
  const result = await query(
    `SELECT u.name, u.email, u.phone, u.is_active, u.created_at,
            COUNT(DISTINCT o.id) as orders,
            COALESCE(SUM(o.grand_total),0) as total_spent,
            MAX(o.created_at) as last_order
     FROM jb_users u
     LEFT JOIN jb_orders o ON o.user_id = u.id
     WHERE u.role='user' GROUP BY u.id ORDER BY u.created_at DESC`
  );

  const header = "Name,Email,Phone,Status,Joined Date,Orders,Total Spent,Last Order";
  const rows = result.rows.map((r: Record<string, unknown>) =>
    [r.name, r.email, r.phone,
     r.is_active ? "Active" : "Suspended",
     r.created_at ? new Date(r.created_at as string).toLocaleDateString("en-IN") : "",
     r.orders, r.total_spent,
     r.last_order ? new Date(r.last_order as string).toLocaleDateString("en-IN") : ""
    ].map(v => `"${v}"`).join(",")
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=customers.csv");
  res.send([header, ...rows].join("\n"));
});

export default router;
