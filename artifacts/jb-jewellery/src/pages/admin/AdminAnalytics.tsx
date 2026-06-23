import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi, SbOrder } from "@/lib/adminApi";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, Package, Users, ShoppingBag, Loader2 } from "lucide-react";

const COLORS = ["#FFD700", "#111111", "#6366f1", "#10b981", "#f59e0b"];

function formatPrice(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
}

interface Stats {
  total_orders: number;
  total_revenue: number;
  customer_count: number;
  product_count: number;
  pending_orders: number;
  coupon_count: number;
}

interface Chart7d {
  label: string;
  date: string;
  orders: number;
  revenue: number;
}

interface StatusBreakdown {
  [key: string]: number;
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [chart7d, setChart7d] = useState<Chart7d[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown>({});

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const data = await adminApi.dashboard();
        setStats(data?.stats ?? null);
        setChart7d(data?.chart_7d ?? []);
        setStatusBreakdown(data?.status_breakdown ?? {});
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusPieData = Object.entries(statusBreakdown).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  const summaryCards = stats
    ? [
        { icon: Package, label: "Total Orders", value: stats.total_orders, color: "bg-yellow-100 text-yellow-700" },
        { icon: TrendingUp, label: "Total Revenue", value: formatPrice(stats.total_revenue), color: "bg-green-100 text-green-700" },
        { icon: Users, label: "Customers", value: stats.customer_count, color: "bg-blue-100 text-blue-700" },
        { icon: ShoppingBag, label: "Products", value: stats.product_count, color: "bg-purple-100 text-purple-700" },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Sales and order trends overview</p>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {err}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading analytics…</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{card.value}</p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Revenue — Last 7 Days</h2>
              {chart7d.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chart7d}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(v: number) => [`₹${v}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={2.5} dot={{ r: 4, fill: "#FFD700" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4">Orders — Last 7 Days</h2>
                {chart7d.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chart7d} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#111" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4">Order Status Distribution</h2>
                {statusPieData.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {statusPieData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
