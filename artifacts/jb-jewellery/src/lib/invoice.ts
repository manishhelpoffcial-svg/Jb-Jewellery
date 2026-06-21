import jsPDF from 'jspdf';
import type { Order } from './orders';
import { adminApi } from './adminApi';

const GOLD: [number, number, number] = [212, 175, 55];
const DARK: [number, number, number] = [20, 20, 20];
const SOFT: [number, number, number] = [240, 232, 200];
const MUTED: [number, number, number] = [110, 110, 110];

function formatINR(n: number) {
  return `Rs.${Number(n || 0).toLocaleString('en-IN')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Build a beautiful, print-ready A4 invoice using jsPDF.
 * Uses gold/black branding; no images so it works offline & is small.
 */
export function buildInvoicePdf(order: Order): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;

  // ── HEADER (gold band) ──────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 38, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 38, W, 4, 'F');

  doc.setTextColor(...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('JB JEWELLERY', M, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(230, 230, 230);
  doc.text('COLLECTION', M, 25);
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text('Fashion Jewellery  |  hello@jbjewellery.com', M, 31);

  // INVOICE box top-right
  doc.setFillColor(...GOLD);
  doc.roundedRect(W - 70, 8, 56, 22, 2, 2, 'F');
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('INVOICE', W - 42, 18, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${order.orderId}`, W - 42, 25, { align: 'center' });

  let y = 52;

  // ── BILL TO / INVOICE META ──────────────────────────────────────────
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BILL TO', M, y);
  doc.text('INVOICE DETAILS', W - 80, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(M, y + 1.5, M + 18, y + 1.5);
  doc.line(W - 80, y + 1.5, W - 80 + 32, y + 1.5);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(order.address.fullName || order.customerName, M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const addrLine = `${order.address.line1}${order.address.line2 ? ', ' + order.address.line2 : ''}`;
  const addrLines = doc.splitTextToSize(addrLine, 80);
  doc.text(addrLines, M, y + 5);
  doc.text(
    `${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
    M,
    y + 5 + addrLines.length * 4,
  );
  doc.text(
    `Phone: +91 ${order.address.phone || order.phone}`,
    M,
    y + 9 + addrLines.length * 4,
  );
  doc.text(`Email: ${order.email}`, M, y + 13 + addrLines.length * 4);

  // Invoice meta box
  const metaX = W - 80;
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text('Invoice Date:', metaX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(order.createdAt), metaX + 30, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Order ID:', metaX, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${order.orderId}`, metaX + 30, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment:', metaX, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.text('Cash on Delivery', metaX + 30, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text('Status:', metaX, y + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GOLD);
  doc.text(order.status.toUpperCase(), metaX + 30, y + 15);
  doc.setTextColor(...DARK);

  y = Math.max(y + 22, y + 13 + addrLines.length * 4 + 6);
  y += 4;

  // ── ITEMS TABLE ─────────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(M, y, W - 2 * M, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text('#', M + 2, y + 6);
  doc.text('ITEM', M + 10, y + 6);
  doc.text('QTY', W - 70, y + 6, { align: 'center' });
  doc.text('RATE', W - 45, y + 6, { align: 'right' });
  doc.text('AMOUNT', W - M - 2, y + 6, { align: 'right' });
  y += 9;

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  order.items.forEach((it, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...SOFT);
      doc.rect(M, y, W - 2 * M, 8, 'F');
    }
    const name = doc.splitTextToSize(it.name, 75)[0] as string;
    doc.text(String(i + 1), M + 2, y + 5.5);
    doc.text(name, M + 10, y + 5.5);
    doc.text(String(it.quantity), W - 70, y + 5.5, { align: 'center' });
    doc.text(formatINR(it.price), W - 45, y + 5.5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatINR(it.price * it.quantity), W - M - 2, y + 5.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 8;
  });

  // ── TOTALS BOX ──────────────────────────────────────────────────────
  y += 4;
  const totalsX = W - 90;
  const totalsW = 76;
  const rows: { label: string; value: string; bold?: boolean; gold?: boolean }[] = [
    { label: 'Subtotal', value: formatINR(order.subtotal) },
    {
      label: 'Shipping',
      value: order.shipping === 0 ? 'FREE' : formatINR(order.shipping),
    },
    { label: 'Tax (5%)', value: formatINR(order.tax) },
  ];
  if (order.discount > 0) {
    rows.push({
      label: `Discount${order.couponCode ? ` (${order.couponCode})` : ''}`,
      value: `-${formatINR(order.discount)}`,
    });
  }

  doc.setFontSize(9);
  rows.forEach((r) => {
    doc.setTextColor(...MUTED);
    doc.text(r.label, totalsX, y);
    doc.setTextColor(...DARK);
    doc.text(r.value, totalsX + totalsW, y, { align: 'right' });
    y += 6;
  });

  // Grand total band
  doc.setFillColor(...GOLD);
  doc.rect(totalsX - 4, y - 2, totalsW + 6, 12, 'F');
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GRAND TOTAL', totalsX, y + 5.5);
  doc.text(formatINR(order.grandTotal), totalsX + totalsW, y + 5.5, { align: 'right' });
  y += 16;

  // ── FOOTER ──────────────────────────────────────────────────────────
  const footY = H - 30;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(M, footY - 4, W - M, footY - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text('Thank you for shopping with JB Jewellery!', W / 2, footY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    'For support: hello@jbjewellery.com  |  WhatsApp +91 74329 20601',
    W / 2,
    footY + 5,
    { align: 'center' },
  );
  doc.setFontSize(7);
  doc.text(
    'This is a computer-generated invoice and does not require a physical signature.',
    W / 2,
    footY + 10,
    { align: 'center' },
  );

  // Watermark
  doc.setFontSize(60);
  doc.setTextColor(245, 235, 200);
  doc.text('JB', W / 2, H / 2, { align: 'center', angle: -25 });

  return doc;
}

/** Trigger a browser download of the invoice PDF. */
export function downloadInvoicePdf(order: Order) {
  const doc = buildInvoicePdf(order);
  doc.save(`JB-Invoice-${order.orderId}.pdf`);
}

/** Open the invoice in a new tab styled for printing. */
export function printInvoice(order: Order) {
  const doc = buildInvoicePdf(order);
  const blobUrl = doc.output('bloburl');
  const win = window.open(blobUrl, '_blank');
  if (win) {
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        /* noop */
      }
    }, 800);
  }
}

/** Build the PDF and upload it to Supabase storage via the admin endpoint.
 *  Returns the stored public URL.
 *  Silently no-ops if the admin token isn't available client-side. */
export async function uploadInvoiceToStorage(order: Order): Promise<string | null> {
  try {
    const doc = buildInvoicePdf(order);
    // datauristring → strip "data:application/pdf;filename=...;base64,"
    const dataUri = doc.output('datauristring');
    const base64 = dataUri.split(',')[1] || '';
    if (!base64) return null;
    const result = await adminApi.uploadInvoice(order.orderId, base64);
    return result.invoice_url;
  } catch (err) {
    console.warn('[invoice] upload failed', err);
    return null;
  }
}
