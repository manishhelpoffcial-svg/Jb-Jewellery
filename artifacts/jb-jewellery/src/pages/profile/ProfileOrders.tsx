import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Package, Search, Download, Eye, RotateCcw, X as XIcon } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { getAllOrders, Order, updateOrderStatus } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import jsPDF from 'jspdf';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: 'Pending',    color: 'text-yellow-700', bg: 'bg-yellow-50',  dot: 'bg-yellow-400' },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-700',   bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  processing: { label: 'Processing', color: 'text-orange-700', bg: 'bg-orange-50',  dot: 'bg-orange-500' },
  shipped:    { label: 'Shipped',    color: 'text-purple-700', bg: 'bg-purple-50',  dot: 'bg-purple-500' },
  delivered:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-50',   dot: 'bg-green-500' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-50',     dot: 'bg-red-500' },
};

type Filter = 'all' | 'month' | '3months';

export default function ProfileOrders() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) getAllOrders().then(all => setOrders(all.filter(o => o.userId === user.uid || !o.userId)));
  }, [user]);

  const now = Date.now();
  const filtered = orders.filter(o => {
    const date = new Date(o.createdAt).getTime();
    const matchDate =
      filter === 'all' ? true :
      filter === 'month' ? (now - date) < 30 * 86400000 :
      (now - date) < 90 * 86400000;
    const q = search.toLowerCase();
    const matchSearch = !q || o.orderId.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
    return matchDate && matchSearch;
  });

  const downloadInvoice = (o: Order) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('JB JEWELLERY COLLECTION', 20, 25);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice — Order #${o.orderId}`, 20, 35);
    doc.text(`Date: ${new Date(o.createdAt).toLocaleDateString('en-IN')}`, 20, 42);
    doc.text(`Customer: ${o.customerName}`, 20, 52);
    doc.text(`Phone: ${o.phone}`, 20, 59);
    doc.text(`Email: ${o.email}`, 20, 66);
    doc.line(20, 72, 190, 72);
    doc.setFont('helvetica', 'bold');
    doc.text('Items', 20, 80);
    let y = 88;
    o.items.forEach(item => {
      doc.setFont('helvetica', 'normal');
      doc.text(`${item.name} × ${item.quantity}`, 20, y);
      doc.text(`₹${item.price * item.quantity}`, 160, y, { align: 'right' });
      y += 8;
    });
    doc.line(20, y, 190, y); y += 8;
    doc.text(`Subtotal`, 20, y); doc.text(`₹${o.subtotal}`, 160, y, { align: 'right' }); y += 7;
    if (o.discount > 0) { doc.text(`Discount`, 20, y); doc.text(`-₹${o.discount}`, 160, y, { align: 'right' }); y += 7; }
    doc.text(`Shipping`, 20, y); doc.text(o.shipping === 0 ? 'FREE' : `₹${o.shipping}`, 160, y, { align: 'right' }); y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total`, 20, y); doc.text(`₹${o.grandTotal}`, 160, y, { align: 'right' });
    doc.save(`JB-Invoice-${o.orderId}.pdf`);
  };

  const handleReorder = (o: Order) => {
    o.items.forEach(item => addToCart(item));
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return;
    await updateOrderStatus(orderId, 'cancelled');
    setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: 'cancelled' } : o));
    setCancellingId(null);
  };

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black text-gray-900">My Orders</h1>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {([['all', 'All Orders'], ['month', 'This Month'], ['3months', 'Last 3 Months']] as [Filter, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === key ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Order ID..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="w-14 h-14 mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-600">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">Your orders will appear here once you place them.</p>
            <Link href="/products" className="inline-block mt-5 px-6 py-2.5 bg-primary text-black font-bold rounded-xl text-sm hover:bg-yellow-400 transition-all">Shop Now</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(o => {
              const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
              return (
                <div key={o.orderId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-sm font-bold text-gray-800">#{o.orderId}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        {' · '}{o.items.length} item{o.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <p className="text-lg font-black text-gray-900">{formatPrice(o.grandTotal)}</p>
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/orders/${o.orderId}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all">
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                      <button onClick={() => downloadInvoice(o)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all">
                        <Download className="w-3.5 h-3.5" /> Invoice
                      </button>
                      <button onClick={() => handleReorder(o)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-yellow-700 rounded-xl text-xs font-semibold transition-all">
                        <RotateCcw className="w-3.5 h-3.5" /> Reorder
                      </button>
                      {o.status === 'pending' && (
                        <button onClick={() => handleCancel(o.orderId)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-all">
                          <XIcon className="w-3.5 h-3.5" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}
