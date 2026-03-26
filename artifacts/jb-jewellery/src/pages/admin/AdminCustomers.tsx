import React, { useEffect, useState } from 'react';
import { Users, MessageCircle, Eye, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getAllOrders, Order, openWhatsApp } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';

interface Customer {
  uid: string;
  name: string;
  email: string;
  phone: string;
  orders: Order[];
  totalSpent: number;
  lastOrderDate: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    getAllOrders().then(orders => {
      const map = new Map<string, Customer>();
      orders.forEach(o => {
        if (!map.has(o.userId)) {
          map.set(o.userId, { uid: o.userId, name: o.customerName, email: o.email, phone: o.phone, orders: [], totalSpent: 0, lastOrderDate: o.createdAt });
        }
        const c = map.get(o.userId)!;
        c.orders.push(o);
        c.totalSpent += o.grandTotal;
        if (o.createdAt > c.lastOrderDate) c.lastOrderDate = o.createdAt;
      });
      setCustomers([...map.values()].sort((a, b) => b.orders.length - a.orders.length));
    });
  }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm">{customers.length} total customers</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or phone..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No customers yet.</p>
            <p className="text-sm">Customers will appear here when they place orders.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Customer', 'Phone', 'Orders', 'Total Spent', 'Last Order', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(c => (
                    <tr key={c.uid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 text-xs">{c.name}</p>
                        <p className="text-gray-400 text-[10px]">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{c.phone}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{c.orders.length}</td>
                      <td className="px-4 py-3 font-bold text-xs text-green-700">{formatPrice(c.totalSpent)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(c.lastOrderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelected(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openWhatsApp(`Hi ${c.name}! JB Jewellery here. We hope you loved your jewellery! 💛`)} className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelected(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-black">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-semibold truncate ml-4 max-w-[180px]">{selected.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-semibold">{selected.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Orders</span><span className="font-semibold">{selected.orders.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Spent</span><span className="font-bold text-green-700">{formatPrice(selected.totalSpent)}</span></div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Order History</p>
                <div className="space-y-2">
                  {selected.orders.map(o => (
                    <div key={o.orderId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <span className="font-mono text-xs font-semibold text-gray-700">#{o.orderId}</span>
                      <span className="flex-1 text-xs text-gray-500">{o.items.length} items</span>
                      <span className="text-xs font-bold">{formatPrice(o.grandTotal)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => openWhatsApp(`Hi ${selected.name}! JB Jewellery here. 💛`)} className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#22c55e] transition-all">
                <MessageCircle className="w-4 h-4" /> WhatsApp Customer
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
