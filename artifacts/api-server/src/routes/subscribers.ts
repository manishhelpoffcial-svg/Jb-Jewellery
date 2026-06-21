import { Router } from "express";
import { query } from "../lib/db.js";
import { adminMiddleware } from "../lib/auth.js";
import { transporter, ADMIN_EMAIL } from "../lib/mailer.js";
import type { Request, Response } from "express";

const router = Router();

// ── Subscribe ─────────────────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    await query(
      `INSERT INTO jb_subscribers (email, name)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET active = TRUE`,
      [email.toLowerCase().trim(), name || ""]
    );

    // Welcome email to subscriber
    const welcomeHtml = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F5F5F0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#1A1A1A,#2D2D2D);padding:28px;text-align:center;">
      <div style="display:inline-block;background:#FFD700;border-radius:50%;width:52px;height:52px;line-height:52px;font-size:20px;font-weight:900;color:#111;margin-bottom:10px;">JB</div>
      <h1 style="margin:0;color:#FFD700;font-size:20px;font-weight:900;">JB JEWELLERY COLLECTION</h1>
    </div>
    <div style="padding:32px;text-align:center;">
      <p style="font-size:36px;margin:0 0 12px;">💌</p>
      <h2 style="margin:0 0 10px;font-size:22px;font-weight:900;color:#111;">You're In! Welcome Aboard.</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">Thank you for subscribing to <strong>JB Jewellery Collection</strong>. You'll be the first to know about new arrivals, restocks, and exclusive offers.</p>
      <div style="background:#FFFBE6;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#B45309;font-weight:600;">✨ New arrivals · 🔔 Restock alerts · 🎁 Special offers</p>
      </div>
    </div>
    <div style="background:#1A1A1A;padding:16px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#555;">© ${new Date().getFullYear()} JB Jewellery Collection</p>
    </div>
  </div>
</body></html>`;

    transporter.sendMail({
      from: `"JB Jewellery Collection" <${process.env.ZOHO_EMAIL}>`,
      to: email,
      subject: "💌 You're Subscribed – JB Jewellery Collection",
      html: welcomeHtml,
    }).catch((err) => console.error("[Mailer] Welcome email failed:", err));

    res.json({ success: true, message: "Subscribed successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// ── Unsubscribe ───────────────────────────────────────────────────────────────
router.delete("/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    await query("UPDATE jb_subscribers SET active = FALSE WHERE email = $1", [email.toLowerCase()]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

// ── All Subscribers (admin) ───────────────────────────────────────────────────
router.get("/", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT id, email, name, subscribed_at, active FROM jb_subscribers ORDER BY subscribed_at DESC"
    );
    res.json({ subscribers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch subscribers" });
  }
});

export default router;
