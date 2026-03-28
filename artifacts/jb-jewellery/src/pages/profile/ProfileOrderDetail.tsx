import React, { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { ArrowLeft, Download, MessageCircle, Mail, CheckCircle, Clock, Package, Truck, XCircle, Phone } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { getAllOrders, Order, openWhatsApp } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import jsPDF from 'jspdf';

const TIMELINE = [
  { status: 'pending', icon: CheckCircle, label: 'Order Placed' },
  { status: 'confirmed', icon: CheckCircle, label: 'Order Confirmed' },
  { status: 'processing', icon: Package, label: 'Processing' },
  { status: 'shipped', icon: Truck, label: 'Shipped' },
  { status: 'delivered', icon: CheckCircle, label: 'Delivered' },
];

const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function ProfileOrderDetail() {
  const { user } = useAuth();
  const [, params] = useRoute('/profile/orders/:id');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    getAllOrders().then(all => {
      const found = all.find(o => o.orderId === params.id);
      setOrder(found || null);
    });
  }, [params?.id]);

  const downloadInvoice = () => {
    if (!order) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('JB JEWELLERY COLLECTION', 20, 25);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice — Order #${order.orderId}`, 20, 35);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 20, 42);
    doc.text(`Customer: ${order.customerName}  |  Phone: ${order.phone}`, 20, 52);
    doc.line(20, 58, 190, 58);
    let y = 68;
    order.items.forEach(item => {
      doc.text(`${item.name} × ${item.quantity}`, 20, y);
      doc.text(`₹${item.price * item.quantity}`, 175, y, { align: 'right' });
      y += 8;
    });
    doc.line(20, y, 190, y); y += 8;
    doc.text(`Grand Total`, 20, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${order.grandTotal}`, 175, y, { align: 'right' });
    doc.save(`JB-Invoice-${order.orderId}.pdf`);
  };

  if (!order) return (
    <ProfileLayout>
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
        <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="font-bold text-gray-600">Order not found</p>
        <Link href="/profile/orders" className="inline-block mt-4 text-sm text-primary font-bold">← Back to Orders</Link>
      </div>
    </ProfileLayout>
  );

  const currentIdx = order.status === 'cancelled' ? -1 : STATUS_ORDER.indexOf(order.status);
  const addr = order.address;

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/profile/orders" className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900">Order #{order.orderId}</h1>
            <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</p>
          </div>
          <button onClick={downloadInvoice} className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-xl text-sm hover:bg-yellow-400 transition-all">
            <Download className="w-4 h-4" /> Invoice
          </button>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">Order Status</h3>
          {order.status === 'cancelled' ? (
            <div className="flex items-center gap-3 text-red-600">
              <XCircle className="w-8 h-8" />
              <div><p className="font-bold">Order Cancelled</p><p className="text-xs text-gray-400">This order was cancelled</p></div>
            </div>
          ) : (
            <div className="flex items-center gap-0">
              {TIMELINE.map(({ status, icon: Icon, label }, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <React.Fragment key={status}>
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'} ${active ? 'ring-4 ring-green-100' : ''}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className={`text-[10px] font-semibold text-center leading-tight ${done ? 'text-gray-800' : 'text-gray-300'}`}>{label}</p>
                    </div>
                    {i < TIMELINE.length - 1 && (
                      <div className={`h-0.5 flex-1 -mt-5 ${i < currentIdx ? 'bg-green-400' : 'bg-gray-100'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Items Ordered</h3>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-lg font-black text-black/20 flex-shrink-0">
                  {item.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                </div>
                <p className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span><span>−{formatPrice(order.discount)}</span></div>}
            <div className="flex justify-between text-sm text-gray-600"><span>Shipping</span><span className={order.shipping === 0 ? 'text-green-600 font-semibold' : ''}>{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span></div>
            <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
              <span>Grand Total</span><span>{formatPrice(order.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Delivery Address</h3>
          <p className="text-sm font-semibold text-gray-800">{addr.fullName}</p>
          <p className="text-sm text-gray-600 mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
          <p className="text-sm text-gray-600">{addr.city}, {addr.state} – {addr.pincode}</p>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {addr.phone}</p>
        </div>

        {/* Help */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Need Help?</h3>
          <div className="flex gap-3">
            <button onClick={() => openWhatsApp(`Hi! I need help with my order #${order.orderId}`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white font-bold rounded-xl text-sm hover:bg-[#22c55e] transition-all">
              <MessageCircle className="w-4 h-4" /> WhatsApp Us
            </button>
            <a href="mailto:manish@grafxcore.in"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-200 transition-all">
              <Mail className="w-4 h-4" /> Email Us
            </a>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}
