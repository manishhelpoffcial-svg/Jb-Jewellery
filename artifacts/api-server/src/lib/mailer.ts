import nodemailer from "nodemailer";

const ZOHO_EMAIL = process.env.ZOHO_EMAIL || "";
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

function emailBase(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>JB Jewellery Collection</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:620px;margin:32px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1A1A1A 0%,#2D2D2D 100%);padding:32px;text-align:center;position:relative;">
      <div style="display:inline-block;background:#FFD700;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:22px;font-weight:900;color:#111;margin-bottom:12px;">JB</div>
      <h1 style="margin:0;color:#FFD700;font-size:22px;font-weight:900;letter-spacing:1px;">JB JEWELLERY COLLECTION</h1>
      <p style="margin:4px 0 0;color:#aaa;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Premium Fashion Jewellery</p>
    </div>
    ${content}
    <!-- Footer -->
    <div style="background:#1A1A1A;padding:20px 32px;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;color:#777;">Need help? Contact us at <a href="mailto:${ZOHO_EMAIL}" style="color:#FFD700;text-decoration:none;">${ZOHO_EMAIL}</a></p>
      <p style="margin:0;font-size:11px;color:#555;">© ${new Date().getFullYear()} JB Jewellery Collection · All rights reserved</p>
    </div>
  </div>
</body>
</html>`;
}

// ── 1. Order Confirmation → Customer ─────────────────────────────────────────
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
        <td style="padding:12px 8px;border-bottom:1px solid #F0F0F0;font-size:14px;color:#333;">${item.name}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #F0F0F0;text-align:center;font-size:14px;color:#555;">${item.quantity}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #F0F0F0;text-align:right;font-size:14px;font-weight:700;color:#111;">${formatPrice(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const content = `
    <!-- Greeting -->
    <div style="padding:32px 32px 0;">
      <div style="background:#FFFBE6;border-left:4px solid #FFD700;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#888;font-weight:600;letter-spacing:0.5px;">ORDER RECEIVED</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#111;">We got your order! 🎉</p>
      </div>
      <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7;">Hi <strong style="color:#111;">${order.customer_name}</strong>, thank you for shopping with JB Jewellery Collection. Your order has been received and is awaiting confirmation.</p>

      <!-- Order ID badge -->
      <div style="background:#1A1A1A;border-radius:10px;padding:14px 20px;margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;">
        <span style="color:#aaa;font-size:12px;font-weight:600;letter-spacing:1px;">ORDER ID</span>
        <span style="color:#FFD700;font-size:16px;font-weight:900;font-family:monospace;">#${order.id.slice(0, 8).toUpperCase()}</span>
      </div>
    </div>

    <!-- Items -->
    <div style="padding:0 32px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Order Summary</p>
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

      <!-- Totals -->
      <div style="margin-top:16px;padding:16px 20px;background:#FAFAFA;border-radius:10px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:14px;color:#777;">Subtotal</span><span style="font-size:14px;color:#333;">${formatPrice(order.subtotal)}</span></div>
        ${order.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:14px;color:#16a34a;">Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}</span><span style="font-size:14px;color:#16a34a;font-weight:700;">−${formatPrice(order.discount)}</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #E8E8E8;"><span style="font-size:14px;color:#777;">Shipping</span><span style="font-size:14px;color:${order.shipping === 0 ? "#16a34a" : "#333"};">${order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:16px;font-weight:900;color:#111;">Grand Total</span><span style="font-size:18px;font-weight:900;color:#111;">${formatPrice(order.grand_total)}</span></div>
      </div>
    </div>

    <!-- Address -->
    <div style="padding:20px 32px 32px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Delivery Address</p>
      <div style="background:#F9F9F9;border:1px solid #EFEFEF;border-radius:10px;padding:16px 20px;">
        <p style="margin:0 0 4px;font-size:14px;color:#333;line-height:1.7;">${formatAddress(order.address)}</p>
        <p style="margin:6px 0 0;font-size:13px;color:#777;">📞 ${order.phone}</p>
      </div>
    </div>

    <!-- Status info -->
    <div style="margin:0 32px 32px;background:linear-gradient(135deg,#FFFBE6,#FFF8D6);border-radius:12px;padding:20px;text-align:center;">
      <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">You will receive another email once your order is <strong style="color:#111;">confirmed</strong> by our team. Most orders are confirmed within <strong style="color:#111;">2–4 hours</strong>.</p>
    </div>`;

  await transporter.sendMail({
    from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
    to: order.email,
    subject: `Order Received #${order.id.slice(0, 8).toUpperCase()} – JB Jewellery`,
    html: emailBase(content),
  });
}

// ── 2. New Order Alert → Admin ────────────────────────────────────────────────
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
    .map((i) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${i.name}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:13px;">${i.quantity}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;font-weight:700;">${formatPrice(i.price * i.quantity)}</td></tr>`)
    .join("");

  const content = `
    <div style="padding:28px 32px;">
      <div style="background:#FF4444;border-radius:8px;padding:12px 16px;margin-bottom:20px;text-align:center;">
        <p style="margin:0;color:#fff;font-weight:800;font-size:15px;">🛍️ NEW ORDER — ACTION REQUIRED</p>
      </div>
      <div style="background:#FFFBE6;border-left:4px solid #FFD700;border-radius:0 8px 8px 0;padding:14px 20px;margin-bottom:20px;">
        <p style="margin:0;font-size:12px;color:#888;letter-spacing:0.5px;">ORDER ID</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:900;color:#111;font-family:monospace;">#${order.id.slice(0, 8).toUpperCase()}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#aaa;">${new Date(order.created_at).toLocaleString("en-IN")}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">
        <tr><td style="padding:8px 0;color:#888;width:130px;font-weight:600;">Customer</td><td style="padding:8px 0;font-weight:700;">${order.customer_name}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-weight:600;">Email</td><td style="padding:8px 0;">${order.email}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-weight:600;">Phone</td><td style="padding:8px 0;">${order.phone}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-weight:600;vertical-align:top;">Address</td><td style="padding:8px 0;">${formatAddress(order.address)}</td></tr>
      </table>

      <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Items Ordered</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #F0F0F0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
        <thead><tr style="background:#FAFAFA;"><th style="padding:8px 12px;text-align:left;font-size:11px;color:#999;font-weight:700;">Item</th><th style="padding:8px 12px;text-align:center;font-size:11px;color:#999;font-weight:700;">Qty</th><th style="padding:8px 12px;text-align:right;font-size:11px;color:#999;font-weight:700;">Total</th></tr></thead>
        <tbody>${itemsList}</tbody>
      </table>

      <div style="background:#1A1A1A;border-radius:10px;padding:16px 20px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#aaa;font-weight:600;">GRAND TOTAL</p>
        <p style="margin:0;font-size:26px;font-weight:900;color:#FFD700;">${formatPrice(order.grand_total)}</p>
      </div>
    </div>`;

  await transporter.sendMail({
    from: `"JB Jewellery System" <${ZOHO_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `🛍️ New Order #${order.id.slice(0, 8).toUpperCase()} — ${formatPrice(order.grand_total)} from ${order.customer_name}`,
    html: emailBase(content),
  });
}

// ── 3. Order Confirmed → Customer ─────────────────────────────────────────────
export async function sendOrderConfirmedEmail(order: {
  id: string;
  customer_name: string;
  email: string;
  grand_total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  note?: string;
}) {
  const itemsSummary = order.items.map(i => `${i.name} × ${i.quantity}`).join(", ");
  const content = `
    <div style="padding:32px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:72px;height:72px;background:#E8F5E9;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:34px;margin-bottom:12px;">✅</div>
        <h2 style="margin:0;font-size:24px;font-weight:900;color:#111;">Order Confirmed!</h2>
        <p style="margin:8px 0 0;color:#777;font-size:15px;">Great news — your order has been accepted.</p>
      </div>

      <div style="background:#FFFBE6;border-left:4px solid #FFD700;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:12px;color:#999;letter-spacing:0.5px;">ORDER ID</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:900;font-family:monospace;color:#111;">#${order.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.7;">Hi <strong style="color:#111;">${order.customer_name}</strong>, your order for <em>${itemsSummary}</em> has been <strong style="color:#16a34a;">confirmed</strong> and our team has started processing it.</p>
      ${order.note ? `<div style="background:#F0F8FF;border:1px solid #B3D9FF;border-radius:10px;padding:14px 18px;margin-bottom:20px;"><p style="margin:0;font-size:13px;color:#888;font-weight:600;">Note from our team</p><p style="margin:6px 0 0;font-size:14px;color:#333;">${order.note}</p></div>` : ""}

      <div style="background:#F9F9F9;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:14px;color:#777;">Order Total</span>
          <span style="font-size:17px;font-weight:900;color:#111;">${formatPrice(order.grand_total)}</span>
        </div>
      </div>

      <p style="margin:0;font-size:14px;color:#777;line-height:1.7;text-align:center;">We will notify you once your order is <strong>shipped</strong>. Expected dispatch within <strong>1–2 business days</strong>. ✨</p>
    </div>`;

  await transporter.sendMail({
    from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
    to: order.email,
    subject: `✅ Order Confirmed #${order.id.slice(0, 8).toUpperCase()} – JB Jewellery`,
    html: emailBase(content),
  });
}

// ── 4. Order Shipped → Customer ───────────────────────────────────────────────
export async function sendOrderShippedEmail(order: {
  id: string;
  customer_name: string;
  email: string;
  grand_total: number;
  address: Record<string, string>;
  note?: string;
}) {
  const content = `
    <div style="padding:32px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:72px;height:72px;background:#EDE7F6;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:34px;margin-bottom:12px;">🚚</div>
        <h2 style="margin:0;font-size:24px;font-weight:900;color:#111;">Your Order is on its Way!</h2>
        <p style="margin:8px 0 0;color:#777;font-size:15px;">Sit tight — your jewellery is heading to you.</p>
      </div>

      <div style="background:#FFFBE6;border-left:4px solid #FFD700;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:12px;color:#999;letter-spacing:0.5px;">ORDER ID</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:900;font-family:monospace;color:#111;">#${order.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">Hi <strong style="color:#111;">${order.customer_name}</strong>, your JB Jewellery order has been <strong style="color:#7C3AED;">shipped</strong> and is on its way to you!</p>
      ${order.note ? `<div style="background:#F3E8FF;border:1px solid #C4B5FD;border-radius:10px;padding:14px 18px;margin-bottom:20px;"><p style="margin:0;font-size:13px;color:#888;font-weight:600;">Shipping Note</p><p style="margin:6px 0 0;font-size:14px;color:#333;">${order.note}</p></div>` : ""}

      <div style="background:#F9F9F9;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:12px;color:#999;font-weight:600;letter-spacing:0.5px;">DELIVERING TO</p>
        <p style="margin:0;font-size:14px;color:#333;line-height:1.7;">${formatAddress(order.address)}</p>
      </div>

      <div style="background:linear-gradient(135deg,#EDE7F6,#F3E8FF);border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">Expected delivery within <strong style="color:#7C3AED;">3–5 business days</strong>.<br>Keep an eye out for your sparkle! 💫</p>
      </div>

      <div style="border-top:1px solid #F0F0F0;padding-top:16px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;color:#777;">Order Total</span>
        <span style="font-size:17px;font-weight:900;color:#111;">${formatPrice(order.grand_total)}</span>
      </div>
    </div>`;

  await transporter.sendMail({
    from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
    to: order.email,
    subject: `🚚 Your Order #${order.id.slice(0, 8).toUpperCase()} Has Been Shipped – JB Jewellery`,
    html: emailBase(content),
  });
}

// ── 5. Order Delivered → Customer ─────────────────────────────────────────────
export async function sendOrderDeliveredEmail(order: {
  id: string;
  customer_name: string;
  email: string;
  grand_total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  note?: string;
}) {
  const itemsSummary = order.items.map(i => `${i.name} × ${i.quantity}`).join(", ");
  const content = `
    <div style="padding:32px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:72px;height:72px;background:#FFFBE6;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:34px;margin-bottom:12px;">🎉</div>
        <h2 style="margin:0;font-size:24px;font-weight:900;color:#111;">Order Delivered!</h2>
        <p style="margin:8px 0 0;color:#777;font-size:15px;">Your jewellery has arrived. Time to sparkle! ✨</p>
      </div>

      <div style="background:#FFFBE6;border-left:4px solid #FFD700;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:12px;color:#999;letter-spacing:0.5px;">ORDER ID</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:900;font-family:monospace;color:#111;">#${order.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">Hi <strong style="color:#111;">${order.customer_name}</strong>, your order for <em>${itemsSummary}</em> has been successfully <strong style="color:#16a34a;">delivered</strong>. We hope you love your new jewellery!</p>
      ${order.note ? `<div style="background:#E8F5E9;border:1px solid #A7F3D0;border-radius:10px;padding:14px 18px;margin-bottom:20px;"><p style="margin:0;font-size:13px;color:#888;font-weight:600;">Note</p><p style="margin:6px 0 0;font-size:14px;color:#333;">${order.note}</p></div>` : ""}

      <div style="background:linear-gradient(135deg,#FFFBE6,#FFF0B3);border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:22px;">💛</p>
        <p style="margin:0;font-size:15px;color:#555;line-height:1.7;font-weight:600;">We'd love to hear what you think!<br>Share your experience and help us grow.</p>
      </div>

      <div style="border-top:1px solid #F0F0F0;padding-top:16px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;color:#777;">Order Total Paid</span>
        <span style="font-size:17px;font-weight:900;color:#111;">${formatPrice(order.grand_total)}</span>
      </div>
    </div>`;

  await transporter.sendMail({
    from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
    to: order.email,
    subject: `🎉 Your Order #${order.id.slice(0, 8).toUpperCase()} Has Been Delivered – JB Jewellery`,
    html: emailBase(content),
  });
}

// ── 6. New Arrival Notification → Subscribers ────────────────────────────────
export async function sendNewArrivalNotification(
  subscribers: string[],
  product: { name: string; category: string; price: number; originalPrice: number; discount: number }
) {
  if (subscribers.length === 0) return;

  const content = `
    <div style="padding:32px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background:#FFFBE6;border:2px solid #FFD700;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:800;color:#B45309;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;">✨ New Arrival</div>
        <h2 style="margin:0;font-size:24px;font-weight:900;color:#111;">Fresh Styles Just Landed!</h2>
        <p style="margin:8px 0 0;color:#777;font-size:15px;">A stunning new addition to our collection.</p>
      </div>

      <div style="background:#1A1A1A;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:12px;color:#888;letter-spacing:1px;text-transform:uppercase;">Just In — ${product.category}</p>
        <p style="margin:0 0 16px;font-size:20px;font-weight:900;color:#FFD700;line-height:1.3;">${product.name}</p>
        <div style="display:inline-flex;align-items:center;gap:12px;background:#2D2D2D;border-radius:8px;padding:10px 20px;">
          <span style="text-decoration:line-through;color:#666;font-size:14px;">${formatPrice(product.originalPrice)}</span>
          <span style="font-size:22px;font-weight:900;color:#FFD700;">${formatPrice(product.price)}</span>
          <span style="background:#FFD700;color:#111;font-size:11px;font-weight:800;padding:3px 8px;border-radius:4px;">${product.discount}% OFF</span>
        </div>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="#" style="display:inline-block;background:#FFD700;color:#111;font-weight:900;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.5px;">Shop Now →</a>
      </div>

      <p style="margin:0;text-align:center;font-size:12px;color:#aaa;">You're receiving this because you subscribed to JB Jewellery updates.</p>
    </div>`;

  const html = emailBase(content);

  await Promise.allSettled(
    subscribers.map((email) =>
      transporter.sendMail({
        from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
        to: email,
        subject: `✨ New Arrival: ${product.name} – JB Jewellery Collection`,
        html,
      })
    )
  );
}

// ── 7. Restock Alert → Subscribers ───────────────────────────────────────────
export async function sendRestockAlert(
  subscribers: string[],
  product: { name: string; category: string; price: number }
) {
  if (subscribers.length === 0) return;

  const content = `
    <div style="padding:32px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background:#E8F5E9;border:2px solid #4CAF50;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:800;color:#16a34a;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;">🔔 Back in Stock</div>
        <h2 style="margin:0;font-size:24px;font-weight:900;color:#111;">It's Back! Don't Miss Out.</h2>
        <p style="margin:8px 0 0;color:#777;font-size:15px;">A favourite item is available again.</p>
      </div>

      <div style="background:#1A1A1A;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:12px;color:#888;letter-spacing:1px;text-transform:uppercase;">Restocked — ${product.category}</p>
        <p style="margin:0 0 16px;font-size:20px;font-weight:900;color:#4CAF50;line-height:1.3;">${product.name}</p>
        <p style="margin:0;font-size:26px;font-weight:900;color:#FFD700;">${formatPrice(product.price)}</p>
      </div>

      <div style="background:#E8F5E9;border-radius:10px;padding:16px;text-align:center;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#16a34a;font-weight:700;">⚡ Limited Stock — Order Before It Sells Out Again!</p>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="#" style="display:inline-block;background:#FFD700;color:#111;font-weight:900;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.5px;">Grab It Now →</a>
      </div>

      <p style="margin:0;text-align:center;font-size:12px;color:#aaa;">You're receiving this because you subscribed to JB Jewellery updates.</p>
    </div>`;

  const html = emailBase(content);

  await Promise.allSettled(
    subscribers.map((email) =>
      transporter.sendMail({
        from: `"JB Jewellery Collection" <${ZOHO_EMAIL}>`,
        to: email,
        subject: `🔔 Back in Stock: ${product.name} – JB Jewellery Collection`,
        html,
      })
    )
  );
}
