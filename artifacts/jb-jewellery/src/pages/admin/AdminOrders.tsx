import React, { useEffect, useState } from 'react';
import { Package, Search, MessageCircle, Download, ChevronDown, Eye } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getAllOrders, Order, updateOrderStatus, openWhatsApp } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';
import { Link } from 'wouter';
import jsPDF from 'jspdf';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: 'text-yellow-700', bg: 'bg-yellow-100' },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-700',   bg: 'bg-blue-100' },
  processing: { label: 'Processing', color: 'text-orange-700', bg: 'bg-orange-100' },
  shipped:    { label: 'Shipped',    color: 'text-purple-700', bg: 'bg-purple-100' },
  delivered:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-100' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-100' },
};

const STATUS_KEYS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const reload = () => getAllOrders().then(setOrders);

  useEffect(() => { reload(); }, []);

  const filtered = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || o.orderId.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.phone.includes(q);
    return matchesFilter && matchesSearch;
  });

  const updateStatus = async (orderId: string, status: Order['status']) => {
    await updateOrderStatus(orderId, status);
    reload();
    setActionMenu(null);
  };

  const whatsappCustomer = (o: Order, msg: string) => {
    openWhatsApp(msg);
    setActionMenu(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Orders</h1>
            <p className="text-gray-500 text-sm">{orders.length} total orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {STATUS_KEYS.map(key => {
              const cfg = key === 'all' ? null : STATUS_CONFIG[key];
              const count = key === 'all' ? orders.length : orders.filter(o => o.status === key).length;
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Order ID or Customer name..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No orders found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(o => {
                    const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={o.orderId} className="hover:bg-gray-50 transition-colors relative">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">#{o.orderId}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800 text-xs">{o.customerName}</p>
                          <p className="text-gray-400 text-[10px]">{o.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{o.items.length}</td>
                        <td className="px-4 py-3 font-bold text-xs">{formatPrice(o.grandTotal)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        </td>
                        <td className="px-4 py-3 relative">
                          <div className="flex items-center gap-1">
                            <Link href={`/admin/orders/${o.orderId}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <div className="relative">
                              <button onClick={() => setActionMenu(actionMenu === o.orderId ? null : o.orderId)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black transition-colors flex items-center gap-1 text-xs font-medium">
                                Actions <ChevronDown className="w-3 h-3" />
                              </button>
                              {actionMenu === o.orderId && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 w-44 py-1 text-xs">
                                  {o.status === 'pending' && <>
                                    <button onClick={() => updateStatus(o.orderId, 'confirmed')} className="w-full px-3 py-2 text-left hover:bg-gray-50 text-green-700 font-semibold">✅ Accept Order</button>
                                    <button onClick={() => updateStatus(o.orderId, 'cancelled')} className="w-full px-3 py-2 text-left hover:bg-gray-50 text-red-600 font-semibold">❌ Decline Order</button>
                                  </>}
                                  {o.status === 'confirmed' && <button onClick={() => updateStatus(o.orderId, 'processing')} className="w-full px-3 py-2 text-left hover:bg-gray-50 font-semibold">📦 Mark Processing</button>}
                                  {o.status === 'processing' && <button onClick={() => updateStatus(o.orderId, 'shipped')} className="w-full px-3 py-2 text-left hover:bg-gray-50 font-semibold">🚚 Mark Shipped</button>}
                                  {o.status === 'shipped' && <button onClick={() => updateStatus(o.orderId, 'delivered')} className="w-full px-3 py-2 text-left hover:bg-gray-50 font-semibold text-green-700">✅ Mark Delivered</button>}
                                  <div className="border-t border-gray-100 my-1" />
                                  <button onClick={() => whatsappCustomer(o, `Hi ${o.customerName}! Regarding your JB Jewellery order #${o.orderId} — Status: ${o.status}. Let us know if you have any questions! 💛`)} className="w-full px-3 py-2 text-left hover:bg-gray-50 text-green-600 font-semibold flex items-center gap-2">
                                    <MessageCircle className="w-3 h-3" /> WhatsApp
                                  </button>
                                </div>
                              )}
                            </div>
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

      {/* Click outside to close action menu */}
      {actionMenu && <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />}
    </AdminLayout>
  );
}
