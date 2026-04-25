/**
 * mailer-templates.ts
 *
 * A generic email-template registry. Each template defines:
 *   meta:   { name, description, category, defaultSubject, audience }
 *   sample: arbitrary sample context used when an admin previews the template
 *   render: (ctx) => HTML string (uses the shared `emailBase` shell)
 *   send?:  (to, ctx, subject?) => Promise<void>   (real send via Zoho SMTP)
 *
 * All templates are designed to be email-client-safe (table layouts,
 * inline CSS, monochrome SVG icons — no emojis).
 */

import {
  ZOHO_EMAIL,
  transporter,
  emailBase,
  iconCircle,
  buttonLink,
  icon as baseIcon,
  formatPrice,
  publicBaseUrl,
} from "./mailer.js";

// ── Extra inline SVG icons (extends the base icon library) ───────────────────
const extraIcons = {
  lock: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  gift: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DB2777" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
  rotate: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891B2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>`,
  refund: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4l-7 7 7 7"/><path d="M7 11h10a4 4 0 0 1 4 4v3"/></svg>`,
  support: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  heart: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#FFD700" stroke="#B45309" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  percent: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DB2777" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  xCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  card: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  key: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`,
  cart: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  megaphone: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DB2777" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8v18L3 13z"/><path d="M11 11v6a4 4 0 0 1-8 0v-2"/></svg>`,
  inbox: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
  truck: baseIcon.truck,
  package: baseIcon.package,
  receipt: baseIcon.receipt,
  check: baseIcon.check,
  bell: baseIcon.bell,
  sparkle: baseIcon.sparkle,
  alert: baseIcon.alert,
};

type IconKey = keyof typeof extraIcons;

// ── Building blocks ──────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "whatsapp" | "outline";
type Tone = "info" | "success" | "warning" | "danger" | "muted";

type Section =
  | { type: "intro"; html: string }
  | { type: "info"; title?: string; rows: Array<{ label: string; value: string }> }
  | { type: "highlight"; tone: Tone; title?: string; html: string }
  | { type: "buttons"; title?: string; align?: "center" | "left"; buttons: Array<{ label: string; href: string; variant?: ButtonVariant; iconKey?: IconKey }> }
  | { type: "code"; label: string; code: string }
  | { type: "items"; title?: string; rows: Array<{ name: string; quantity: number; price: number }>; subtotal?: number; discount?: number; shipping?: number; total?: number; couponCode?: string }
  | { type: "products"; title?: string; products: Array<{ name: string; price: number; href?: string }> }
  | { type: "footnote"; html: string }
  | { type: "spacer" };

type GenericEmailOpts = {
  iconKey: IconKey;
  iconBg: string;
  badge?: { text: string; bg?: string; color?: string };
  headline: string;
  subheading?: string;
  greeting?: string;
  sections: Section[];
};

const TONE_STYLES: Record<Tone, { bg: string; border: string; color: string }> = {
  info: { bg: "#EFF6FF", border: "#BFDBFE", color: "#1E40AF" },
  success: { bg: "#ECFDF5", border: "#A7F3D0", color: "#047857" },
  warning: { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E" },
  danger: { bg: "#FEF2F2", border: "#FECACA", color: "#991B1B" },
  muted: { bg: "#F9FAFB", border: "#E5E7EB", color: "#374151" },
};

const BUTTON_STYLES: Record<ButtonVariant, { bg: string; color: string }> = {
  primary: { bg: "#FFD700", color: "#111" },
  secondary: { bg: "#F3F4F6", color: "#111" },
  success: { bg: "#16A34A", color: "#fff" },
  danger: { bg: "#DC2626", color: "#fff" },
  whatsapp: { bg: "#25D366", color: "#fff" },
  outline: { bg: "#FFFFFF", color: "#111" },
};

function renderSection(s: Section): string {
  switch (s.type) {
    case "intro":
      return `<div style="padding:0 32px 18px;"><p style="margin:0;font-size:15px;color:#444;line-height:1.7;">${s.html}</p></div>`;

    case "info": {
      const rows = s.rows
        .map(
          (r) =>
            `<tr><td style="padding:8px 0;color:#888;font-weight:600;font-size:13px;width:140px;vertical-align:top;">${r.label}</td><td style="padding:8px 0;font-size:14px;color:#111;font-weight:600;">${r.value}</td></tr>`,
        )
        .join("");
      return `<div style="padding:0 32px 18px;">${s.title ? `<p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#999;">${s.title}</p>` : ""}<table role="presentation" style="width:100%;background:#FAFAFA;border:1px solid #F0F0F0;border-radius:10px;border-collapse:separate;padding:6px 18px;">${rows}</table></div>`;
    }

    case "highlight": {
      const t = TONE_STYLES[s.tone];
      return `<div style="padding:0 32px 18px;"><div style="background:${t.bg};border:1px solid ${t.border};border-radius:12px;padding:16px 20px;">${s.title ? `<p style="margin:0 0 6px;font-size:12px;font-weight:800;color:${t.color};letter-spacing:0.5px;text-transform:uppercase;">${s.title}</p>` : ""}<p style="margin:0;font-size:14px;color:${t.color};line-height:1.6;">${s.html}</p></div></div>`;
    }

    case "buttons": {
      const align = s.align || "center";
      const btns = s.buttons
        .map((b) => {
          const style = BUTTON_STYLES[b.variant || "primary"];
          return buttonLink({
            href: b.href,
            bg: style.bg,
            color: style.color,
            label: b.label,
            iconSvg: b.iconKey ? extraIcons[b.iconKey] : undefined,
          });
        })
        .join("");
      return `<div style="padding:0 32px 22px;text-align:${align};">${s.title ? `<p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#999;">${s.title}</p>` : ""}${btns}</div>`;
    }

    case "code":
      return `<div style="padding:0 32px 22px;text-align:center;"><p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#999;">${s.label}</p><div style="display:inline-block;background:#0F0F0F;border-radius:14px;padding:18px 32px;"><span style="font-family:'Courier New',monospace;font-size:32px;font-weight:900;color:#FFD700;letter-spacing:8px;">${s.code}</span></div></div>`;

    case "items": {
      const itemsHtml = s.rows
        .map(
          (item) => `<tr>
            <td style="padding:10px 8px;border-bottom:1px solid #F0F0F0;font-size:13px;color:#333;">${item.name}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #F0F0F0;text-align:center;font-size:13px;color:#555;">${item.quantity}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #F0F0F0;text-align:right;font-size:13px;font-weight:700;color:#111;">${formatPrice(item.price * item.quantity)}</td>
          </tr>`,
        )
        .join("");

      const summaryRows: string[] = [];
      if (typeof s.subtotal === "number")
        summaryRows.push(`<tr><td style="padding:8px 16px;font-size:13px;color:#777;">Subtotal</td><td style="padding:8px 16px;font-size:13px;color:#333;text-align:right;">${formatPrice(s.subtotal)}</td></tr>`);
      if (typeof s.discount === "number" && s.discount > 0)
        summaryRows.push(`<tr><td style="padding:6px 16px;font-size:13px;color:#16a34a;">Discount${s.couponCode ? ` (${s.couponCode})` : ""}</td><td style="padding:6px 16px;font-size:13px;color:#16a34a;font-weight:700;text-align:right;">−${formatPrice(s.discount)}</td></tr>`);
      if (typeof s.shipping === "number")
        summaryRows.push(`<tr><td style="padding:6px 16px 12px;font-size:13px;color:#777;border-bottom:1px solid #E8E8E8;">Shipping</td><td style="padding:6px 16px 12px;font-size:13px;color:${s.shipping === 0 ? "#16a34a" : "#333"};text-align:right;border-bottom:1px solid #E8E8E8;">${s.shipping === 0 ? "FREE" : formatPrice(s.shipping)}</td></tr>`);
      if (typeof s.total === "number")
        summaryRows.push(`<tr><td style="padding:14px 16px;font-size:14px;font-weight:900;color:#111;">Grand Total</td><td style="padding:14px 16px;font-size:18px;font-weight:900;color:#111;text-align:right;">${formatPrice(s.total)}</td></tr>`);

      return `<div style="padding:0 32px 18px;">${s.title ? `<p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#999;">${s.title}</p>` : ""}<table style="width:100%;border-collapse:collapse;border:1px solid #F0F0F0;border-radius:10px;overflow:hidden;">
        <thead><tr style="background:#FAFAFA;">
          <th style="padding:10px 8px;text-align:left;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
          <th style="padding:10px 8px;text-align:right;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>${summaryRows.length ? `<table style="width:100%;margin-top:12px;background:#FAFAFA;border-radius:10px;border-collapse:separate;">${summaryRows.join("")}</table>` : ""}</div>`;
    }

    case "products": {
      const cards = s.products
        .map(
          (p) => `<table role="presentation" style="display:inline-table;width:46%;margin:6px;background:#FAFAFA;border:1px solid #F0F0F0;border-radius:12px;"><tr><td style="padding:18px;text-align:center;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:800;color:#111;line-height:1.4;">${p.name}</p>
            <p style="margin:0 0 12px;font-size:18px;font-weight:900;color:#B45309;">${formatPrice(p.price)}</p>
            ${p.href ? buttonLink({ href: p.href, ...BUTTON_STYLES.primary, label: "View" }) : ""}
          </td></tr></table>`,
        )
        .join("");
      return `<div style="padding:0 32px 18px;text-align:center;">${s.title ? `<p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#999;">${s.title}</p>` : ""}${cards}</div>`;
    }

    case "footnote":
      return `<div style="padding:0 32px 22px;text-align:center;"><p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">${s.html}</p></div>`;

    case "spacer":
      return `<div style="height:8px;"></div>`;
  }
}

function renderGenericEmail(opts: GenericEmailOpts): string {
  const headerBlock = `
    <div style="padding:32px 32px 0;text-align:center;">
      ${iconCircle(extraIcons[opts.iconKey], opts.iconBg)}
      ${opts.badge ? `<div style="display:inline-block;background:${opts.badge.bg || "#FFFBE6"};border:1px solid #F5E89A;border-radius:8px;padding:5px 12px;font-size:11px;font-weight:800;color:${opts.badge.color || "#B45309"};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">${opts.badge.text}</div>` : ""}
      <h2 style="margin:0;font-size:22px;font-weight:900;color:#111;line-height:1.3;">${opts.headline}</h2>
      ${opts.subheading ? `<p style="margin:8px 0 18px;color:#666;font-size:14px;line-height:1.6;">${opts.subheading}</p>` : `<div style="height:18px;"></div>`}
      ${opts.greeting ? `<p style="margin:0 0 18px;color:#222;font-size:15px;font-weight:600;">${opts.greeting}</p>` : ""}
    </div>`;
  const body = opts.sections.map(renderSection).join("");
  return emailBase(headerBlock + body);
}

// ── Send helpers ─────────────────────────────────────────────────────────────
async function sendMail(to: string, subject: string, html: string, fromLabel = "JB Jewellery Collection") {
  if (!ZOHO_EMAIL) throw new Error("ZOHO_EMAIL is not configured");
  await transporter.sendMail({
    from: `"${fromLabel}" <${ZOHO_EMAIL}>`,
    to,
    subject,
    html,
  });
}

// ── Login-alert cooldown (12 hours) ──────────────────────────────────────────
const LOGIN_ALERT_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const _loginAlertSentAt = new Map<string, number>();

/** Returns true if a login-alert email is due (i.e. last one was >12h ago). */
export function shouldSendLoginAlert(email: string): boolean {
  const last = _loginAlertSentAt.get(email.toLowerCase()) || 0;
  return Date.now() - last >= LOGIN_ALERT_COOLDOWN_MS;
}

/** Marks a login alert as just sent (so the 12h timer starts now). */
export function markLoginAlertSent(email: string) {
  _loginAlertSentAt.set(email.toLowerCase(), Date.now());
}

// ── Helpers used by templates ────────────────────────────────────────────────
const BASE_URL = () => publicBaseUrl() || "https://jbjewellery.example.com";
const ADMIN_PANEL_URL = () => `${BASE_URL()}/admin`;
const SUPPORT_EMAIL = () => ZOHO_EMAIL || "support@jbjewellery.com";

function fmtDateTime(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

// ── Template registry ────────────────────────────────────────────────────────
export type TemplateCategory = "Customer" | "Admin" | "Marketing";

export type TemplateMeta = {
  key: string;
  name: string;
  description: string;
  category: TemplateCategory;
  defaultSubject: string;
  audience: string;
};

export type TemplateDef<C = Record<string, unknown>> = {
  meta: TemplateMeta;
  sample: C;
  render: (ctx: C) => string;
};

// Use `unknown` so the registry can hold templates with different ctx shapes.
type AnyTemplate = TemplateDef<Record<string, unknown>>;

function def<C extends Record<string, unknown>>(t: TemplateDef<C>): AnyTemplate {
  return t as unknown as AnyTemplate;
}

const SAMPLE_NAME = "Riya Sharma";
const SAMPLE_ORDER_ID = "AB12CD34";
const SAMPLE_ORDER_DATE = new Date().toISOString();
const SAMPLE_ITEMS = [
  { name: "Pearl Drop Earrings", quantity: 2, price: 299 },
  { name: "Gold-tone Choker Set", quantity: 1, price: 799 },
];
const SAMPLE_TOTAL = 1397;

// ────────────────────────────────────────────────────────────────────────────
// 1. Welcome Mail
// ────────────────────────────────────────────────────────────────────────────
const tplWelcome = def<{ name: string }>({
  meta: {
    key: "welcome",
    name: "Welcome Mail",
    description: "Sent immediately after a customer creates an account.",
    category: "Customer",
    defaultSubject: "Welcome to JB Jewellery Collection",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "gift",
      iconBg: "#FCE7F3",
      badge: { text: "Welcome Aboard", bg: "#FCE7F3", color: "#9D174D" },
      headline: `Welcome, ${ctx.name}`,
      subheading: "We're delighted to have you with us.",
      sections: [
        { type: "intro", html: `Your JB Jewellery account has been created successfully. Discover our latest collections of premium fashion jewellery, exclusive offers and timeless designs hand-picked just for you.` },
        { type: "highlight", tone: "info", title: "A Special Welcome Gift", html: `Use code <strong>WELCOME10</strong> at checkout to enjoy <strong>10% off</strong> on your first order.` },
        { type: "buttons", buttons: [
          { label: "Start Shopping", href: BASE_URL(), variant: "primary", iconKey: "sparkle" },
          { label: "View My Account", href: `${BASE_URL()}/profile`, variant: "secondary", iconKey: "user" },
        ] },
        { type: "footnote", html: "If you didn't create this account, please contact us right away." },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 2. OTP / Verification Mail
// ────────────────────────────────────────────────────────────────────────────
const tplOtp = def<{ name: string; code: string; expiresInMinutes: number }>({
  meta: {
    key: "otp_verification",
    name: "OTP / Verification Mail",
    description: "Delivers a one-time verification code to confirm an action (signup, login, sensitive change).",
    category: "Customer",
    defaultSubject: "Your JB Jewellery verification code",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, code: "428193", expiresInMinutes: 10 },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "key",
      iconBg: "#FFF7ED",
      headline: "Your Verification Code",
      subheading: "Use the code below to complete your verification.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "code", label: "One-Time Password", code: ctx.code },
        { type: "highlight", tone: "warning", title: "Heads up", html: `This code expires in <strong>${ctx.expiresInMinutes} minutes</strong>. Never share it with anyone — JB Jewellery will never ask for your OTP.` },
        { type: "footnote", html: "If you did not request this code, you can safely ignore this email." },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 3. Order Confirmation Mail (lightweight — distinct from invoice)
// ────────────────────────────────────────────────────────────────────────────
const tplOrderConfirmation = def<{ name: string; orderId: string; total: number; items: Array<{ name: string; quantity: number; price: number }> }>({
  meta: {
    key: "order_confirmation",
    name: "Order Confirmation Mail",
    description: "Concise order confirmation — sent right after the order is placed.",
    category: "Customer",
    defaultSubject: "Your order has been received",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, orderId: SAMPLE_ORDER_ID, total: SAMPLE_TOTAL, items: SAMPLE_ITEMS },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "check",
      iconBg: "#ECFDF5",
      headline: "Order Received",
      subheading: "Thank you for shopping with JB Jewellery.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "intro", html: `We have received your order <strong>#${ctx.orderId}</strong> and our team will confirm it shortly.` },
        { type: "items", title: "Order Summary", rows: ctx.items, total: ctx.total },
        { type: "buttons", buttons: [{ label: "View Order", href: `${BASE_URL()}/profile/orders`, variant: "primary", iconKey: "view" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 4. Payment Success Mail
// ────────────────────────────────────────────────────────────────────────────
const tplPaymentSuccess = def<{ name: string; orderId: string; amount: number; method: string; transactionId: string }>({
  meta: {
    key: "payment_success",
    name: "Payment Success Mail",
    description: "Confirms a successful payment for an order.",
    category: "Customer",
    defaultSubject: "Payment received — JB Jewellery",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, orderId: SAMPLE_ORDER_ID, amount: SAMPLE_TOTAL, method: "UPI", transactionId: "TXN1234567890" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "check",
      iconBg: "#ECFDF5",
      headline: "Payment Successful",
      subheading: "Your payment has been received.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "intro", html: `We've received your payment for order <strong>#${ctx.orderId}</strong>. Your order is now being processed.` },
        { type: "info", title: "Payment Details", rows: [
          { label: "Order ID", value: `#${ctx.orderId}` },
          { label: "Amount Paid", value: formatPrice(ctx.amount) },
          { label: "Payment Method", value: ctx.method },
          { label: "Transaction ID", value: ctx.transactionId },
          { label: "Date", value: fmtDateTime() },
        ] },
        { type: "buttons", buttons: [{ label: "View Order", href: `${BASE_URL()}/profile/orders`, variant: "primary", iconKey: "view" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 5. Payment Failed Mail
// ────────────────────────────────────────────────────────────────────────────
const tplPaymentFailed = def<{ name: string; orderId: string; amount: number; reason: string }>({
  meta: {
    key: "payment_failed",
    name: "Payment Failed Mail",
    description: "Notifies the customer that a payment attempt was unsuccessful.",
    category: "Customer",
    defaultSubject: "Payment unsuccessful — please try again",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, orderId: SAMPLE_ORDER_ID, amount: SAMPLE_TOTAL, reason: "Bank declined the transaction" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "xCircle",
      iconBg: "#FEF2F2",
      headline: "Payment Could Not Be Processed",
      subheading: "Don't worry — your order is still saved.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "intro", html: `We tried to process the payment for order <strong>#${ctx.orderId}</strong> of <strong>${formatPrice(ctx.amount)}</strong>, but it didn't go through.` },
        { type: "highlight", tone: "danger", title: "Reason", html: ctx.reason },
        { type: "buttons", buttons: [
          { label: "Retry Payment", href: `${BASE_URL()}/profile/orders`, variant: "primary", iconKey: "card" },
          { label: "Contact Support", href: `mailto:${SUPPORT_EMAIL()}`, variant: "secondary", iconKey: "mail" },
        ] },
        { type: "footnote", html: "No amount has been deducted. If you see a hold on your account, it will be released by your bank within 3–5 business days." },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 6. Invoice / Receipt Mail
// ────────────────────────────────────────────────────────────────────────────
const tplInvoiceReceipt = def<{ name: string; orderId: string; total: number; items: Array<{ name: string; quantity: number; price: number }>; subtotal: number; shipping: number; discount: number }>({
  meta: {
    key: "invoice_receipt",
    name: "Invoice / Receipt Mail",
    description: "Standalone invoice / receipt email (with View & Download invoice buttons).",
    category: "Customer",
    defaultSubject: "Your invoice from JB Jewellery",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, orderId: SAMPLE_ORDER_ID, total: SAMPLE_TOTAL, items: SAMPLE_ITEMS, subtotal: 1397, shipping: 0, discount: 0 },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "receipt",
      iconBg: "#FFFBE6",
      headline: "Your Invoice",
      subheading: `For order #${ctx.orderId}`,
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "intro", html: `Please find your invoice below. You can also view or download a printable copy any time.` },
        { type: "items", title: "Invoice Summary", rows: ctx.items, subtotal: ctx.subtotal, discount: ctx.discount, shipping: ctx.shipping, total: ctx.total },
        { type: "buttons", buttons: [
          { label: "View Invoice", href: `${BASE_URL()}/api/orders/${ctx.orderId}/invoice`, variant: "primary", iconKey: "view" },
          { label: "Download Invoice", href: `${BASE_URL()}/api/orders/${ctx.orderId}/invoice?download=1`, variant: "secondary", iconKey: "download" },
        ] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 7. Shipping / Dispatch Mail
// ────────────────────────────────────────────────────────────────────────────
const tplShipping = def<{ name: string; orderId: string; courier: string; trackingId: string; trackingUrl: string }>({
  meta: {
    key: "shipping_dispatch",
    name: "Shipping / Dispatch Mail",
    description: "Sent when a courier picks up the order and a tracking number is available.",
    category: "Customer",
    defaultSubject: "Your order has been dispatched",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, orderId: SAMPLE_ORDER_ID, courier: "BlueDart", trackingId: "BD123456789IN", trackingUrl: "https://track.example.com/BD123456789IN" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "truck",
      iconBg: "#EDE7F6",
      headline: "Your Order is Dispatched",
      subheading: "It's officially on the way to you.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "intro", html: `Your order <strong>#${ctx.orderId}</strong> has been picked up by our courier partner.` },
        { type: "info", title: "Tracking Details", rows: [
          { label: "Courier", value: ctx.courier },
          { label: "Tracking ID", value: ctx.trackingId },
          { label: "Estimated Delivery", value: "3–5 business days" },
        ] },
        { type: "buttons", buttons: [{ label: "Track Shipment", href: ctx.trackingUrl, variant: "primary", iconKey: "truck" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 8. Out for Delivery Mail
// ────────────────────────────────────────────────────────────────────────────
const tplOutForDelivery = def<{ name: string; orderId: string; courier: string; eta: string }>({
  meta: {
    key: "out_for_delivery",
    name: "Out for Delivery Mail",
    description: "Sent when the courier marks the parcel as out for delivery.",
    category: "Customer",
    defaultSubject: "Your order is out for delivery",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, orderId: SAMPLE_ORDER_ID, courier: "BlueDart", eta: "By 8:00 PM today" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "truck",
      iconBg: "#EDE7F6",
      badge: { text: "Out for Delivery", bg: "#EDE7F6", color: "#5B21B6" },
      headline: "Almost There",
      subheading: "Your jewellery is out for delivery today.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "intro", html: `Your order <strong>#${ctx.orderId}</strong> is currently with our delivery partner ${ctx.courier} and will reach you soon.` },
        { type: "highlight", tone: "info", title: "Expected Today", html: ctx.eta },
        { type: "footnote", html: "Please ensure someone is available to receive the parcel." },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 9. Delivered Mail
// ────────────────────────────────────────────────────────────────────────────
const tplDelivered = def<{ name: string; orderId: string }>({
  meta: {
    key: "delivered_v2",
    name: "Delivered Mail",
    description: "Confirmation that the order has been delivered.",
    category: "Customer",
    defaultSubject: "Your order has been delivered",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, orderId: SAMPLE_ORDER_ID },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "package",
      iconBg: "#FFFBE6",
      headline: "Delivered",
      subheading: "We hope you love your new jewellery.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "intro", html: `Your order <strong>#${ctx.orderId}</strong> has been successfully delivered. Thank you for choosing JB Jewellery.` },
        { type: "buttons", buttons: [{ label: "Write a Review", href: `${BASE_URL()}/profile/reviews`, variant: "primary", iconKey: "star" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 10. Cancelled Order Mail
// ────────────────────────────────────────────────────────────────────────────
const tplCancelled = def<{ name: string; orderId: string; reason: string; refundAmount: number }>({
  meta: {
    key: "order_cancelled",
    name: "Cancelled Order Mail",
    description: "Notifies the customer that an order has been cancelled.",
    category: "Customer",
    defaultSubject: "Your order has been cancelled",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, orderId: SAMPLE_ORDER_ID, reason: "Cancelled at customer's request", refundAmount: SAMPLE_TOTAL },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "xCircle",
      iconBg: "#FEF2F2",
      badge: { text: "Cancelled", bg: "#FEF2F2", color: "#991B1B" },
      headline: "Order Cancelled",
      subheading: `Order #${ctx.orderId} has been cancelled.`,
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "info", title: "Cancellation Details", rows: [
          { label: "Order ID", value: `#${ctx.orderId}` },
          { label: "Reason", value: ctx.reason },
          { label: "Refund Amount", value: ctx.refundAmount > 0 ? formatPrice(ctx.refundAmount) : "Not applicable" },
        ] },
        { type: "highlight", tone: "info", html: ctx.refundAmount > 0 ? "If you have already paid, the amount will be refunded to your original payment method within 5–7 business days." : "If you were charged for this order, please contact our support team." },
        { type: "buttons", buttons: [{ label: "Contact Support", href: `mailto:${SUPPORT_EMAIL()}`, variant: "secondary", iconKey: "mail" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 11. Refund Initiated Mail
// ────────────────────────────────────────────────────────────────────────────
const tplRefundInitiated = def<{ name: string; orderId: string; amount: number; method: string; eta: string }>({
  meta: {
    key: "refund_initiated",
    name: "Refund Initiated Mail",
    description: "Confirms that a refund has been initiated.",
    category: "Customer",
    defaultSubject: "Your refund has been initiated",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, orderId: SAMPLE_ORDER_ID, amount: SAMPLE_TOTAL, method: "Original payment method", eta: "5–7 business days" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "refund",
      iconBg: "#ECFDF5",
      headline: "Refund Initiated",
      subheading: "Your refund is on its way.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "intro", html: `We have initiated a refund for your order <strong>#${ctx.orderId}</strong>.` },
        { type: "info", title: "Refund Details", rows: [
          { label: "Amount", value: formatPrice(ctx.amount) },
          { label: "Refund Method", value: ctx.method },
          { label: "Expected By", value: ctx.eta },
        ] },
        { type: "footnote", html: "We'll send another email as soon as the refund is completed." },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 12. Refund Completed Mail
// ────────────────────────────────────────────────────────────────────────────
const tplRefundCompleted = def<{ name: string; orderId: string; amount: number; transactionId: string }>({
  meta: {
    key: "refund_completed",
    name: "Refund Completed Mail",
    description: "Confirms a refund has been credited.",
    category: "Customer",
    defaultSubject: "Your refund has been completed",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, orderId: SAMPLE_ORDER_ID, amount: SAMPLE_TOTAL, transactionId: "RFND98765432" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "check",
      iconBg: "#ECFDF5",
      headline: "Refund Completed",
      subheading: "The amount has been credited.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "intro", html: `Your refund of <strong>${formatPrice(ctx.amount)}</strong> for order <strong>#${ctx.orderId}</strong> has been completed.` },
        { type: "info", title: "Refund Reference", rows: [
          { label: "Transaction ID", value: ctx.transactionId },
          { label: "Date", value: fmtDateTime() },
        ] },
        { type: "footnote", html: "The amount may take up to 24 hours to reflect in your statement, depending on your bank." },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 13. Return Request Mail
// ────────────────────────────────────────────────────────────────────────────
const tplReturnRequest = def<{ name: string; orderId: string; itemName: string; reason: string }>({
  meta: {
    key: "return_request",
    name: "Return Request Mail",
    description: "Acknowledges a customer's return request.",
    category: "Customer",
    defaultSubject: "We've received your return request",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, orderId: SAMPLE_ORDER_ID, itemName: "Pearl Drop Earrings", reason: "Item was damaged on arrival" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "rotate",
      iconBg: "#ECFEFF",
      headline: "Return Request Received",
      subheading: "We're reviewing your request.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "info", title: "Return Details", rows: [
          { label: "Order ID", value: `#${ctx.orderId}` },
          { label: "Item", value: ctx.itemName },
          { label: "Reason", value: ctx.reason },
        ] },
        { type: "highlight", tone: "info", title: "What happens next", html: "Our team will review your return within 1–2 business days and reach out with the next steps (pickup arrangement and refund/replacement)." },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 14. Exchange Request Mail
// ────────────────────────────────────────────────────────────────────────────
const tplExchangeRequest = def<{ name: string; orderId: string; itemName: string; replacement: string }>({
  meta: {
    key: "exchange_request",
    name: "Exchange Request Mail",
    description: "Acknowledges a customer's exchange request.",
    category: "Customer",
    defaultSubject: "We've received your exchange request",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, orderId: SAMPLE_ORDER_ID, itemName: "Crystal Bracelet (size S)", replacement: "Crystal Bracelet (size M)" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "rotate",
      iconBg: "#ECFEFF",
      headline: "Exchange Request Received",
      subheading: "We're processing your exchange.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "info", title: "Exchange Details", rows: [
          { label: "Order ID", value: `#${ctx.orderId}` },
          { label: "Item", value: ctx.itemName },
          { label: "Replace With", value: ctx.replacement },
        ] },
        { type: "highlight", tone: "info", title: "What happens next", html: "Our team will arrange a pickup of the original item and dispatch the replacement once we receive it." },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 15. Abandoned Cart Mail
// ────────────────────────────────────────────────────────────────────────────
const tplAbandonedCart = def<{ name: string; products: Array<{ name: string; price: number }> }>({
  meta: {
    key: "abandoned_cart",
    name: "Abandoned Cart Mail",
    description: "Reminder for customers who left items in their cart without checking out.",
    category: "Marketing",
    defaultSubject: "You left something behind",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, products: [{ name: "Pearl Drop Earrings", price: 299 }, { name: "Gold-tone Choker Set", price: 799 }] },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "cart",
      iconBg: "#FFFBE6",
      headline: "You Left Something Behind",
      subheading: "Your cart is waiting for you.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "intro", html: `These pieces caught your eye but didn't make it to checkout. Complete your purchase before they're gone.` },
        { type: "products", title: "Still in your cart", products: ctx.products.map((p) => ({ ...p, href: BASE_URL() })) },
        { type: "buttons", buttons: [{ label: "Return to Cart", href: `${BASE_URL()}/cart`, variant: "primary", iconKey: "cart" }] },
        { type: "highlight", tone: "warning", html: "Use code <strong>BACK10</strong> at checkout for an extra 10% off." },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 16. Promotional / Offer Mail
// ────────────────────────────────────────────────────────────────────────────
const tplPromo = def<{ name: string; offerTitle: string; offerDetails: string; couponCode: string; validTill: string }>({
  meta: {
    key: "promotional_offer",
    name: "Promotional / Offer Mail",
    description: "Marketing email for a sale, festival or limited-time offer.",
    category: "Marketing",
    defaultSubject: "An exclusive offer just for you",
    audience: "Subscribers",
  },
  sample: { name: SAMPLE_NAME, offerTitle: "Festive Sale — Up to 40% Off", offerDetails: "Celebrate with our biggest sale of the year. Discover hand-picked jewellery at unbeatable prices.", couponCode: "FESTIVE40", validTill: "31 Oct 2026" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "megaphone",
      iconBg: "#FCE7F3",
      badge: { text: "Limited Time", bg: "#FCE7F3", color: "#9D174D" },
      headline: ctx.offerTitle,
      subheading: ctx.offerDetails,
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "code", label: "Use Code", code: ctx.couponCode },
        { type: "highlight", tone: "warning", html: `Valid till <strong>${ctx.validTill}</strong>. Don't miss out.` },
        { type: "buttons", buttons: [{ label: "Shop the Sale", href: BASE_URL(), variant: "primary", iconKey: "sparkle" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 17. Discount Coupon Mail
// ────────────────────────────────────────────────────────────────────────────
const tplCoupon = def<{ name: string; couponCode: string; discountPercent: number; validTill: string; minSpend?: number }>({
  meta: {
    key: "discount_coupon",
    name: "Discount Coupon Mail",
    description: "Personalised coupon delivered to a specific customer.",
    category: "Marketing",
    defaultSubject: "Here's a special coupon for you",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, couponCode: "JBVIP15", discountPercent: 15, validTill: "31 May 2026", minSpend: 999 },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "percent",
      iconBg: "#FCE7F3",
      headline: `${ctx.discountPercent}% Off Just for You`,
      subheading: "A small thank-you for being part of our community.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "code", label: "Your Coupon Code", code: ctx.couponCode },
        { type: "info", title: "Coupon Details", rows: [
          { label: "Discount", value: `${ctx.discountPercent}%` },
          { label: "Valid Till", value: ctx.validTill },
          { label: "Min. Spend", value: ctx.minSpend ? formatPrice(ctx.minSpend) : "None" },
        ] },
        { type: "buttons", buttons: [{ label: "Redeem Now", href: BASE_URL(), variant: "primary", iconKey: "gift" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 18. New Arrival Mail
// ────────────────────────────────────────────────────────────────────────────
const tplNewArrivalGeneric = def<{ name: string; products: Array<{ name: string; price: number }> }>({
  meta: {
    key: "new_arrival_v2",
    name: "New Arrival Mail",
    description: "Showcase new pieces just launched in the collection.",
    category: "Marketing",
    defaultSubject: "Fresh arrivals — handpicked for you",
    audience: "Subscribers",
  },
  sample: { name: SAMPLE_NAME, products: [{ name: "Royal Kundan Choker", price: 1299 }, { name: "Diamond Stud Earrings", price: 899 }] },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "sparkle",
      iconBg: "#FFFBE6",
      badge: { text: "New Arrivals" },
      headline: "Fresh Arrivals This Week",
      subheading: "Hand-picked styles just landed in our collection.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "products", products: ctx.products.map((p) => ({ ...p, href: BASE_URL() })) },
        { type: "buttons", buttons: [{ label: "Explore Collection", href: BASE_URL(), variant: "primary", iconKey: "view" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 19. Review Request Mail
// ────────────────────────────────────────────────────────────────────────────
const tplReviewRequest = def<{ name: string; orderId: string; productName: string }>({
  meta: {
    key: "review_request",
    name: "Review Request Mail",
    description: "Asks the customer to leave a product review after delivery.",
    category: "Customer",
    defaultSubject: "How did you like your purchase?",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, orderId: SAMPLE_ORDER_ID, productName: "Pearl Drop Earrings" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "star",
      iconBg: "#FFFBE6",
      headline: "How Did We Do?",
      subheading: "Your honest review helps us — and other shoppers.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "intro", html: `We hope you're loving your <strong>${ctx.productName}</strong> from order <strong>#${ctx.orderId}</strong>. We'd really appreciate it if you could share a quick review.` },
        { type: "buttons", buttons: [{ label: "Write a Review", href: `${BASE_URL()}/profile/reviews`, variant: "primary", iconKey: "star" }] },
        { type: "footnote", html: "It only takes a minute and helps our small business immensely." },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 20. Wishlist Reminder Mail
// ────────────────────────────────────────────────────────────────────────────
const tplWishlistReminder = def<{ name: string; products: Array<{ name: string; price: number }> }>({
  meta: {
    key: "wishlist_reminder",
    name: "Wishlist Reminder Mail",
    description: "Reminds the customer about items saved in their wishlist.",
    category: "Marketing",
    defaultSubject: "Items on your wishlist are waiting",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, products: [{ name: "Gold-tone Choker Set", price: 799 }, { name: "Crystal Bracelet", price: 449 }] },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "heart",
      iconBg: "#FFE4E6",
      headline: "Still Thinking About These?",
      subheading: "Your wishlist favourites are still available.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "products", title: "From your wishlist", products: ctx.products.map((p) => ({ ...p, href: BASE_URL() })) },
        { type: "buttons", buttons: [{ label: "View My Wishlist", href: `${BASE_URL()}/profile/wishlist`, variant: "primary", iconKey: "heart" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 21. Back in Stock Mail
// ────────────────────────────────────────────────────────────────────────────
const tplBackInStock = def<{ name: string; productName: string; price: number }>({
  meta: {
    key: "back_in_stock",
    name: "Back in Stock Mail",
    description: "Notifies a subscribed customer that a product is back in stock.",
    category: "Marketing",
    defaultSubject: "It's back — your favourite is in stock",
    audience: "Subscribers",
  },
  sample: { name: SAMPLE_NAME, productName: "Pearl Drop Earrings", price: 299 },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "bell",
      iconBg: "#ECFDF5",
      badge: { text: "Back in Stock", bg: "#ECFDF5", color: "#047857" },
      headline: "It's Back",
      subheading: `${ctx.productName} is available again.`,
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "highlight", tone: "success", html: `<strong>${ctx.productName}</strong> — ${formatPrice(ctx.price)}. Limited stock available.` },
        { type: "buttons", buttons: [{ label: "Grab It Now", href: BASE_URL(), variant: "primary", iconKey: "sparkle" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 22. Low Stock Alert Mail (customer / wishlist version)
// ────────────────────────────────────────────────────────────────────────────
const tplLowStockCustomer = def<{ name: string; productName: string; remaining: number; price: number }>({
  meta: {
    key: "low_stock_customer",
    name: "Low Stock Alert Mail",
    description: "Tells a customer that an item on their wishlist is running low on stock.",
    category: "Marketing",
    defaultSubject: "Selling fast — only a few left",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, productName: "Gold-tone Choker Set", remaining: 3, price: 799 },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "alert",
      iconBg: "#FFFBEB",
      badge: { text: "Selling Fast", bg: "#FFFBEB", color: "#92400E" },
      headline: "Only a Few Left",
      subheading: `${ctx.productName} is almost sold out.`,
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "highlight", tone: "warning", html: `Only <strong>${ctx.remaining}</strong> left in stock. Grab yours at <strong>${formatPrice(ctx.price)}</strong> before it's gone.` },
        { type: "buttons", buttons: [{ label: "Buy Now", href: BASE_URL(), variant: "primary", iconKey: "cart" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 23. Account Password Reset Mail
// ────────────────────────────────────────────────────────────────────────────
const tplPasswordReset = def<{ name: string; resetUrl: string; expiresInMinutes: number }>({
  meta: {
    key: "password_reset",
    name: "Account Password Reset Mail",
    description: "Sends a password reset link when the customer uses 'Forgot password'.",
    category: "Customer",
    defaultSubject: "Reset your JB Jewellery password",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, resetUrl: `${BASE_URL()}/reset-password?token=sample-token`, expiresInMinutes: 30 },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "lock",
      iconBg: "#EDE7F6",
      headline: "Reset Your Password",
      subheading: "We received a request to reset your password.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "intro", html: `Click the button below to choose a new password. This link is valid for <strong>${ctx.expiresInMinutes} minutes</strong>.` },
        { type: "buttons", buttons: [{ label: "Reset Password", href: ctx.resetUrl, variant: "primary", iconKey: "lock" }] },
        { type: "footnote", html: "If you didn't request a password reset, you can safely ignore this email — your password will not change." },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 24. Password Changed Alert (after a successful change)
// ────────────────────────────────────────────────────────────────────────────
const tplPasswordChanged = def<{ name: string; when: string; ip?: string }>({
  meta: {
    key: "password_changed",
    name: "Password Changed Alert Mail",
    description: "Confirms that the account password was successfully changed.",
    category: "Customer",
    defaultSubject: "Your password was changed",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, when: fmtDateTime(), ip: "203.0.113.42" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "shield",
      iconBg: "#EFF6FF",
      headline: "Password Changed",
      subheading: "Your account password was just updated.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "info", title: "Change Details", rows: [
          { label: "When", value: ctx.when },
          ...(ctx.ip ? [{ label: "IP Address", value: ctx.ip }] : []),
        ] },
        { type: "highlight", tone: "danger", title: "Was this not you?", html: `If you did not change your password, please reset it immediately and contact us at <a href="mailto:${SUPPORT_EMAIL()}" style="color:#991B1B;font-weight:700;">${SUPPORT_EMAIL()}</a>.` },
        { type: "buttons", buttons: [{ label: "Reset Password", href: `${BASE_URL()}/forgot-password`, variant: "secondary", iconKey: "lock" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 25. Login Alert Mail (12-hour cooldown)
// ────────────────────────────────────────────────────────────────────────────
const tplLoginAlert = def<{ name: string; when: string; ip?: string; userAgent?: string }>({
  meta: {
    key: "login_alert",
    name: "Login Alert Mail",
    description: "Notifies the customer of a new login (with a 12-hour cooldown to avoid spamming).",
    category: "Customer",
    defaultSubject: "New sign-in to your JB Jewellery account",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, when: fmtDateTime(), ip: "203.0.113.42", userAgent: "Chrome on Windows" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "shield",
      iconBg: "#EFF6FF",
      headline: "New Sign-in to Your Account",
      subheading: "We noticed a new login on your account.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "info", title: "Sign-in Details", rows: [
          { label: "When", value: ctx.when },
          ...(ctx.ip ? [{ label: "IP Address", value: ctx.ip }] : []),
          ...(ctx.userAgent ? [{ label: "Device", value: ctx.userAgent }] : []),
        ] },
        { type: "highlight", tone: "info", title: "Was this you?", html: "If yes, you can ignore this message. If not, please reset your password immediately." },
        { type: "buttons", buttons: [{ label: "Secure My Account", href: `${BASE_URL()}/forgot-password`, variant: "danger", iconKey: "lock" }] },
        { type: "footnote", html: "To avoid spamming you, we send this alert at most once every 12 hours." },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 26. Customer Support Reply Mail
// ────────────────────────────────────────────────────────────────────────────
const tplSupportReply = def<{ name: string; ticketId: string; subject: string; reply: string; agent: string }>({
  meta: {
    key: "support_reply",
    name: "Customer Support Reply Mail",
    description: "A direct reply from the support team to a customer ticket.",
    category: "Customer",
    defaultSubject: "Re: your support request",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, ticketId: "TKT-00123", subject: "Question about my order", reply: "Hi Riya, your order has been packed and will be shipped tomorrow morning. Tracking details will follow once dispatched. Thank you for your patience.", agent: "Anjali (Support Team)" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "support",
      iconBg: "#EDE7F6",
      headline: "We've Replied to Your Request",
      subheading: `Ticket ${ctx.ticketId}`,
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "info", title: "Ticket Details", rows: [
          { label: "Ticket ID", value: ctx.ticketId },
          { label: "Subject", value: ctx.subject },
          { label: "Replied By", value: ctx.agent },
        ] },
        { type: "highlight", tone: "muted", title: "Our Reply", html: ctx.reply.replace(/\n/g, "<br>") },
        { type: "buttons", buttons: [{ label: "Reply to Support", href: `mailto:${SUPPORT_EMAIL()}`, variant: "primary", iconKey: "mail" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 27. Contact Form Response Mail
// ────────────────────────────────────────────────────────────────────────────
const tplContactResponse = def<{ name: string; message: string }>({
  meta: {
    key: "contact_response",
    name: "Contact Form Response Mail",
    description: "Auto-reply confirming a contact form submission.",
    category: "Customer",
    defaultSubject: "Thanks for getting in touch",
    audience: "Customer",
  },
  sample: { name: SAMPLE_NAME, message: "I had a question about international shipping for the Royal Kundan Choker." },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "mail",
      iconBg: "#EFF6FF",
      headline: "We Got Your Message",
      subheading: "Thank you for reaching out to JB Jewellery.",
      greeting: `Hi ${ctx.name},`,
      sections: [
        { type: "intro", html: `We have received your message and our team will get back to you within <strong>24 business hours</strong>.` },
        { type: "highlight", tone: "muted", title: "Your Message", html: ctx.message.replace(/\n/g, "<br>") },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 28. Newsletter Subscription Mail
// ────────────────────────────────────────────────────────────────────────────
const tplNewsletterSub = def<{ email: string }>({
  meta: {
    key: "newsletter_subscription",
    name: "Newsletter Subscription Mail",
    description: "Welcomes a new newsletter subscriber.",
    category: "Customer",
    defaultSubject: "You're subscribed to JB Jewellery",
    audience: "Subscribers",
  },
  sample: { email: "subscriber@example.com" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "mail",
      iconBg: "#FCE7F3",
      headline: "You're In",
      subheading: "Thank you for subscribing to JB Jewellery updates.",
      sections: [
        { type: "intro", html: `<strong>${ctx.email}</strong> has been added to our list. You'll be the first to know about new arrivals, festive sales and exclusive offers.` },
        { type: "highlight", tone: "info", title: "Welcome Gift", html: "Use code <strong>SUB10</strong> at checkout to enjoy 10% off your next order." },
        { type: "buttons", buttons: [{ label: "Start Shopping", href: BASE_URL(), variant: "primary", iconKey: "sparkle" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 29. Unsubscribe Confirmation Mail
// ────────────────────────────────────────────────────────────────────────────
const tplUnsubscribe = def<{ email: string }>({
  meta: {
    key: "unsubscribe_confirmation",
    name: "Unsubscribe Confirmation Mail",
    description: "Confirms that the email address has been unsubscribed.",
    category: "Customer",
    defaultSubject: "You have been unsubscribed",
    audience: "Subscribers",
  },
  sample: { email: "subscriber@example.com" },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "xCircle",
      iconBg: "#F3F4F6",
      headline: "You've Been Unsubscribed",
      subheading: "We're sorry to see you go.",
      sections: [
        { type: "intro", html: `<strong>${ctx.email}</strong> has been removed from our newsletter list. You will no longer receive marketing emails from JB Jewellery.` },
        { type: "highlight", tone: "muted", title: "Changed your mind?", html: "You can resubscribe any time from the footer of our website." },
        { type: "buttons", buttons: [{ label: "Visit Our Store", href: BASE_URL(), variant: "secondary", iconKey: "view" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// 30. Admin — Low Stock Alert Mail
// ────────────────────────────────────────────────────────────────────────────
const tplAdminLowStock = def<{ products: Array<{ name: string; remaining: number; sku?: string }> }>({
  meta: {
    key: "admin_low_stock",
    name: "Admin Low Stock Alert Mail",
    description: "Sent to the admin when one or more products dip below the low-stock threshold.",
    category: "Admin",
    defaultSubject: "Low stock alert — restock required",
    audience: "Admin",
  },
  sample: { products: [{ name: "Pearl Drop Earrings", remaining: 2, sku: "PDE-001" }, { name: "Gold-tone Choker Set", remaining: 1, sku: "GCS-003" }] },
  render: (ctx) => {
    const productList = ctx.products
      .map((p) => `<tr><td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;font-size:13px;color:#111;">${p.name}${p.sku ? `<br><span style="font-size:11px;color:#888;font-family:monospace;">${p.sku}</span>` : ""}</td><td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;font-size:13px;color:#DC2626;font-weight:800;text-align:right;">${p.remaining} left</td></tr>`)
      .join("");
    return renderGenericEmail({
      iconKey: "alert",
      iconBg: "#FEF2F2",
      badge: { text: "Action Required", bg: "#FEF2F2", color: "#991B1B" },
      headline: "Low Stock Alert",
      subheading: "Some products are about to run out.",
      sections: [
        { type: "intro", html: `${ctx.products.length} product${ctx.products.length === 1 ? " is" : "s are"} below the low-stock threshold and need restocking.` },
        { type: "highlight", tone: "muted", title: "Affected Items", html: `<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #F0F0F0;border-radius:8px;overflow:hidden;">${productList}</table>` },
        { type: "buttons", buttons: [{ label: "Open Admin Panel", href: `${ADMIN_PANEL_URL()}/products`, variant: "primary", iconKey: "package" }] },
      ],
    });
  },
});

// ────────────────────────────────────────────────────────────────────────────
// 31. Admin — New User Signup Mail
// ────────────────────────────────────────────────────────────────────────────
const tplAdminNewSignup = def<{ name: string; email: string; phone?: string; signupAt: string }>({
  meta: {
    key: "admin_new_signup",
    name: "Admin New User Signup Mail",
    description: "Internal notification when a new customer creates an account.",
    category: "Admin",
    defaultSubject: "New customer signup",
    audience: "Admin",
  },
  sample: { name: SAMPLE_NAME, email: "riya@example.com", phone: "+91 98765 43210", signupAt: SAMPLE_ORDER_DATE },
  render: (ctx) =>
    renderGenericEmail({
      iconKey: "user",
      iconBg: "#EFF6FF",
      headline: "New Customer Signup",
      subheading: "A new user has joined JB Jewellery.",
      sections: [
        { type: "info", title: "Customer Details", rows: [
          { label: "Name", value: ctx.name },
          { label: "Email", value: ctx.email },
          ...(ctx.phone ? [{ label: "Phone", value: ctx.phone }] : []),
          { label: "Signed Up", value: fmtDateTime(ctx.signupAt) },
        ] },
        { type: "buttons", buttons: [{ label: "View in Admin Panel", href: `${ADMIN_PANEL_URL()}/customers`, variant: "primary", iconKey: "user" }] },
      ],
    }),
});

// ────────────────────────────────────────────────────────────────────────────
// Registry
// ────────────────────────────────────────────────────────────────────────────
export const TEMPLATE_REGISTRY: Record<string, AnyTemplate> = {
  welcome: tplWelcome,
  otp_verification: tplOtp,
  order_confirmation: tplOrderConfirmation,
  payment_success: tplPaymentSuccess,
  payment_failed: tplPaymentFailed,
  invoice_receipt: tplInvoiceReceipt,
  shipping_dispatch: tplShipping,
  out_for_delivery: tplOutForDelivery,
  delivered_v2: tplDelivered,
  order_cancelled: tplCancelled,
  refund_initiated: tplRefundInitiated,
  refund_completed: tplRefundCompleted,
  return_request: tplReturnRequest,
  exchange_request: tplExchangeRequest,
  abandoned_cart: tplAbandonedCart,
  promotional_offer: tplPromo,
  discount_coupon: tplCoupon,
  new_arrival_v2: tplNewArrivalGeneric,
  review_request: tplReviewRequest,
  wishlist_reminder: tplWishlistReminder,
  back_in_stock: tplBackInStock,
  low_stock_customer: tplLowStockCustomer,
  password_reset: tplPasswordReset,
  password_changed: tplPasswordChanged,
  login_alert: tplLoginAlert,
  support_reply: tplSupportReply,
  contact_response: tplContactResponse,
  newsletter_subscription: tplNewsletterSub,
  unsubscribe_confirmation: tplUnsubscribe,
  admin_low_stock: tplAdminLowStock,
  admin_new_signup: tplAdminNewSignup,
};

export function getTemplateMetaList(): TemplateMeta[] {
  return Object.values(TEMPLATE_REGISTRY).map((t) => t.meta);
}

export function renderTemplateByKey(key: string, ctx?: Record<string, unknown>): { meta: TemplateMeta; html: string } | null {
  const t = TEMPLATE_REGISTRY[key];
  if (!t) return null;
  const data = (ctx || t.sample) as Record<string, unknown>;
  return { meta: t.meta, html: t.render(data) };
}

export async function sendTemplateByKey(
  key: string,
  to: string,
  ctx?: Record<string, unknown>,
  subject?: string,
): Promise<void> {
  const r = renderTemplateByKey(key, ctx);
  if (!r) throw new Error(`Unknown template: ${key}`);
  await sendMail(to, subject || r.meta.defaultSubject, r.html);
}

// ── Convenience senders for the common transactional flows ──────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  await sendTemplateByKey("welcome", to, { name });
}

export async function sendLoginAlertEmail(
  to: string,
  ctx: { name: string; when?: string; ip?: string; userAgent?: string },
) {
  await sendTemplateByKey("login_alert", to, {
    name: ctx.name,
    when: ctx.when || fmtDateTime(),
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  ctx: { name: string; resetUrl: string; expiresInMinutes?: number },
) {
  await sendTemplateByKey("password_reset", to, {
    name: ctx.name,
    resetUrl: ctx.resetUrl,
    expiresInMinutes: ctx.expiresInMinutes ?? 30,
  });
}

export async function sendPasswordChangedEmail(
  to: string,
  ctx: { name: string; when?: string; ip?: string },
) {
  await sendTemplateByKey("password_changed", to, {
    name: ctx.name,
    when: ctx.when || fmtDateTime(),
    ip: ctx.ip,
  });
}

export async function sendAdminNewSignupEmail(
  to: string,
  ctx: { name: string; email: string; phone?: string; signupAt?: string },
) {
  await sendTemplateByKey(
    "admin_new_signup",
    to,
    {
      name: ctx.name,
      email: ctx.email,
      phone: ctx.phone,
      signupAt: ctx.signupAt || new Date().toISOString(),
    },
    `New signup — ${ctx.name}`,
  );
}
