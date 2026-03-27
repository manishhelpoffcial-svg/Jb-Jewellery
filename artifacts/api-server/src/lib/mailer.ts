import nodemailer from "nodemailer";

const ZOHO_EMAIL = process.env.ZOHO_EMAIL || "";
const ZOHO_APP_PASSWORD = process.env.ZOHO_APP_PASSWORD || "";
const ADMIN_EMAIL = ZOHO_EMAIL;

export const transporter = nodemailer.createTransport({
  host: "smtp.zoho.in",
  port: 465,
  secure: true,
  auth: {
    user: ZOHO_EMAIL,
    pass: ZOHO_APP_PASSWORD,
  },
});

function formatPrice(p: number) {
  return `₹${p.toLocaleString("en-IN")}`;
}

function formatAddress(address: Record<string, string>) {
  return [address.line1, address.line2, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
}

// ── Order Confirmation to Customer ──────────────────────────────────────────
export async function sendOrderConfirmation(order: {
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
}) {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:14px;">${item.name}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;font-weight:600;">${formatPrice(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:#FFD700;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;font-size:28px;font-weight:900;color:#111;letter-spacing:-1px;">JB Jewellery Collection</h1>
      <p style="margin:6px 0 0;font-size:13px;color:#555;font-weight:500;">✨ Premium Fashion Jewellery</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111;">Order Confirmed! 🎉</h2>
      <p style="margin:0 0 24px;color:#555;font-size:14px;">Hi <strong>${order.customer_name}</strong>, thank you for your order! We're getting it ready for you.</p>

      <!-- Order ID -->
      <div style="background:#fffbe6;border:1px solid #FFD700;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#888;">Order ID</p>
        <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#111;font-family:monospace;">#${order.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <!-- Items Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="padding:10px 8px;text-align:left;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
            <th style="padding:10px 8px;text-align:center;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
            <th style="padding:10px 8px;text-align:right;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <!-- Totals -->
      <div style="border-top:2px solid #f0f0f0;padding-top:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#555;">
          <span>Subtotal</span><span>${formatPrice(order.subtotal)}</span>
        </div>
        ${order.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#16a34a;">
          <span>Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}</span><span>- ${formatPrice(order.discount)}</span>
        </div>` : ""}
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#555;">
          <span>Shipping</span><span>${order.shipping === 0 ? '<span style="color:#16a34a">FREE</span>' : formatPrice(order.shipping)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:17px;font-weight:800;color:#111;border-top:1px solid #f0f0f0;padding-top:12px;margin-top:8px;">
          <span>Grand Total</span><span>${formatPrice(order.grand_total)}</span>
        </div>
      </div>

      <!-- Delivery Address -->
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Delivery Address</p>
        <p style="margin:0;font-size:14px;color:#333;line-height:1.6;">${formatAddress(order.address)}</p>
        <p style="margin:6px 0 0;font-size:13px;color:#555;">📞 ${order.phone}</p>
      </div>

      <p style="margin:0;font-size:13px;color:#777;line-height:1.6;">We'll notify you when your order is shipped. For any queries, reply to this email or contact us at <a href="mailto:${ADMIN_EMAIL}" style="color:#d97706;">${ADMIN_EMAIL}</a>.</p>
    </div>

    <!-- Footer -->
    <div style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #f0f0f0;">
      <p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} JB Jewellery Collection · All rights reserved</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
    to: order.email,
    subject: `✨ Order Confirmed #${order.id.slice(0, 8).toUpperCase()} – JB Jewellery`,
    html,
  });
}

// ── New Order Notification to Admin ─────────────────────────────────────────
export async function sendAdminOrderNotification(order: {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  address: Record<string, string>;
  grand_total: number;
  created_at: string;
}) {
  const itemsList = order.items
    .map((i) => `• ${i.name} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#111;padding:20px 28px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:22px;">🛍️</span>
      <div>
        <h2 style="margin:0;color:#FFD700;font-size:18px;font-weight:800;">New Order Received!</h2>
        <p style="margin:2px 0 0;color:#aaa;font-size:12px;">JB Jewellery Admin Alert</p>
      </div>
    </div>
    <div style="padding:24px 28px;">
      <div style="background:#fffbe6;border-left:4px solid #FFD700;padding:12px 16px;border-radius:4px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#888;">Order ID</p>
        <p style="margin:4px 0 0;font-size:16px;font-weight:700;font-family:monospace;">#${order.id.slice(0, 8).toUpperCase()}</p>
      </div>
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#888;width:140px;">Customer</td><td style="padding:8px 0;font-weight:600;">${order.customer_name}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;">${order.email}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Phone</td><td style="padding:8px 0;">${order.phone}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Address</td><td style="padding:8px 0;">${formatAddress(order.address)}</td></tr>
        <tr><td style="padding:8px 0;color:#888;vertical-align:top;">Items</td><td style="padding:8px 0;white-space:pre-line;">${itemsList}</td></tr>
        <tr style="border-top:2px solid #FFD700;"><td style="padding:12px 0 0;font-weight:800;font-size:16px;">Grand Total</td><td style="padding:12px 0 0;font-weight:800;font-size:16px;color:#111;">${formatPrice(order.grand_total)}</td></tr>
      </table>
    </div>
    <div style="background:#f9f9f9;padding:14px 28px;text-align:center;border-top:1px solid #f0f0f0;">
      <p style="margin:0;font-size:12px;color:#aaa;">JB Jewellery Admin · ${new Date().toLocaleString("en-IN")}</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"JB Jewellery System" <${ZOHO_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `🛍️ New Order #${order.id.slice(0, 8).toUpperCase()} — ${formatPrice(order.grand_total)} from ${order.customer_name}`,
    html,
  });
}

// ── Order Status Update to Customer ─────────────────────────────────────────
export async function sendOrderStatusUpdate(order: {
  id: string;
  customer_name: string;
  email: string;
  grand_total: number;
  status: string;
  note?: string;
}) {
  const statusEmoji: Record<string, string> = {
    pending: "⏳",
    confirmed: "✅",
    processing: "🔧",
    shipped: "🚚",
    delivered: "🎉",
    cancelled: "❌",
  };

  const emoji = statusEmoji[order.status] || "📦";
  const statusLabel = order.status.charAt(0).toUpperCase() + order.status.slice(1);

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#FFD700;padding:24px 32px;text-align:center;">
      <p style="margin:0;font-size:40px;">${emoji}</p>
      <h2 style="margin:8px 0 0;font-size:20px;font-weight:800;color:#111;">Order ${statusLabel}</h2>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:14px;color:#555;">Hi <strong>${order.customer_name}</strong>, your order status has been updated.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;color:#888;">Order ID</span>
          <span style="font-size:13px;font-weight:700;font-family:monospace;">#${order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;color:#888;">Status</span>
          <span style="font-size:13px;font-weight:700;color:#111;">${emoji} ${statusLabel}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:13px;color:#888;">Total</span>
          <span style="font-size:13px;font-weight:700;">${formatPrice(order.grand_total)}</span>
        </div>
      </div>
      ${order.note ? `<div style="background:#fffbe6;border:1px solid #FFD700;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#888;font-weight:600;">Note from JB Jewellery</p>
        <p style="margin:6px 0 0;font-size:14px;color:#333;">${order.note}</p>
      </div>` : ""}
      <p style="margin:0;font-size:13px;color:#777;">For any queries, contact us at <a href="mailto:${ADMIN_EMAIL}" style="color:#d97706;">${ADMIN_EMAIL}</a>.</p>
    </div>
    <div style="background:#f9f9f9;padding:16px 32px;text-align:center;border-top:1px solid #f0f0f0;">
      <p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} JB Jewellery Collection</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
    to: order.email,
    subject: `${emoji} Your Order #${order.id.slice(0, 8).toUpperCase()} is now ${statusLabel}`,
    html,
  });
}
