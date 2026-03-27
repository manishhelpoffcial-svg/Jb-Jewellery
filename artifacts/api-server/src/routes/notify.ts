import { Router } from "express";
import { query } from "../lib/db.js";
import { adminMiddleware } from "../lib/auth.js";
import { sendNewArrivalNotification, sendRestockAlert, ADMIN_EMAIL } from "../lib/mailer.js";
import type { Request, Response } from "express";

const router = Router();

async function getActiveSubscribers(): Promise<string[]> {
  const result = await query(
    "SELECT email FROM jb_subscribers WHERE active = TRUE"
  );
  // Always include admin
  const emails = result.rows.map((r: { email: string }) => r.email) as string[];
  if (!emails.includes(ADMIN_EMAIL)) emails.push(ADMIN_EMAIL);
  return emails;
}

// ── New Arrival Notification ──────────────────────────────────────────────────
router.post("/new-arrival", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, category, price, originalPrice, discount } = req.body;
    if (!name || !price) {
      res.status(400).json({ error: "Product name and price are required" });
      return;
    }

    const subscribers = await getActiveSubscribers();

    sendNewArrivalNotification(subscribers, {
      name,
      category: category || "Jewellery",
      price: Number(price),
      originalPrice: Number(originalPrice || price),
      discount: Number(discount || 0),
    })
      .then(() => console.log(`[Mailer] New arrival email sent to ${subscribers.length} subscribers ✓`))
      .catch((err) => console.error("[Mailer] New arrival notification failed:", err));

    res.json({ success: true, notified: subscribers.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send new arrival notification" });
  }
});

// ── Restock Alert ─────────────────────────────────────────────────────────────
router.post("/restock", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, category, price } = req.body;
    if (!name || !price) {
      res.status(400).json({ error: "Product name and price are required" });
      return;
    }

    const subscribers = await getActiveSubscribers();

    sendRestockAlert(subscribers, {
      name,
      category: category || "Jewellery",
      price: Number(price),
    })
      .then(() => console.log(`[Mailer] Restock alert sent to ${subscribers.length} subscribers ✓`))
      .catch((err) => console.error("[Mailer] Restock alert failed:", err));

    res.json({ success: true, notified: subscribers.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send restock alert" });
  }
});

export default router;
