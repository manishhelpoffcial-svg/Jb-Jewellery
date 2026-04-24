import React, { useEffect, useState } from 'react';
import { Package, ArrowLeft, Download, MessageCircle, ChevronDown, ChevronUp, Printer, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { getMyOrders, Order, openWhatsApp } from '@/lib/orders';
import { downloadInvoicePdf, printInvoice } from '@/lib/invoice';
import { formatPrice } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; step: number }> = {
  pending:    { label: 'Order Placed',  color: 'text-yellow-700', bg: 'bg-yellow-100', step: 1 },
  confirmed:  { label: 'Confirmed',     color: 'text-blue-700',   bg: 'bg-blue-100',   step: 2 },
  processing: { label: 'Processing',    color: 'text-orange-700', bg: 'bg-orange-100', step: 3 },
  shipped:    { label: 'Shipped',       color: 'text-purple-700', bg: 'bg-purple-100', step: 4 },
  delivered:  { label: 'Delivered',     color: 'text-green-700',  bg: 'bg-green-100',  step: 5 },
  cancelled:  { label: 'Cancelled',     color: 'text-red-700',    bg: 'bg-red-100',    step: 0 },
};

const TIMELINE_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getMyOrders(user.uid)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user]);

  const openStoredOrDownload = (order: Order) => {
    if (order.invoiceUrl) window.open(order.invoiceUrl, '_blank');
    else downloadInvoicePdf(order);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
        <Package className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500 font-medium">Please login to view your orders.</p>
        <Link href="/" className="px-6 py-3 bg-primary text-black font-bold rounded-full hover:bg-yellow-400 transition-all">Go to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black">My Orders</h1>
            <p className="text-xs text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading your orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-2">No orders yet!</p>
            <p className="text-gray-400 text-sm mb-6">Start shopping and your orders will appear here.</p>
            <Link href="/" className="px-6 py-3 bg-primary text-black font-bold rounded-full hover:bg-yellow-400 transition-all">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isExpanded = expanded === order.orderId;
              return (
                <div key={order.orderId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-black text-sm font-mono">#{order.orderId}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-sm font-bold mt-1">{formatPrice(order.grandTotal)}</p>
                      <p className="text-xs text-gray-500">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={() => setExpanded(isExpanded ? null : order.orderId)} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {order.status !== 'cancelled' && (
                    <div className="px-5 pb-4">
                      <div className="flex items-center gap-0">
                        {TIMELINE_STEPS.map((step, i) => {
                          const current = STATUS_CONFIG[order.status]?.step || 1;
                          const done = i < current;
                          const active = i === current - 1;
                          return (
                            <React.Fragment key={step}>
                              <div className="flex flex-col items-center">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${done ? 'bg-green-500 border-green-500' : active ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}>
                                  {done && <span className="text-white text-[8px]">✓</span>}
                                </div>
                                <span className="text-[8px] text-gray-500 mt-1 whitespace-nowrap hidden sm:block">{STATUS_CONFIG[step]?.label}</span>
                              </div>
                              {i < TIMELINE_STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 transition-all ${i < current - 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Items Ordered</p>
                        <div className="space-y-2">
                          {order.items.map(item => (
                            <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] rounded-lg flex items-center justify-center shrink-0 text-sm font-black text-black/20">{item.name.charAt(0)}</div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold">{item.name}</p>
                                <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                              </div>
                              <span className="text-xs font-bold">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
                        <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                        <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span></div>
                        <div className="flex justify-between text-gray-500"><span>Tax</span><span>{formatPrice(order.tax)}</span></div>
                        {order.discount > 0 && <div className="flex justify-between text-green-600 font-semibold"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
                        <div className="flex justify-between font-black text-base border-t border-gray-200 pt-2 mt-2"><span>Total</span><span>{formatPrice(order.grandTotal)}</span></div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Delivery Address</p>
                        <p className="text-sm text-gray-700">{order.address.fullName}</p>
                        <p className="text-xs text-gray-500">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</p>
                        <p className="text-xs text-gray-500">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => openStoredOrDownload(order)} className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold hover:border-primary hover:bg-primary/5 transition-all">
                          <Download className="w-3.5 h-3.5" /> Invoice
                        </button>
                        <button onClick={() => printInvoice(order)} className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold hover:border-primary hover:bg-primary/5 transition-all">
                          <Printer className="w-3.5 h-3.5" /> Print
                        </button>
                        <button onClick={() => openWhatsApp(`Hi! I need help with my JB Jewellery order #${order.orderId}.`)} className="flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-semibold hover:bg-[#22c55e] transition-all">
                          <MessageCircle className="w-3.5 h-3.5" /> Help
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
