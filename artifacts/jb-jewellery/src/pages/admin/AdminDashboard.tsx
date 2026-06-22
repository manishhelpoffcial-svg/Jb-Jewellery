import React, { useEffect, useState } from 'react';
import { Package, TrendingUp, Users, ShoppingBag, Loader2, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { formatPrice } from '@/lib/utils';
import { Link } from 'wouter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminApi, type SbDashboard } from '@/lib/adminApi';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: 'text-yellow-700', bg: 'bg-yellow-100' },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-700',   bg: 'bg-blue-100' },
  processing: { label: 'Processing', color: 'text-orange-700', bg: 'bg-orange-100' },
  shipped:    { label: 'Shipped',    color: 'text-purple-700', bg: 'bg-purple-100' },
  delivered:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-100' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-100' },
};

export default function AdminDashboard() {
  const [data, setData] = useState<SbDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setErr(null);
    try {
      setData(await adminApi.dashboard());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const s = data?.stats ?? { total_orders: 0, pending_orders: 0, total_revenue: 0, customer_count: 0, product_count: 0, coupon_count: 0 };
  const chart7d = data?.chart_7d ?? [];
  const statusBreakdown = data?.status_breakdown ?? {};
  const recentOrders = data?.recent_orders ?? [];

  const stats = data
    ? [
        { icon: Package, label: 'Total Orders', value: s.total_orders, sub: `${s.pending_orders} pending`, color: 'bg-yellow-100 text-yellow-700' },
        { icon: TrendingUp, label: 'Total Revenue', value: formatPrice(s.total_revenue), sub: 'All time', color: 'bg-green-100 text-green-700' },
        { icon: Users, label: 'Customers', value: s.customer_count, sub: 'Registered users', color: 'bg-blue-100 text-blue-700' },
        { icon: ShoppingBag, label: 'Products', value: s.product_count, sub: `${s.coupon_count} active coupons`, color: 'bg-purple-100 text-purple-700' },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm">Live overview from Supabase.</p>
          </div>
          <button onClick={reload} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {err}
          </div>
        )}

        {loading && !data ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-sm font-medium">Crunching numbers…</p>
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">{stat.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4">Revenue — Last 7 Days</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chart7d} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(v: number) => [`₹${v}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#FFD700" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4">Order Status Breakdown</h2>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const count = statusBreakdown[key] || 0;
                  const total = s.total_orders || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={key} className="flex items-center gap-3 mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-24 text-center ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Recent Orders</h2>
                <Link href="/admin/orders" className="text-xs text-primary font-semibold hover:underline">View All →</Link>
              </div>
              {recentOrders.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No orders yet.</p>
                  <p className="text-sm">Orders will appear here when customers place them.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentOrders.map((o) => {
                        const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                        return (
                          <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">#{o.id}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-800 text-xs">{o.customer_name}</p>
                              <p className="text-gray-400 text-[10px]">{o.phone}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{Array.isArray(o.items) ? o.items.length : 0}</td>
                            <td className="px-4 py-3 font-bold text-xs">{formatPrice(Number(o.grand_total))}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                              {new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
