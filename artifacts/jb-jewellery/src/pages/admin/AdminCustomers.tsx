import React, { useEffect, useState } from 'react';
import { Users, MessageCircle, Eye, Search, Download, UserCheck, UserX, Mail, X, Send, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api, type ApiAdminCustomer, type ApiOrder, type ApiAddress, type ApiReview } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { openWhatsApp } from '@/lib/orders';

type SortField = 'name' | 'orders' | 'spent' | 'joined';

interface CustomerDetail {
  customer: ApiAdminCustomer;
  orders: ApiOrder[];
  reviews: ApiReview[];
  addresses: ApiAddress[];
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<ApiAdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('orders');
  const [sortAsc, setSortAsc] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [emailTarget, setEmailTarget] = useState<ApiAdminCustomer | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = () => {
    api.adminCustomers.list()
      .then(({ customers: c }) => setCustomers(c))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(a => !a);
    else { setSortField(field); setSortAsc(false); }
  };

  const filtered = customers
    .filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone || '').includes(q);
      const matchStatus = filterStatus === 'all' ? true : filterStatus === 'active' ? c.is_active : !c.is_active;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortField === 'name') diff = a.name.localeCompare(b.name);
      else if (sortField === 'orders') diff = parseInt(a.order_count) - parseInt(b.order_count);
      else if (sortField === 'spent') diff = parseFloat(a.total_spent) - parseFloat(b.total_spent);
      else if (sortField === 'joined') diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortAsc ? diff : -diff;
    });

  const handleViewDetail = async (c: ApiAdminCustomer) => {
    setLoadingDetail(true);
    try {
      const data = await api.adminCustomers.detail(c.id);
      setDetail(data as CustomerDetail);
    } catch {
      showMsg('Failed to load customer details', false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleStatus = async (c: ApiAdminCustomer) => {
    const action = c.is_active ? 'suspend' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} account for ${c.name}?`)) return;
    try {
      await api.adminCustomers.setStatus(c.id, !c.is_active);
      showMsg(`Account ${action}d and notification sent.`);
      load();
      if (detail && detail.customer.id === c.id) setDetail(null);
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : `Failed to ${action}`, false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailTarget || !emailSubject.trim() || !emailBody.trim()) return;
    setSending(true);
    try {
      await api.adminCustomers.sendEmail(emailTarget.id, emailSubject, emailBody);
      showMsg('Email sent successfully!');
      setEmailTarget(null);
      setEmailSubject('');
      setEmailBody('');
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to send email', false);
    } finally {
      setSending(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-gray-300" />;
    return sortAsc ? <ChevronUp className="w-3 h-3 text-gray-600" /> : <ChevronDown className="w-3 h-3 text-gray-600" />;
  };

  const ThButton = ({ field, label }: { field: SortField; label: string }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-black transition-colors">
      {label} <SortIcon field={field} />
    </button>
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Customers</h1>
            <p className="text-gray-500 text-sm">{customers.length} registered customers</p>
          </div>
          <a href={api.adminCustomers.exportCsv()} download="customers.csv"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </a>
        </div>

        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or phone..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
          </div>
          <div className="flex gap-2">
            {([['all', 'All'], ['active', 'Active'], ['suspended', 'Suspended']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setFilterStatus(key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === key ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No customers found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <ThButton field="name" label="Customer" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <ThButton field="orders" label="Orders" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <ThButton field="spent" label="Spent" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <ThButton field="joined" label="Joined" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 text-xs">{c.name}</p>
                        <p className="text-gray-400 text-[10px]">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{c.phone}</td>
                      <td className="px-4 py-3 text-xs font-bold text-center">{c.order_count}</td>
                      <td className="px-4 py-3 font-bold text-xs text-green-700">{formatPrice(parseFloat(c.total_spent))}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.is_active !== false ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {c.is_active !== false ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleViewDetail(c)} title="View Details" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openWhatsApp(`Hi ${c.name}! JB Jewellery here. 💛`)} title="WhatsApp" className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setEmailTarget(c); setEmailSubject(''); setEmailBody(''); }} title="Send Email" className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleToggleStatus(c)} title={c.is_active !== false ? 'Suspend' : 'Activate'}
                            className={`p-1.5 rounded-lg transition-colors ${c.is_active !== false ? 'hover:bg-red-50 text-gray-400 hover:text-red-600' : 'hover:bg-green-50 text-gray-400 hover:text-green-600'}`}>
                            {c.is_active !== false ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
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
      {(detail || loadingDetail) && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => !loadingDetail && setDetail(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {loadingDetail ? (
              <div className="p-12 text-center text-gray-400">Loading...</div>
            ) : detail && (
              <>
                <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
                  <div>
                    <h2 className="font-black text-lg">{detail.customer.name}</h2>
                    <p className="text-xs text-gray-400">{detail.customer.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${detail.customer.is_active !== false ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {detail.customer.is_active !== false ? 'Active' : 'Suspended'}
                    </span>
                    <button onClick={() => setDetail(null)} className="p-2 hover:bg-gray-100 rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  {/* Info */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Phone', detail.customer.phone || '—'],
                      ['Joined', detail.customer.created_at ? new Date(detail.customer.created_at).toLocaleDateString('en-IN') : '—'],
                      ['Total Orders', detail.orders.length],
                      ['Total Spent', formatPrice(detail.orders.reduce((s, o) => s + o.grand_total, 0))],
                    ].map(([label, value]) => (
                      <div key={label as string} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">{label}</p>
                        <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => openWhatsApp(`Hi ${detail.customer.name}! 💛`)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#22c55e] transition-all text-xs">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                    <button onClick={() => { setEmailTarget(detail.customer); setDetail(null); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-xs">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                    <button onClick={() => handleToggleStatus(detail.customer)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-bold rounded-xl transition-all text-xs ${detail.customer.is_active !== false ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                      {detail.customer.is_active !== false ? <><UserX className="w-3.5 h-3.5" /> Suspend</> : <><UserCheck className="w-3.5 h-3.5" /> Activate</>}
                    </button>
                  </div>

                  {/* Orders */}
                  {detail.orders.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Orders ({detail.orders.length})</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {detail.orders.map(o => (
                          <div key={o.id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                            <span className="font-mono text-xs font-semibold text-gray-600 truncate">#{o.id?.slice(0, 10)}</span>
                            <span className="text-xs text-gray-500 flex-1">{(o.items as { name: string }[]).length} items</span>
                            <span className="text-xs font-bold">{formatPrice(o.grand_total)}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reviews */}
                  {detail.reviews.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Reviews ({detail.reviews.length})</p>
                      <div className="space-y-2">
                        {detail.reviews.map(r => (
                          <div key={r.id} className="bg-gray-50 rounded-xl p-2.5 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700 truncate flex-1">{r.product_name}</span>
                              <span className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </span>
                            </div>
                            {r.review_text && <p className="text-gray-500 mt-0.5 italic">"{r.review_text}"</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Email Modal */}
      {emailTarget && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setEmailTarget(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black">Email to {emailTarget.name}</h2>
              <button onClick={() => setEmailTarget(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Subject *</label>
                <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Email subject..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Message *</label>
                <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={6} placeholder="Type your message..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEmailTarget(null)} className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleSendEmail} disabled={sending || !emailSubject.trim() || !emailBody.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-70">
                  <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
