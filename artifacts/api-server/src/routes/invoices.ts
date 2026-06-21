import { Router } from "express";
import type { Request, Response } from "express";
import { simpleAdminMiddleware } from "../lib/auth.js";
import {
  renderTaxInvoiceHtml,
  getBusinessSettings,
  transporter,
  ZOHO_EMAIL,
  type TaxInvoiceData,
  type TaxInvoiceParty,
  type TaxInvoiceLine,
} from "../lib/mailer.js";

const router = Router();

function sanitizeParty(p: unknown): TaxInvoiceParty {
  const o = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
  return {
    name: String(o.name || ""),
    address: String(o.address || ""),
    state: o.state ? String(o.state) : undefined,
    stateCode: o.stateCode ? String(o.stateCode) : undefined,
    gstin: o.gstin ? String(o.gstin) : undefined,
    phone: o.phone ? String(o.phone) : undefined,
    email: o.email ? String(o.email) : undefined,
    customerType: o.customerType ? String(o.customerType) : undefined,
  };
}

function sanitizeLines(lines: unknown): TaxInvoiceLine[] {
  if (!Array.isArray(lines)) return [];
  return lines
    .map((raw) => {
      const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const description = String(o.description || "").trim();
      if (!description) return null;
      return {
        description,
        hsn: o.hsn ? String(o.hsn) : undefined,
        qty: Math.max(0, Number(o.qty) || 0),
        unitPrice: Math.max(0, Number(o.unitPrice) || 0),
        discount: Math.max(0, Number(o.discount) || 0),
        otherCharges: Math.max(0, Number(o.otherCharges) || 0),
        gstRate: o.gstRate !== undefined && o.gstRate !== null && o.gstRate !== "" ? Number(o.gstRate) : undefined,
      } as TaxInvoiceLine;
    })
    .filter((l): l is TaxInvoiceLine => l !== null && l.qty > 0);
}

function buildInvoiceFromBody(body: unknown): TaxInvoiceData {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const billTo = sanitizeParty(b.billTo);
  const shipTo = b.shipTo ? sanitizeParty(b.shipTo) : billTo;
  const lines = sanitizeLines(b.lines);
  const invoiceDate = b.invoiceDate ? String(b.invoiceDate) : new Date().toISOString();
  const invoiceNumber = b.invoiceNumber
    ? String(b.invoiceNumber)
    : `JB${new Date(invoiceDate).toISOString().slice(2, 7).replace("-", "")}${Math.floor(Math.random() * 900000 + 100000)}`;
  return {
    invoiceNumber,
    invoiceDate,
    orderNumber: b.orderNumber ? String(b.orderNumber) : undefined,
    orderDate: b.orderDate ? String(b.orderDate) : invoiceDate,
    natureOfSupply: b.natureOfSupply ? String(b.natureOfSupply) : "Goods",
    placeOfSupply: b.placeOfSupply
      ? String(b.placeOfSupply)
      : billTo.state
      ? `${billTo.state}${billTo.stateCode ? " (" + billTo.stateCode + ")" : ""}`
      : "",
    paymentMethod: b.paymentMethod ? String(b.paymentMethod) : undefined,
    billTo,
    shipTo,
    lines,
    shipping: b.shipping !== undefined && b.shipping !== "" ? Number(b.shipping) : 0,
    notes: b.notes ? String(b.notes) : undefined,
  };
}

// POST /api/admin/invoices/preview — returns rendered HTML of the tax invoice
router.post("/preview", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const invoice = buildInvoiceFromBody(req.body);
    if (invoice.lines.length === 0) {
      res.status(400).json({ error: "At least one line item is required" });
      return;
    }
    const business = await getBusinessSettings();
    const html = renderTaxInvoiceHtml(invoice, business);
    res.json({ html, invoiceNumber: invoice.invoiceNumber });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to render invoice" });
  }
});

// POST /api/admin/invoices/send — render + email the invoice to the customer
router.post("/send", simpleAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>;
    const to = String(body.to || "").trim();
    const subject = String(body.subject || "").trim();
    if (!to || !/.+@.+\..+/.test(to)) {
      res.status(400).json({ error: "Valid recipient email is required" });
      return;
    }
    const invoice = buildInvoiceFromBody(body.invoice);
    if (invoice.lines.length === 0) {
      res.status(400).json({ error: "At least one line item is required" });
      return;
    }
    const business = await getBusinessSettings();
    const html = renderTaxInvoiceHtml(invoice, business);
    const brandName = business.brandName || "JB Jewellery Collection";
    const finalSubject =
      subject || `Tax Invoice ${invoice.invoiceNumber} from ${brandName}`;

    if (!ZOHO_EMAIL) {
      res.status(500).json({ error: "Mailer not configured (missing ZOHO_EMAIL)" });
      return;
    }

    await transporter.sendMail({
      from: `"${brandName}" <${ZOHO_EMAIL}>`,
      to,
      subject: finalSubject,
      html,
      attachments: [
        {
          filename: `tax-invoice-${invoice.invoiceNumber}.html`,
          content: html,
          contentType: "text/html",
        },
      ],
    });

    res.json({ success: true, sentTo: to, invoiceNumber: invoice.invoiceNumber });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to send invoice" });
  }
});

export default router;
