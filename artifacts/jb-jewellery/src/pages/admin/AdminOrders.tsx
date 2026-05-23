import React, { useEffect, useRef, useState } from 'react';
import {
  Package, Search, MessageCircle, Download, ChevronDown,
  CheckCircle, XCircle, Truck, Printer, Loader2, Eye, X,
  MapPin, Phone, Mail, ShoppingBag, Tag,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getAllOrders, Order, updateOrderStatus, openWhatsApp } from '@/lib/orders';
import { downloadInvoicePdf, printInvoice, uploadInvoiceToStorage } from '@/lib/invoice';
import { formatPrice } from '@/lib/utils';
import type { CartItem } from '@/context/CartContext';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: 'text-yellow-700', bg: 'bg-yellow-100' },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-700',   bg: 'bg-blue-100'   },
  processing: { label: 'Processing', color: 'text-orange-700', bg: 'bg-orange-100' },
  shipped:    { label: 'Shipped',    color: 'text-purple-700', bg: 'bg-purple-100' },
  delivered:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-100'  },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-100'    },
};
const STATUS_KEYS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

// ── Floating dropdown (fixed-positioned so it escapes overflow:hidden) ────────
interface DropdownPos { top: number; right: number }

function ActionsDropdown({
  order,
  pos,
  uploading,
  onClose,
  onStatus,
  onUpload,
  onWhatsapp,
}: {
  order: Order;
  pos: DropdownPos;
  uploading: string | null;
  onClose: () => void;
  onStatus: (id: string, s: Order['status']) => void;
  onUpload: (o: Order) => void;
  onWhatsapp: (o: Order) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl w-56 py-1.5 text-sm"
        style={{ top: pos.top, right: pos.right }}
      >
        {/* View detail — handled in parent */}
        {order.status === 'pending' && (
          <>
            <button onClick={() => onStatus(order.orderId, 'confirmed')}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-green-700 font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Accept Order
            </button>
            <button onClick={() => onStatus(order.orderId, 'cancelled')}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-red-600 font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Decline Order
            </button>
          </>
        )}
        {order.status === 'confirmed' && (
          <button onClick={() => onStatus(order.orderId, 'processing')}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 font-semibold flex items-center gap-2">
            <Package className="w-4 h-4" /> Mark Processing
          </button>
        )}
        {order.status === 'processing' && (
          <button onClick={() => onStatus(order.orderId, 'shipped')}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 font-semibold flex items-center gap-2">
            <Truck className="w-4 h-4" /> Mark Shipped
          </button>
        )}
        {order.status === 'shipped' && (
          <button onClick={() => onStatus(order.orderId, 'delivered')}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 font-semibold text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Mark Delivered
          </button>
        )}
        <div className="border-t border-gray-100 my-1" />
        <button onClick={() => onUpload(order)} disabled={uploading === order.orderId}
          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 font-semibold text-blue-700 flex items-center gap-2 disabled:opacity-60">
          {uploading === order.orderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {order.invoiceUrl ? 'Re-upload Invoice' : 'Upload Invoice'}
        </button>
        <button onClick={() => onWhatsapp(order)}
          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-green-600 font-semibold flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Customer
        </button>
      </div>
    </>
  );
}

// ── Order detail modal ────────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-black text-lg text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Order #{order.orderId}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Customer</p>
                <p className="font-bold text-gray-900">{order.customerName}</p>
                <p className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> {order.phone}
                </p>
                {order.email && (
                  <p className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> {order.email}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Delivery Address</p>
                <p className="flex items-start gap-1.5 text-sm text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <span>
                    {order.address?.line1}{order.address?.line2 ? `, ${order.address.line2}` : ''}<br />
                    {order.address?.city}{order.address?.state ? `, ${order.address.state}` : ''} — {order.address?.pincode}
                  </span>
                </p>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
                Items Ordered ({order.items.length})
              </p>
              <div className="space-y-2">
                {(order.items as CartItem[]).map((item, i) => (
                  <div key={`${item.id}-${i}`} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                    {/* Product image */}
                    <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] flex items-center justify-center border border-gray-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <span className="text-2xl font-black text-black/10">{item.name.charAt(0)}</span>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                      {(item as CartItem & { quantity?: number }).quantity && (
                        <p className="text-xs text-gray-500 mt-1">Qty: <span className="font-bold">{(item as CartItem & { quantity?: number }).quantity}</span></p>
                      )}
                    </div>
                    {/* Price */}
                    <div className="text-right shrink-0">
                      <p className="font-black text-gray-900 text-sm">{formatPrice(item.price)}</p>
                      {item.originalPrice > item.price && (
                        <p className="text-xs text-gray-400 line-through">{formatPrice(item.originalPrice)}</p>
                      )}
                      {item.discount > 0 && (
                        <span className="text-[10px] font-bold text-green-600">{item.discount}% off</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Price Breakdown</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{order.shipping === 0 ? <span className="text-green-600 font-semibold">Free</span> : formatPrice(order.shipping)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (GST)</span>
                    <span>{formatPrice(order.tax)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {order.couponCode || 'Discount'}</span>
                    <span>−{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-black text-gray-900 text-base">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatPrice(order.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button onClick={() => printInvoice(order)} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
            <button onClick={() => downloadInvoicePdf(order)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors text-sm">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<DropdownPos>({ top: 0, right: 0 });
  const [uploading, setUploading] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  const reload = async () => {
    setLoading(true);
    try { setOrders(await getAllOrders()); } finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const filtered = orders.filter((o) => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || o.orderId.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.phone.includes(q);
    return matchesFilter && matchesSearch;
  });

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, orderId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rightGap = window.innerWidth - rect.right;
    setMenuPos({ top: rect.bottom + 6, right: rightGap });
    setActionMenu(orderId);
  };

  const updateStatus = async (orderId: string, status: Order['status']) => {
    await updateOrderStatus(orderId, status);
    reload();
    setActionMenu(null);
  };

  const handleUploadInvoice = async (o: Order) => {
    setUploading(o.orderId);
    try {
      const url = await uploadInvoiceToStorage(o);
      if (url) setOrders((prev) => prev.map((x) => (x.orderId === o.orderId ? { ...x, invoiceUrl: url } : x)));
    } finally {
      setUploading(null);
      setActionMenu(null);
    }
  };

  const handleWhatsapp = (o: Order) => {
    openWhatsApp(`Hi ${o.customerName}! Regarding your JB Jewellery order #${o.orderId} — Status: ${o.status}. Let us know if you need anything! 💛`);
    setActionMenu(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">{orders.length} total · synced with Supabase</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {STATUS_KEYS.map((key) => {
              const cfg = key === 'all' ? null : STATUS_CONFIG[key];
              const count = key === 'all' ? orders.length : orders.filter((o) => o.status === key).length;
              return (
                <button key={key} onClick={() => setFilter(key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === key ? 'bg-black text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {key === 'all' ? 'All' : (cfg?.label || key)} ({count})
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID or Customer name…"
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center gap-3 text-gray-500">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading orders…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No orders found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Invoice', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((o) => {
                    const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={o.orderId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">#{o.orderId}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800 text-xs">{o.customerName}</p>
                          <p className="text-gray-400 text-[10px]">{o.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                        <td className="px-4 py-3 font-bold text-xs">{formatPrice(o.grandTotal)}</td>
                        <td className="px-4 py-3">
                          {o.invoiceUrl ? (
                            <a href={o.invoiceUrl} target="_blank" rel="noreferrer"
                              className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full hover:bg-green-200">
                              ✓ Stored
                            </a>
                          ) : (
                            <span className="text-[10px] text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {/* View order detail */}
                            <button onClick={() => setViewOrder(o)} title="View order details"
                              className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-gray-400 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* Print */}
                            <button onClick={() => printInvoice(o)} title="Print invoice"
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors">
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {/* Download */}
                            <button onClick={() => downloadInvoicePdf(o)} title="Download PDF"
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {/* Actions dropdown — fixed-positioned so it escapes table overflow */}
                            <button onClick={(e) => openMenu(e, o.orderId)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-xs font-semibold transition-colors whitespace-nowrap">
                              Actions <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Fixed dropdown — rendered outside table so never clipped */}
      {actionMenu && (() => {
        const order = orders.find((o) => o.orderId === actionMenu);
        if (!order) return null;
        return (
          <ActionsDropdown
            order={order}
            pos={menuPos}
            uploading={uploading}
            onClose={() => setActionMenu(null)}
            onStatus={updateStatus}
            onUpload={handleUploadInvoice}
            onWhatsapp={handleWhatsapp}
          />
        );
      })()}

      {/* Order detail modal */}
      {viewOrder && <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />}
    </AdminLayout>
  );
}
