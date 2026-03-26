import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Download, MessageCircle, Package, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { getAllLocalOrders, Order, buildWhatsAppMessage, openWhatsApp } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';
import jsPDF from 'jspdf';

export default function OrderSuccess() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId') || '';
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const all = getAllLocalOrders();
    const found = all.find(o => o.orderId === orderId);
    if (found) setOrder(found);
  }, [orderId]);

  const downloadInvoice = () => {
    if (!order) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(255, 215, 0);
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('JB JEWELLERY COLLECTION', pageW / 2, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Fashion Jewellery | WhatsApp: +91 99999 99999', pageW / 2, 28, { align: 'center' });
    doc.text('Email: hello@jbjewellery.com', pageW / 2, 35, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 14, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: INV-${order.orderId}`, 14, 65);
    doc.text(`Order ID: ${order.orderId}`, 14, 72);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 79);

    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 14, 92);
    doc.setFont('helvetica', 'normal');
    doc.text(order.address.fullName, 14, 100);
    doc.text(`${order.address.line1}${order.address.line2 ? ', ' + order.address.line2 : ''}`, 14, 107);
    doc.text(`${order.address.city}, ${order.address.state} - ${order.address.pincode}`, 14, 114);
    doc.text(`Phone: ${order.address.phone}`, 14, 121);
    doc.text(`Email: ${order.email}`, 14, 128);

    let y = 145;
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y - 6, pageW - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('#', 16, y);
    doc.text('Item', 24, y);
    doc.text('Qty', 120, y);
    doc.text('Rate', 140, y);
    doc.text('Total', 165, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    order.items.forEach((item, i) => {
      doc.text(`${i + 1}`, 16, y);
      doc.text(item.name.substring(0, 30), 24, y);
      doc.text(`${item.quantity}`, 120, y);
      doc.text(`Rs.${item.price}`, 135, y);
      doc.text(`Rs.${item.price * item.quantity}`, 162, y);
      y += 8;
    });

    y += 4;
    doc.line(14, y, pageW - 14, y);
    y += 8;
    doc.text(`Subtotal:`, 130, y); doc.text(`Rs.${order.subtotal}`, 162, y); y += 7;
    doc.text(`Shipping:`, 130, y); doc.text(`Rs.${order.shipping}`, 162, y); y += 7;
    doc.text(`Tax (5%):`, 130, y); doc.text(`Rs.${order.tax}`, 162, y); y += 7;
    if (order.discount > 0) { doc.text(`Discount:`, 130, y); doc.text(`-Rs.${order.discount}`, 162, y); y += 7; }
    doc.line(130, y, pageW - 14, y); y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`GRAND TOTAL:`, 120, y); doc.text(`Rs.${order.grandTotal}`, 162, y); y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Payment Method: WhatsApp Order (Pay on Delivery)', 14, y); y += 7;
    doc.text(`Status: ${order.status.toUpperCase()}`, 14, y); y += 14;

    doc.setFillColor(255, 215, 0);
    doc.rect(0, y, pageW, 20, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Thank you for shopping with JB Jewellery Collection! 💛', pageW / 2, y + 8, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('www.jbjewellery.com  |  @jbjewellery', pageW / 2, y + 15, { align: 'center' });

    doc.save(`invoice-${order.orderId}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-yellow-400 p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="w-20 h-20 text-black mx-auto mb-3" />
          </motion.div>
          <h1 className="text-2xl font-black text-black">Order Placed! 🎉</h1>
          <p className="text-black/70 text-sm mt-1">Your WhatsApp order is on its way!</p>
          {order && (
            <div className="mt-4 bg-black/10 rounded-xl px-4 py-2 inline-block">
              <p className="text-xs font-bold text-black/80 uppercase tracking-wider">Order ID</p>
              <p className="font-black text-black text-lg">#{order.orderId}</p>
            </div>
          )}
        </div>

        <div className="p-6">
          {order ? (
            <div className="space-y-4">
              {/* Order summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Order Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span><span className="font-semibold">{formatPrice(order.subtotal)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2"><span>Total Paid</span><span>{formatPrice(order.grandTotal)}</span></div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <Package className="w-8 h-8 text-green-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-green-800">Order Received</p>
                  <p className="text-xs text-green-600">We'll confirm via WhatsApp within minutes!</p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={downloadInvoice}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Invoice PDF
                </button>
                <button
                  onClick={() => openWhatsApp(`Hi! I placed order #${order.orderId}. Please confirm.`)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-xl text-sm font-semibold hover:bg-[#22c55e] transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Us
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">Order placed successfully!</p>
            </div>
          )}

          <Link href="/" className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
