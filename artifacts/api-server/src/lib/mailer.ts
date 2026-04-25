import nodemailer from "nodemailer";
import { supabaseAdmin, isSupabaseAdminConfigured } from "./supabaseAdmin.js";

export const ZOHO_EMAIL = process.env.ZOHO_EMAIL || "";
const ZOHO_APP_PASSWORD = process.env.ZOHO_APP_PASSWORD || "";
export const ADMIN_EMAIL = "amritabiswas7432@gmail.com";

export const transporter = nodemailer.createTransport({
  host: "smtp.zoho.in",
  port: 465,
  secure: true,
  auth: {
    user: ZOHO_EMAIL,
    pass: ZOHO_APP_PASSWORD,
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────
export function formatPrice(p: number) {
  return `₹${Number(p).toLocaleString("en-IN")}`;
}

function formatAddress(address: Record<string, string>) {
  return [address.line1, address.line2, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
}

export function shortOrderId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function publicBaseUrl(): string {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "";
}

export function invoiceUrl(orderId: string): string {
  const base = publicBaseUrl();
  return `${base}/api/orders/${orderId}/invoice`;
}

export function invoiceDownloadUrl(orderId: string): string {
  return `${invoiceUrl(orderId)}?download=1`;
}

// ── Site settings (cached for 60s) ───────────────────────────────────────────
type SiteSettingsShape = {
  social?: { whatsapp?: string };
  footer?: { phone?: string; email?: string; address?: string };
};

let _settingsCache: { data: SiteSettingsShape; ts: number } | null = null;

async function getSiteSettings(): Promise<SiteSettingsShape> {
  if (_settingsCache && Date.now() - _settingsCache.ts < 60_000) return _settingsCache.data;
  if (!isSupabaseAdminConfigured) return {};
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("data")
      .eq("key", "global")
      .maybeSingle();
    const ss = (data?.data || {}) as SiteSettingsShape;
    _settingsCache = { data: ss, ts: Date.now() };
    return ss;
  } catch {
    return {};
  }
}

/** Returns the WhatsApp number (digits only, e.g. "919999999999"). */
export async function getWhatsappNumber(): Promise<string> {
  const s = await getSiteSettings();
  const url = s.social?.whatsapp || "https://wa.me/919999999999";
  const m = url.match(/(\d{8,15})/);
  return m ? m[1] : "919999999999";
}

export async function buildWhatsappPayLink(order: {
  id: string;
  customer_name: string;
  grand_total: number;
}): Promise<string> {
  const number = await getWhatsappNumber();
  const text =
    `Hi JB Jewellery, I just placed order #${shortOrderId(order.id)}.\n\n` +
    `Name: ${order.customer_name}\n` +
    `Amount: ${formatPrice(order.grand_total)}\n\n` +
    `Please share the available payment methods (UPI / Bank transfer / etc.) so I can complete the payment.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

// ── Inline SVG icons (email-safe, monochrome) ────────────────────────────────
export const icon = {
  receipt: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  truck: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h15v13H1z"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  package: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  bell: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  sparkle: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/></svg>`,
  alert: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#777" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.92.37 1.82.7 2.68a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.4-1.27a2 2 0 0 1 2.11-.45c.86.33 1.76.57 2.68.7A2 2 0 0 1 22 16.92z"/></svg>`,
  pin: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#777" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.555-5.338 11.89-11.893 11.89a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>`,
  download: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  view: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

export function iconCircle(svg: string, bg: string) {
  return `<div style="width:64px;height:64px;background:${bg};border-radius:50%;display:inline-block;line-height:64px;text-align:center;margin-bottom:14px;"><span style="display:inline-block;vertical-align:middle;line-height:0;">${svg}</span></div>`;
}

// Email-safe button using bulletproof table layout
export function buttonLink(opts: { href: string; bg: string; color: string; label: string; iconSvg?: string }) {
  const inner = opts.iconSvg
    ? `<span style="display:inline-block;vertical-align:middle;line-height:0;margin-right:8px;">${opts.iconSvg}</span><span style="display:inline-block;vertical-align:middle;">${opts.label}</span>`
    : opts.label;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;margin:6px;"><tr><td style="background:${opts.bg};border-radius:10px;">
    <a href="${opts.href}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:800;color:${opts.color};text-decoration:none;letter-spacing:0.3px;">${inner}</a>
  </td></tr></table>`;
}

export function emailBase(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>JB Jewellery Collection</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#111;">
  <div style="max-width:640px;margin:32px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0F0F0F 0%,#262626 100%);padding:32px;text-align:center;">
      <div style="display:inline-block;background:#FFD700;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:22px;font-weight:900;color:#111;margin-bottom:14px;">JB</div>
      <h1 style="margin:0;color:#FFD700;font-size:20px;font-weight:900;letter-spacing:1.5px;">JB JEWELLERY COLLECTION</h1>
      <p style="margin:6px 0 0;color:#9a9a9a;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;">Premium Fashion Jewellery</p>
    </div>
    ${content}
    <!-- Footer -->
    <div style="background:#0F0F0F;padding:22px 32px;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;color:#888;">Need help? Contact us at <a href="mailto:${ZOHO_EMAIL}" style="color:#FFD700;text-decoration:none;font-weight:700;">${ZOHO_EMAIL}</a></p>
      <p style="margin:0;font-size:11px;color:#555;">© ${new Date().getFullYear()} JB Jewellery Collection · All rights reserved</p>
    </div>
  </div>
</body>
</html>`;
}

function orderIdBadge(id: string) {
  return `
    <div style="background:#0F0F0F;border-radius:10px;padding:14px 20px;margin:0 0 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="color:#aaa;font-size:11px;font-weight:700;letter-spacing:1.5px;">ORDER ID</td>
        <td style="color:#FFD700;font-size:16px;font-weight:900;font-family:'Courier New',monospace;text-align:right;">#${shortOrderId(id)}</td>
      </tr></table>
    </div>`;
}

// ── 1. Order Confirmation / Invoice → Customer ───────────────────────────────
export type OrderEmailData = {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  address: Record<string, string>;
  subtotal: number;
  shipping: number;
  discount: number;
  grand_total: number;
  coupon_code?: string;
  created_at: string;
};

export async function renderOrderConfirmationHtml(order: OrderEmailData): Promise<string> {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #F0F0F0;font-size:14px;color:#333;">${item.name}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #F0F0F0;text-align:center;font-size:14px;color:#555;">${item.quantity}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #F0F0F0;text-align:right;font-size:14px;font-weight:700;color:#111;">${formatPrice(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join("");

  const waLink = await buildWhatsappPayLink(order);
  const invoice = invoiceUrl(order.id);
  const invoiceDl = invoiceDownloadUrl(order.id);

  const content = `
    <div style="padding:32px 32px 0;text-align:center;">
      ${iconCircle(icon.receipt, "#FFFBE6")}
      <h2 style="margin:0;font-size:22px;font-weight:900;color:#111;">Order Received</h2>
      <p style="margin:8px 0 0;color:#666;font-size:14px;line-height:1.6;">Hi <strong style="color:#111;">${order.customer_name}</strong>, thank you for shopping with JB Jewellery Collection. Your order has been received and is awaiting confirmation.</p>
    </div>

    <div style="padding:28px 32px 0;">
      ${orderIdBadge(order.id)}

      <p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#999;">Order Summary</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #F0F0F0;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#FAFAFA;">
            <th style="padding:10px 8px;text-align:left;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
            <th style="padding:10px 8px;text-align:center;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <table style="width:100%;margin-top:16px;background:#FAFAFA;border-radius:10px;border-collapse:separate;">
        <tr><td style="padding:10px 20px;font-size:14px;color:#777;">Subtotal</td><td style="padding:10px 20px;font-size:14px;color:#333;text-align:right;">${formatPrice(order.subtotal)}</td></tr>
        ${order.discount > 0 ? `<tr><td style="padding:6px 20px;font-size:14px;color:#16a34a;">Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}</td><td style="padding:6px 20px;font-size:14px;color:#16a34a;font-weight:700;text-align:right;">−${formatPrice(order.discount)}</td></tr>` : ""}
        <tr><td style="padding:6px 20px 14px;font-size:14px;color:#777;border-bottom:1px solid #E8E8E8;">Shipping</td><td style="padding:6px 20px 14px;font-size:14px;color:${order.shipping === 0 ? "#16a34a" : "#333"};text-align:right;border-bottom:1px solid #E8E8E8;">${order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</td></tr>
        <tr><td style="padding:14px 20px;font-size:16px;font-weight:900;color:#111;">Grand Total</td><td style="padding:14px 20px;font-size:18px;font-weight:900;color:#111;text-align:right;">${formatPrice(order.grand_total)}</td></tr>
      </table>
    </div>

    <!-- Action buttons -->
    <div style="padding:24px 32px 0;text-align:center;">
      <p style="margin:0 0 14px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#999;">Invoice & Payment</p>
      ${buttonLink({ href: invoice, bg: "#FFD700", color: "#111", label: "View Invoice", iconSvg: icon.view })}
      ${buttonLink({ href: invoiceDl, bg: "#F5F5F5", color: "#111", label: "Download Invoice", iconSvg: icon.download })}
      <br>
      ${buttonLink({ href: waLink, bg: "#25D366", color: "#fff", label: "Pay via WhatsApp", iconSvg: icon.whatsapp })}
      <p style="margin:14px 0 0;font-size:12px;color:#999;line-height:1.6;">Click <strong>Pay via WhatsApp</strong> to message us — we'll share UPI / bank-transfer / other payment options.</p>
    </div>

    <div style="padding:24px 32px 0;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#999;">Delivery Address</p>
      <div style="background:#F9F9F9;border:1px solid #EFEFEF;border-radius:10px;padding:16px 20px;">
        <table role="presentation" width="100%"><tr>
          <td style="vertical-align:top;padding-right:8px;width:18px;">${icon.pin}</td>
          <td style="font-size:14px;color:#333;line-height:1.6;">${formatAddress(order.address)}</td>
        </tr></table>
        <table role="presentation" width="100%" style="margin-top:6px;"><tr>
          <td style="vertical-align:middle;padding-right:8px;width:18px;">${icon.phone}</td>
          <td style="font-size:13px;color:#777;">${order.phone}</td>
        </tr></table>
      </div>
    </div>

    <div style="margin:24px 32px 32px;background:linear-gradient(135deg,#FFFBE6,#FFF8D6);border:1px solid #F5E89A;border-radius:12px;padding:18px 22px;text-align:center;">
      <p style="margin:0;font-size:14px;color:#5b4a00;line-height:1.6;">You will receive another email once your order is <strong style="color:#111;">confirmed</strong> by our team. Most orders are confirmed within <strong style="color:#111;">2–4 hours</strong>.</p>
    </div>`;

  return emailBase(content);
}

export async function sendOrderConfirmation(order: OrderEmailData) {
  const html = await renderOrderConfirmationHtml(order);
  await transporter.sendMail({
    from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
    to: order.email,
    subject: `Invoice #${shortOrderId(order.id)} — Order Received | JB Jewellery`,
    html,
  });
}

// ── 2. New Order Alert → Admin ───────────────────────────────────────────────
export type AdminOrderEmailData = {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  address: Record<string, string>;
  grand_total: number;
  created_at: string;
};

export function renderAdminOrderHtml(order: AdminOrderEmailData): string {
  const itemsList = order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${i.name}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:13px;">${i.quantity}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;font-weight:700;">${formatPrice(i.price * i.quantity)}</td></tr>`,
    )
    .join("");

  const content = `
    <div style="padding:28px 32px;">
      <div style="background:#DC2626;border-radius:10px;padding:14px 18px;margin-bottom:22px;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
          <td style="vertical-align:middle;padding-right:10px;line-height:0;">${icon.alert}</td>
          <td style="vertical-align:middle;color:#fff;font-weight:800;font-size:14px;letter-spacing:0.5px;">NEW ORDER — ACTION REQUIRED</td>
        </tr></table>
      </div>

      <div style="background:#FFFBE6;border-left:4px solid #FFD700;border-radius:0 8px 8px 0;padding:14px 20px;margin-bottom:20px;">
        <p style="margin:0;font-size:11px;color:#888;letter-spacing:0.5px;font-weight:700;">ORDER ID</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:900;color:#111;font-family:'Courier New',monospace;">#${shortOrderId(order.id)}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#aaa;">${new Date(order.created_at).toLocaleString("en-IN")}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">
        <tr><td style="padding:8px 0;color:#888;width:130px;font-weight:600;">Customer</td><td style="padding:8px 0;font-weight:700;">${order.customer_name}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-weight:600;">Email</td><td style="padding:8px 0;">${order.email}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-weight:600;">Phone</td><td style="padding:8px 0;">${order.phone}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-weight:600;vertical-align:top;">Address</td><td style="padding:8px 0;">${formatAddress(order.address)}</td></tr>
      </table>

      <p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#999;">Items Ordered</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #F0F0F0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
        <thead><tr style="background:#FAFAFA;"><th style="padding:8px 12px;text-align:left;font-size:11px;color:#999;font-weight:700;">Item</th><th style="padding:8px 12px;text-align:center;font-size:11px;color:#999;font-weight:700;">Qty</th><th style="padding:8px 12px;text-align:right;font-size:11px;color:#999;font-weight:700;">Total</th></tr></thead>
        <tbody>${itemsList}</tbody>
      </table>

      <div style="background:#0F0F0F;border-radius:10px;padding:18px 20px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:#aaa;font-weight:700;letter-spacing:1px;">GRAND TOTAL</p>
        <p style="margin:0;font-size:26px;font-weight:900;color:#FFD700;">${formatPrice(order.grand_total)}</p>
      </div>
    </div>`;

  return emailBase(content);
}

export async function sendAdminOrderNotification(order: AdminOrderEmailData) {
  await transporter.sendMail({
    from: `"JB Jewellery System" <${ZOHO_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `New Order #${shortOrderId(order.id)} — ${formatPrice(order.grand_total)} from ${order.customer_name}`,
    html: renderAdminOrderHtml(order),
  });
}

// ── 3. Order Confirmed → Customer ────────────────────────────────────────────
export type StatusEmailData = {
  id: string;
  customer_name: string;
  email: string;
  grand_total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  note?: string;
};

export function renderOrderConfirmedHtml(order: StatusEmailData): string {
  const itemsSummary = order.items.map((i) => `${i.name} × ${i.quantity}`).join(", ");
  const content = `
    <div style="padding:32px;text-align:center;">
      ${iconCircle(icon.check, "#E8F5E9")}
      <h2 style="margin:0;font-size:22px;font-weight:900;color:#111;">Order Confirmed</h2>
      <p style="margin:8px 0 18px;color:#666;font-size:14px;">Great news — your order has been accepted.</p>
    </div>

    <div style="padding:0 32px;">
      ${orderIdBadge(order.id)}

      <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.7;">Hi <strong style="color:#111;">${order.customer_name}</strong>, your order for <em>${itemsSummary}</em> has been <strong style="color:#16a34a;">confirmed</strong> and our team has started processing it.</p>
      ${order.note ? `<div style="background:#F0F8FF;border:1px solid #B3D9FF;border-radius:10px;padding:14px 18px;margin-bottom:20px;"><p style="margin:0;font-size:12px;color:#888;font-weight:700;letter-spacing:0.5px;">NOTE FROM OUR TEAM</p><p style="margin:6px 0 0;font-size:14px;color:#333;">${order.note}</p></div>` : ""}

      <table style="width:100%;background:#F9F9F9;border-radius:10px;margin-bottom:24px;">
        <tr><td style="padding:14px 20px;font-size:14px;color:#777;">Order Total</td><td style="padding:14px 20px;font-size:17px;font-weight:900;color:#111;text-align:right;">${formatPrice(order.grand_total)}</td></tr>
      </table>
    </div>

    <div style="margin:0 32px 32px;background:linear-gradient(135deg,#FFFBE6,#FFF8D6);border-radius:12px;padding:20px;text-align:center;">
      <p style="margin:0;font-size:14px;color:#5b4a00;line-height:1.6;">We will notify you once your order is <strong style="color:#111;">shipped</strong>. Expected dispatch within <strong style="color:#111;">1–2 business days</strong>.</p>
    </div>`;

  return emailBase(content);
}

export async function sendOrderConfirmedEmail(order: StatusEmailData) {
  await transporter.sendMail({
    from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
    to: order.email,
    subject: `Order Confirmed #${shortOrderId(order.id)} — JB Jewellery`,
    html: renderOrderConfirmedHtml(order),
  });
}

// ── 4. Order Shipped → Customer ──────────────────────────────────────────────
export type ShippedEmailData = {
  id: string;
  customer_name: string;
  email: string;
  grand_total: number;
  address: Record<string, string>;
  note?: string;
};

export function renderOrderShippedHtml(order: ShippedEmailData): string {
  const content = `
    <div style="padding:32px;text-align:center;">
      ${iconCircle(icon.truck, "#EDE7F6")}
      <h2 style="margin:0;font-size:22px;font-weight:900;color:#111;">Your Order is on its Way</h2>
      <p style="margin:8px 0 18px;color:#666;font-size:14px;">Sit tight — your jewellery is heading to you.</p>
    </div>

    <div style="padding:0 32px;">
      ${orderIdBadge(order.id)}

      <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">Hi <strong style="color:#111;">${order.customer_name}</strong>, your JB Jewellery order has been <strong style="color:#7C3AED;">shipped</strong> and is on its way to you.</p>
      ${order.note ? `<div style="background:#F3E8FF;border:1px solid #C4B5FD;border-radius:10px;padding:14px 18px;margin-bottom:20px;"><p style="margin:0;font-size:12px;color:#888;font-weight:700;letter-spacing:0.5px;">SHIPPING NOTE</p><p style="margin:6px 0 0;font-size:14px;color:#333;">${order.note}</p></div>` : ""}

      <div style="background:#F9F9F9;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:11px;color:#999;font-weight:700;letter-spacing:1.5px;">DELIVERING TO</p>
        <p style="margin:0;font-size:14px;color:#333;line-height:1.7;">${formatAddress(order.address)}</p>
      </div>

      <div style="background:linear-gradient(135deg,#EDE7F6,#F3E8FF);border:1px solid #DDD6FE;border-radius:12px;padding:18px;text-align:center;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#5b21b6;line-height:1.6;">Expected delivery within <strong style="color:#7C3AED;">3–5 business days</strong>.</p>
      </div>

      <table style="width:100%;border-top:1px solid #F0F0F0;margin-bottom:24px;">
        <tr><td style="padding-top:16px;font-size:14px;color:#777;">Order Total</td><td style="padding-top:16px;font-size:17px;font-weight:900;color:#111;text-align:right;">${formatPrice(order.grand_total)}</td></tr>
      </table>
    </div>`;

  return emailBase(content);
}

export async function sendOrderShippedEmail(order: ShippedEmailData) {
  await transporter.sendMail({
    from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
    to: order.email,
    subject: `Your Order #${shortOrderId(order.id)} Has Been Shipped — JB Jewellery`,
    html: renderOrderShippedHtml(order),
  });
}

// ── 5. Order Delivered → Customer ────────────────────────────────────────────
export function renderOrderDeliveredHtml(order: StatusEmailData): string {
  const itemsSummary = order.items.map((i) => `${i.name} × ${i.quantity}`).join(", ");
  const content = `
    <div style="padding:32px;text-align:center;">
      ${iconCircle(icon.package, "#FFFBE6")}
      <h2 style="margin:0;font-size:22px;font-weight:900;color:#111;">Order Delivered</h2>
      <p style="margin:8px 0 18px;color:#666;font-size:14px;">Your jewellery has arrived.</p>
    </div>

    <div style="padding:0 32px;">
      ${orderIdBadge(order.id)}

      <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">Hi <strong style="color:#111;">${order.customer_name}</strong>, your order for <em>${itemsSummary}</em> has been successfully <strong style="color:#16a34a;">delivered</strong>. We hope you love your new jewellery.</p>
      ${order.note ? `<div style="background:#E8F5E9;border:1px solid #A7F3D0;border-radius:10px;padding:14px 18px;margin-bottom:20px;"><p style="margin:0;font-size:12px;color:#888;font-weight:700;letter-spacing:0.5px;">NOTE</p><p style="margin:6px 0 0;font-size:14px;color:#333;">${order.note}</p></div>` : ""}

      <div style="background:linear-gradient(135deg,#FFFBE6,#FFF0B3);border:1px solid #F5E89A;border-radius:12px;padding:22px;text-align:center;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;color:#5b4a00;line-height:1.6;font-weight:600;">We'd love to hear what you think.<br>Share your experience and help us grow.</p>
      </div>

      <table style="width:100%;border-top:1px solid #F0F0F0;margin-bottom:24px;">
        <tr><td style="padding-top:16px;font-size:14px;color:#777;">Order Total Paid</td><td style="padding-top:16px;font-size:17px;font-weight:900;color:#111;text-align:right;">${formatPrice(order.grand_total)}</td></tr>
      </table>
    </div>`;

  return emailBase(content);
}

export async function sendOrderDeliveredEmail(order: StatusEmailData) {
  await transporter.sendMail({
    from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
    to: order.email,
    subject: `Your Order #${shortOrderId(order.id)} Has Been Delivered — JB Jewellery`,
    html: renderOrderDeliveredHtml(order),
  });
}

// ── 6. New Arrival → Subscribers ─────────────────────────────────────────────
export type NewArrivalData = {
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: number;
};

export function renderNewArrivalHtml(product: NewArrivalData): string {
  const content = `
    <div style="padding:32px;text-align:center;">
      ${iconCircle(icon.sparkle, "#FFFBE6")}
      <div style="display:inline-block;background:#FFFBE6;border:1px solid #FFD700;border-radius:8px;padding:5px 12px;font-size:11px;font-weight:800;color:#B45309;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">New Arrival</div>
      <h2 style="margin:0;font-size:22px;font-weight:900;color:#111;">Fresh Styles Just Landed</h2>
      <p style="margin:8px 0 0;color:#666;font-size:14px;">A stunning new addition to our collection.</p>
    </div>

    <div style="padding:0 32px;">
      <div style="background:#0F0F0F;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;color:#888;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;">Just In — ${product.category}</p>
        <p style="margin:0 0 16px;font-size:20px;font-weight:900;color:#FFD700;line-height:1.3;">${product.name}</p>
        <table role="presentation" style="margin:0 auto;background:#1f1f1f;border-radius:8px;"><tr>
          <td style="padding:10px 14px;text-decoration:line-through;color:#666;font-size:14px;">${formatPrice(product.originalPrice)}</td>
          <td style="padding:10px 14px;font-size:22px;font-weight:900;color:#FFD700;">${formatPrice(product.price)}</td>
          <td style="padding:10px 14px;"><span style="background:#FFD700;color:#111;font-size:11px;font-weight:800;padding:4px 9px;border-radius:4px;">${product.discount}% OFF</span></td>
        </tr></table>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        ${buttonLink({ href: publicBaseUrl() || "#", bg: "#FFD700", color: "#111", label: "Shop Now" })}
      </div>

      <p style="margin:0 0 24px;text-align:center;font-size:12px;color:#aaa;">You're receiving this because you subscribed to JB Jewellery updates.</p>
    </div>`;

  return emailBase(content);
}

export async function sendNewArrivalNotification(subscribers: string[], product: NewArrivalData) {
  if (subscribers.length === 0) return;
  const html = renderNewArrivalHtml(product);
  await Promise.allSettled(
    subscribers.map((email) =>
      transporter.sendMail({
        from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
        to: email,
        subject: `New Arrival: ${product.name} — JB Jewellery Collection`,
        html,
      }),
    ),
  );
}

// ── 7. Restock Alert → Subscribers ───────────────────────────────────────────
export type RestockData = { name: string; category: string; price: number };

export function renderRestockHtml(product: RestockData): string {
  const content = `
    <div style="padding:32px;text-align:center;">
      ${iconCircle(icon.bell, "#E8F5E9")}
      <div style="display:inline-block;background:#E8F5E9;border:1px solid #4CAF50;border-radius:8px;padding:5px 12px;font-size:11px;font-weight:800;color:#16a34a;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Back in Stock</div>
      <h2 style="margin:0;font-size:22px;font-weight:900;color:#111;">It's Back. Don't Miss Out.</h2>
      <p style="margin:8px 0 0;color:#666;font-size:14px;">A favourite item is available again.</p>
    </div>

    <div style="padding:0 32px;">
      <div style="background:#0F0F0F;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;color:#888;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;">Restocked — ${product.category}</p>
        <p style="margin:0 0 16px;font-size:20px;font-weight:900;color:#4CAF50;line-height:1.3;">${product.name}</p>
        <p style="margin:0;font-size:26px;font-weight:900;color:#FFD700;">${formatPrice(product.price)}</p>
      </div>

      <div style="background:#E8F5E9;border:1px solid #A7F3D0;border-radius:10px;padding:14px;text-align:center;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#16a34a;font-weight:700;">Limited Stock — Order Before It Sells Out Again</p>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        ${buttonLink({ href: publicBaseUrl() || "#", bg: "#FFD700", color: "#111", label: "Grab It Now" })}
      </div>

      <p style="margin:0 0 24px;text-align:center;font-size:12px;color:#aaa;">You're receiving this because you subscribed to JB Jewellery updates.</p>
    </div>`;

  return emailBase(content);
}

export async function sendRestockAlert(subscribers: string[], product: RestockData) {
  if (subscribers.length === 0) return;
  const html = renderRestockHtml(product);
  await Promise.allSettled(
    subscribers.map((email) =>
      transporter.sendMail({
        from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
        to: email,
        subject: `Back in Stock: ${product.name} — JB Jewellery Collection`,
        html,
      }),
    ),
  );
}

// ── 8. Standalone Invoice (HTML for browser viewing / PDF print) ─────────────
export function renderInvoiceStandaloneHtml(order: OrderEmailData & { status?: string }): string {
  const itemsHtml = order.items
    .map(
      (item, i) => `
      <tr>
        <td style="padding:14px 12px;border-bottom:1px solid #EEE;font-size:13px;color:#777;">${i + 1}</td>
        <td style="padding:14px 12px;border-bottom:1px solid #EEE;font-size:14px;color:#111;font-weight:600;">${item.name}</td>
        <td style="padding:14px 12px;border-bottom:1px solid #EEE;font-size:14px;color:#555;text-align:center;">${item.quantity}</td>
        <td style="padding:14px 12px;border-bottom:1px solid #EEE;font-size:14px;color:#333;text-align:right;">${formatPrice(item.price)}</td>
        <td style="padding:14px 12px;border-bottom:1px solid #EEE;font-size:14px;color:#111;font-weight:700;text-align:right;">${formatPrice(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice #${shortOrderId(order.id)} — JB Jewellery Collection</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:32px 16px;background:#F5F5F0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#111;}
  .sheet{max-width:820px;margin:0 auto;background:#fff;border-radius:14px;box-shadow:0 6px 32px rgba(0,0,0,0.08);overflow:hidden;}
  .toolbar{max-width:820px;margin:0 auto 14px;display:flex;gap:10px;justify-content:flex-end;}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:800;border:0;cursor:pointer;text-decoration:none;}
  .btn-dark{background:#0F0F0F;color:#FFD700;}
  .btn-light{background:#fff;color:#111;border:1px solid #ddd;}
  table{width:100%;border-collapse:collapse;}
  @media print{body{background:#fff;padding:0}.toolbar{display:none}.sheet{box-shadow:none;border-radius:0;max-width:100%}}
</style>
</head>
<body>
  <div class="toolbar">
    <button class="btn btn-light" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="sheet">
    <div style="padding:34px 40px;background:linear-gradient(135deg,#0F0F0F 0%,#262626 100%);color:#fff;">
      <table>
        <tr>
          <td style="vertical-align:top">
            <div style="display:inline-block;background:#FFD700;border-radius:50%;width:54px;height:54px;line-height:54px;text-align:center;font-size:22px;font-weight:900;color:#111;margin-bottom:10px;">JB</div>
            <h1 style="margin:0;color:#FFD700;font-size:18px;font-weight:900;letter-spacing:1.5px;">JB JEWELLERY COLLECTION</h1>
            <p style="margin:4px 0 0;color:#999;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Premium Fashion Jewellery</p>
          </td>
          <td style="vertical-align:top;text-align:right;">
            <p style="margin:0;color:#999;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;">Invoice</p>
            <p style="margin:4px 0 0;color:#FFD700;font-size:22px;font-weight:900;font-family:'Courier New',monospace;">#${shortOrderId(order.id)}</p>
            <p style="margin:6px 0 0;color:#aaa;font-size:12px;">${new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
            ${order.status ? `<span style="display:inline-block;margin-top:8px;background:#FFD700;color:#111;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">${order.status}</span>` : ""}
          </td>
        </tr>
      </table>
    </div>

    <div style="padding:30px 40px;">
      <table>
        <tr>
          <td style="vertical-align:top;width:50%;padding-right:20px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#999;letter-spacing:1.2px;text-transform:uppercase;">Billed To</p>
            <p style="margin:0;font-size:15px;color:#111;font-weight:700;">${order.customer_name}</p>
            <p style="margin:6px 0 0;font-size:13px;color:#555;line-height:1.6;">${formatAddress(order.address)}</p>
            <p style="margin:6px 0 0;font-size:13px;color:#555;">${order.email}</p>
            <p style="margin:2px 0 0;font-size:13px;color:#555;">${order.phone}</p>
          </td>
          <td style="vertical-align:top;width:50%;padding-left:20px;border-left:1px solid #EEE;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#999;letter-spacing:1.2px;text-transform:uppercase;">From</p>
            <p style="margin:0;font-size:15px;color:#111;font-weight:700;">JB Jewellery Collection</p>
            <p style="margin:6px 0 0;font-size:13px;color:#555;line-height:1.6;">Premium Fashion Jewellery<br>India</p>
            <p style="margin:6px 0 0;font-size:13px;color:#555;">${ZOHO_EMAIL}</p>
          </td>
        </tr>
      </table>
    </div>

    <div style="padding:0 40px 14px;">
      <table style="border:1px solid #EEE;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#FAFAFA;">
            <th style="padding:12px;text-align:left;font-size:11px;color:#999;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;width:40px;">#</th>
            <th style="padding:12px;text-align:left;font-size:11px;color:#999;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">Description</th>
            <th style="padding:12px;text-align:center;font-size:11px;color:#999;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;width:70px;">Qty</th>
            <th style="padding:12px;text-align:right;font-size:11px;color:#999;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;width:100px;">Price</th>
            <th style="padding:12px;text-align:right;font-size:11px;color:#999;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;width:120px;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </div>

    <div style="padding:0 40px 30px;">
      <table>
        <tr>
          <td style="width:55%;padding-right:30px;vertical-align:top;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#999;letter-spacing:1.2px;text-transform:uppercase;">Payment</p>
            <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">Pay via WhatsApp — we'll share UPI / bank transfer / other available payment options.</p>
          </td>
          <td style="width:45%;vertical-align:top;">
            <table style="background:#FAFAFA;border-radius:10px;">
              <tr><td style="padding:10px 16px;font-size:13px;color:#777;">Subtotal</td><td style="padding:10px 16px;font-size:13px;color:#333;text-align:right;">${formatPrice(order.subtotal)}</td></tr>
              ${order.discount > 0 ? `<tr><td style="padding:6px 16px;font-size:13px;color:#16a34a;">Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}</td><td style="padding:6px 16px;font-size:13px;color:#16a34a;font-weight:700;text-align:right;">−${formatPrice(order.discount)}</td></tr>` : ""}
              <tr><td style="padding:6px 16px 12px;font-size:13px;color:#777;border-bottom:1px solid #E8E8E8;">Shipping</td><td style="padding:6px 16px 12px;font-size:13px;color:${order.shipping === 0 ? "#16a34a" : "#333"};text-align:right;border-bottom:1px solid #E8E8E8;">${order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</td></tr>
              <tr><td style="padding:14px 16px;font-size:14px;font-weight:900;color:#111;">Grand Total</td><td style="padding:14px 16px;font-size:18px;font-weight:900;color:#111;text-align:right;">${formatPrice(order.grand_total)}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <div style="background:#0F0F0F;color:#999;padding:20px 40px;text-align:center;font-size:11px;">
      Thank you for shopping with JB Jewellery Collection · ${ZOHO_EMAIL} · © ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>`;
}

// ── Sample data for previews ─────────────────────────────────────────────────
export const SAMPLE_ORDER: OrderEmailData = {
  id: "11111111-2222-3333-4444-555555555555",
  customer_name: "Riya Sharma",
  email: "riya@example.com",
  phone: "+91 98765 43210",
  items: [
    { name: "Pearl Drop Earrings", quantity: 2, price: 299 },
    { name: "Gold-tone Choker Set", quantity: 1, price: 799 },
    { name: "Crystal Bracelet", quantity: 1, price: 449 },
  ],
  address: { line1: "Flat 12B, Marine Heights", line2: "Nariman Point", city: "Mumbai", state: "Maharashtra", pincode: "400021" },
  subtotal: 1846,
  shipping: 0,
  discount: 184,
  grand_total: 1662,
  coupon_code: "WELCOME10",
  created_at: new Date().toISOString(),
};

export const SAMPLE_ARRIVAL: NewArrivalData = {
  name: "Royal Kundan Choker Set",
  category: "Necklaces",
  price: 1299,
  originalPrice: 2499,
  discount: 48,
};

export const SAMPLE_RESTOCK: RestockData = {
  name: "Pearl Drop Earrings",
  category: "Earrings",
  price: 299,
};
