import { Router } from "express";
import type { Request, Response } from "express";
import { simpleAdminMiddleware } from "../lib/auth.js";
import {
  transporter,
  renderOrderConfirmationHtml,
  renderAdminOrderHtml,
  renderOrderConfirmedHtml,
  renderOrderShippedHtml,
  renderOrderDeliveredHtml,
  renderNewArrivalHtml,
  renderRestockHtml,
  shortOrderId,
  SAMPLE_ORDER,
  SAMPLE_ARRIVAL,
  SAMPLE_RESTOCK,
} from "../lib/mailer.js";

const router = Router();

const ZOHO_EMAIL = process.env.ZOHO_EMAIL || "";

type TemplateKey =
  | "order_received"
  | "admin_new_order"
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "new_arrival"
  | "restock";

type TemplateMeta = {
  key: TemplateKey;
  name: string;
  description: string;
  category: "Customer" | "Admin" | "Marketing";
  defaultSubject: string;
  audience: string;
};

const TEMPLATES: TemplateMeta[] = [
  {
    key: "order_received",
    name: "Order Received (Invoice)",
    description: "Sent to the customer immediately after they place an order. Includes invoice link, download invoice link, and a Pay-via-WhatsApp button.",
    category: "Customer",
    defaultSubject: `Invoice #${shortOrderId(SAMPLE_ORDER.id)} — Order Received | JB Jewellery`,
    audience: "Customer",
  },
  {
    key: "admin_new_order",
    name: "New Order Alert",
    description: "Internal notification sent to the admin inbox whenever a new order is placed.",
    category: "Admin",
    defaultSubject: `New Order #${shortOrderId(SAMPLE_ORDER.id)} — Action Required`,
    audience: "Admin",
  },
  {
    key: "order_confirmed",
    name: "Order Confirmed",
    description: "Sent to the customer when admin marks the order as Confirmed.",
    category: "Customer",
    defaultSubject: `Order Confirmed #${shortOrderId(SAMPLE_ORDER.id)} — JB Jewellery`,
    audience: "Customer",
  },
  {
    key: "order_shipped",
    name: "Order Shipped",
    description: "Sent to the customer when admin marks the order as Shipped.",
    category: "Customer",
    defaultSubject: `Your Order #${shortOrderId(SAMPLE_ORDER.id)} Has Been Shipped — JB Jewellery`,
    audience: "Customer",
  },
  {
    key: "order_delivered",
    name: "Order Delivered",
    description: "Sent to the customer when admin marks the order as Delivered.",
    category: "Customer",
    defaultSubject: `Your Order #${shortOrderId(SAMPLE_ORDER.id)} Has Been Delivered — JB Jewellery`,
    audience: "Customer",
  },
  {
    key: "new_arrival",
    name: "New Arrival Announcement",
    description: "Broadcast email sent to subscribers when a new product is launched.",
    category: "Marketing",
    defaultSubject: `New Arrival: ${SAMPLE_ARRIVAL.name} — JB Jewellery Collection`,
    audience: "Subscribers",
  },
  {
    key: "restock",
    name: "Back in Stock Alert",
    description: "Broadcast email sent to subscribers when a popular product is restocked.",
    category: "Marketing",
    defaultSubject: `Back in Stock: ${SAMPLE_RESTOCK.name} — JB Jewellery Collection`,
    audience: "Subscribers",
  },
];

async function renderTemplate(key: TemplateKey): Promise<string> {
  switch (key) {
    case "order_received":
      return await renderOrderConfirmationHtml(SAMPLE_ORDER);
    case "admin_new_order":
      return renderAdminOrderHtml(SAMPLE_ORDER);
    case "order_confirmed":
      return renderOrderConfirmedHtml({
        id: SAMPLE_ORDER.id,
        customer_name: SAMPLE_ORDER.customer_name,
        email: SAMPLE_ORDER.email,
        grand_total: SAMPLE_ORDER.grand_total,
        items: SAMPLE_ORDER.items,
        note: "Your order has been verified and packed with care.",
      });
    case "order_shipped":
      return renderOrderShippedHtml({
        id: SAMPLE_ORDER.id,
        customer_name: SAMPLE_ORDER.customer_name,
        email: SAMPLE_ORDER.email,
        grand_total: SAMPLE_ORDER.grand_total,
        address: SAMPLE_ORDER.address,
        note: "Tracking ID will be shared shortly via WhatsApp.",
      });
    case "order_delivered":
      return renderOrderDeliveredHtml({
        id: SAMPLE_ORDER.id,
        customer_name: SAMPLE_ORDER.customer_name,
        email: SAMPLE_ORDER.email,
        grand_total: SAMPLE_ORDER.grand_total,
        items: SAMPLE_ORDER.items,
        note: "Thank you for your order — we'd love a review!",
      });
    case "new_arrival":
      return renderNewArrivalHtml(SAMPLE_ARRIVAL);
    case "restock":
      return renderRestockHtml(SAMPLE_RESTOCK);
  }
}

// List all templates
router.get("/", simpleAdminMiddleware, (_req: Request, res: Response) => {
  res.json({ templates: TEMPLATES });
});

// Preview a template (returns HTML in the body for iframe srcdoc embedding)
router.get("/:key/preview", simpleAdminMiddleware, async (req: Request, res: Response) => {
  const key = req.params.key as TemplateKey;
  const meta = TEMPLATES.find((t) => t.key === key);
  if (!meta) {
    res.status(404).json({ error: "Template not found" });
    return;
  }
  try {
    const html = await renderTemplate(key);
    res.json({ template: meta, html });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to render template" });
  }
});

// Send a template to a chosen email address
router.post("/:key/send", simpleAdminMiddleware, async (req: Request, res: Response) => {
  const key = req.params.key as TemplateKey;
  const meta = TEMPLATES.find((t) => t.key === key);
  if (!meta) {
    res.status(404).json({ error: "Template not found" });
    return;
  }
  const { email, subject } = (req.body || {}) as { email?: string; subject?: string };
  if (!email || !/.+@.+\..+/.test(email)) {
    res.status(400).json({ error: "Valid recipient email required" });
    return;
  }
  if (!ZOHO_EMAIL) {
    res.status(500).json({ error: "ZOHO_EMAIL is not configured on the server" });
    return;
  }
  try {
    const html = await renderTemplate(key);
    await transporter.sendMail({
      from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
      to: email,
      subject: subject || meta.defaultSubject,
      html,
    });
    res.json({ success: true, sentTo: email });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to send email" });
  }
});

export default router;
