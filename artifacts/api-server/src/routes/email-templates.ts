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
import {
  TEMPLATE_REGISTRY,
  getTemplateMetaList,
  renderTemplateByKey,
  type TemplateMeta,
} from "../lib/mailer-templates.js";

const router = Router();

const ZOHO_EMAIL = process.env.ZOHO_EMAIL || "";

// ── Legacy templates that live directly in mailer.ts ────────────────────────
type LegacyKey =
  | "order_received"
  | "admin_new_order"
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "new_arrival"
  | "restock";

const LEGACY_TEMPLATES: TemplateMeta[] = [
  {
    key: "order_received",
    name: "Order Received (Invoice with Pay button)",
    description: "The full invoice email sent right after an order is placed (includes invoice + WhatsApp Pay buttons).",
    category: "Customer",
    defaultSubject: `Invoice #${shortOrderId(SAMPLE_ORDER.id)} — Order Received | JB Jewellery`,
    audience: "Customer",
  },
  {
    key: "admin_new_order",
    name: "Admin New Order Alert Mail",
    description: "Internal notification sent to the admin inbox whenever a new order is placed.",
    category: "Admin",
    defaultSubject: `New Order #${shortOrderId(SAMPLE_ORDER.id)} — Action Required`,
    audience: "Admin",
  },
  {
    key: "order_confirmed",
    name: "Order Confirmed (Status Update)",
    description: "Sent when admin marks the order as Confirmed.",
    category: "Customer",
    defaultSubject: `Order Confirmed #${shortOrderId(SAMPLE_ORDER.id)} — JB Jewellery`,
    audience: "Customer",
  },
  {
    key: "order_shipped",
    name: "Order Shipped (Status Update)",
    description: "Sent when admin marks the order as Shipped.",
    category: "Customer",
    defaultSubject: `Your Order #${shortOrderId(SAMPLE_ORDER.id)} Has Been Shipped — JB Jewellery`,
    audience: "Customer",
  },
  {
    key: "order_delivered",
    name: "Order Delivered (Status Update)",
    description: "Sent when admin marks the order as Delivered.",
    category: "Customer",
    defaultSubject: `Your Order #${shortOrderId(SAMPLE_ORDER.id)} Has Been Delivered — JB Jewellery`,
    audience: "Customer",
  },
  {
    key: "new_arrival",
    name: "New Arrival Announcement (broadcast)",
    description: "Broadcast email sent to subscribers when a new product is launched.",
    category: "Marketing",
    defaultSubject: `New Arrival: ${SAMPLE_ARRIVAL.name} — JB Jewellery Collection`,
    audience: "Subscribers",
  },
  {
    key: "restock",
    name: "Back in Stock Broadcast",
    description: "Broadcast email sent to subscribers when a popular product is restocked.",
    category: "Marketing",
    defaultSubject: `Back in Stock: ${SAMPLE_RESTOCK.name} — JB Jewellery Collection`,
    audience: "Subscribers",
  },
];

async function renderLegacyTemplate(key: LegacyKey): Promise<string> {
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

function isLegacy(key: string): key is LegacyKey {
  return LEGACY_TEMPLATES.some((t) => t.key === key);
}

function getAllTemplates(): TemplateMeta[] {
  // Legacy first (so the headline invoice email is always at the top), then registry.
  return [...LEGACY_TEMPLATES, ...getTemplateMetaList()];
}

async function renderAnyTemplate(
  key: string,
): Promise<{ meta: TemplateMeta; html: string } | null> {
  if (isLegacy(key)) {
    const meta = LEGACY_TEMPLATES.find((t) => t.key === key)!;
    const html = await renderLegacyTemplate(key as LegacyKey);
    return { meta, html };
  }
  if (TEMPLATE_REGISTRY[key]) {
    return renderTemplateByKey(key);
  }
  return null;
}

// ── Routes ──────────────────────────────────────────────────────────────────

router.get("/", simpleAdminMiddleware, (_req: Request, res: Response) => {
  res.json({ templates: getAllTemplates() });
});

router.get("/:key/preview", simpleAdminMiddleware, async (req: Request, res: Response) => {
  const result = await renderAnyTemplate(req.params.key).catch((err) => {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to render template" });
    return null;
  });
  if (!result) {
    if (!res.headersSent) res.status(404).json({ error: "Template not found" });
    return;
  }
  res.json(result);
});

router.post("/:key/send", simpleAdminMiddleware, async (req: Request, res: Response) => {
  const { email, subject } = (req.body || {}) as { email?: string; subject?: string };
  if (!email || !/.+@.+\..+/.test(email)) {
    res.status(400).json({ error: "Valid recipient email required" });
    return;
  }
  if (!ZOHO_EMAIL) {
    res.status(500).json({ error: "ZOHO_EMAIL is not configured on the server" });
    return;
  }

  const rendered = await renderAnyTemplate(req.params.key).catch((err) => {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to render template" });
    return null;
  });
  if (!rendered) {
    if (!res.headersSent) res.status(404).json({ error: "Template not found" });
    return;
  }

  try {
    await transporter.sendMail({
      from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
      to: email,
      subject: subject || rendered.meta.defaultSubject,
      html: rendered.html,
    });
    res.json({ success: true, sentTo: email });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to send email" });
  }
});

export default router;
