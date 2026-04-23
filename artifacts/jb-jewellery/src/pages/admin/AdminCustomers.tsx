import { useEffect, useState } from 'react';
import {
  Users, Search, Trash2, KeyRound, LogIn, UserPlus, X, MapPin,
  Mail, Phone, Calendar, Loader2, Copy, ChevronDown, ChevronUp,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminApi, type SbCustomer, type SbAddress } from '@/lib/adminApi';

type SortField = 'name' | 'joined' | 'addresses';

interface CreateForm {
  email: string;
  password: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const blankCreate: CreateForm = {
  email: '', password: '', name: '', phone: '',
  line1: '', line2: '', city: '', state: '', pincode: '',
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<SbCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('joined');
  const [sortAsc, setSortAsc] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(blankCreate);
  const [creating, setCreating] = useState(false);

  const [detail, setDetail] = useState<SbCustomer | null>(null);
  const [addresses, setAddresses] = useState<SbAddress[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [pwTarget, setPwTarget] = useState<SbCustomer | null>(null);
  const [pwValue, setPwValue] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const [linkInfo, setLinkInfo] = useState<{ email: string; link: string } | null>(null);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const load = () => {
    setLoading(true);
    adminApi.listCustomers()
      .then(({ customers: c }) => setCustomers(c))
      .catch(err => { showMsg(err.message || 'Failed to load customers', false); setCustomers([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(a => !a);
    else { setSortField(field); setSortAsc(false); }
  };

  const filtered = customers
    .filter(c => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return c.name.toLowerCase().includes(q)
        || c.email.toLowerCase().includes(q)
        || (c.phone || '').includes(q);
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortField === 'name') diff = a.name.localeCompare(b.name);
      else if (sortField === 'addresses') diff = a.address_count - b.address_count;
      else diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortAsc ? diff : -diff;
    });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password) return;
    setCreating(true);
    try {
      await adminApi.createCustomer({
        email: createForm.email,
        password: createForm.password,
        name: createForm.name,
        phone: createForm.phone,
        address: (createForm.line1 && createForm.city && createForm.pincode)
          ? {
              line1: createForm.line1,
              line2: createForm.line2,
              city: createForm.city,
              state: createForm.state,
              pincode: createForm.pincode,
            }
          : undefined,
      });
      showMsg('Account created.');
      setCreateForm(blankCreate);
      setShowCreate(false);
      load();
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to create account', false);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (c: SbCustomer) => {
    if (!confirm(`Permanently delete ${c.email}?\nThis removes the account, profile and addresses.`)) return;
    try {
      await adminApi.deleteCustomer(c.id);
      showMsg('Customer deleted.');
      if (detail?.id === c.id) setDetail(null);
      load();
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to delete', false);
    }
  };

  const handleSetPassword = async () => {
    if (!pwTarget || pwValue.length < 6) return;
    setSavingPw(true);
    try {
      await adminApi.setPassword(pwTarget.id, pwValue);
      showMsg(`Password updated for ${pwTarget.email}.`);
      setPwTarget(null);
      setPwValue('');
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to update password', false);
    } finally {
      setSavingPw(false);
    }
  };

  const handleLoginAs = async (c: SbCustomer) => {
    setGeneratingLink(c.id);
    try {
      const r = await adminApi.loginLink(c.id);
      setLinkInfo({ email: r.email, link: r.action_link });
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to generate login link', false);
    } finally {
      setGeneratingLink(null);
    }
  };

  const handleViewDetail = async (c: SbCustomer) => {
    setDetail(c);
    setLoadingDetail(true);
    setAddresses([]);
    try {
      const r = await adminApi.getCustomer(c.id);
      setAddresses(r.addresses);
    } catch {
      showMsg('Failed to load details', false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField !== field
      ? <ChevronDown className="w-3 h-3 text-gray-300" />
      : sortAsc ? <ChevronUp className="w-3 h-3 text-gray-700" /> : <ChevronDown className="w-3 h-3 text-gray-700" />;

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
            <p className="text-gray-500 text-sm">{customers.length} Supabase auth accounts</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-primary font-bold rounded-xl hover:bg-gray-900 transition-all text-sm">
            <UserPlus className="w-4 h-4" /> Create Account
          </button>
        </div>

        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or phone..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <ThButton field="addresses" label="Addresses" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <ThButton field="joined" label="Joined" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 text-xs">{c.name}</p>
                        <p className="text-gray-400 text-[10px]">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{c.phone || '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        <button onClick={() => handleViewDetail(c)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-full font-semibold">
                          <MapPin className="w-3 h-3" /> {c.address_count}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.email_confirmed_at ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {c.email_confirmed_at ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => handleLoginAs(c)} disabled={generatingLink === c.id}
                            title="Generate login link" className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-50">
                            {generatingLink === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => { setPwTarget(c); setPwValue(''); }} title="Change password"
                            className="p-1.5 hover:bg-amber-50 rounded-lg text-gray-400 hover:text-amber-600">
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(c)} title="Delete account"
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* CREATE MODAL */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => !creating && setShowCreate(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-black text-lg flex items-center gap-2"><UserPlus className="w-5 h-5" /> New Customer</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-3">
              <input type="email" required value={createForm.email}
                onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                placeholder="Email *" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
              <input type="text" required minLength={6} value={createForm.password}
                onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Password (min 6 chars) *" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
              <input type="text" value={createForm.name}
                onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Full name" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
              <input type="tel" value={createForm.phone}
                onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="Phone" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />

              <div className="pt-2 mt-1 border-t border-gray-100">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Address (optional)</p>
                <div className="space-y-2.5">
                  <input type="text" value={createForm.line1}
                    onChange={e => setCreateForm(p => ({ ...p, line1: e.target.value }))}
                    placeholder="Address line 1" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                  <input type="text" value={createForm.line2}
                    onChange={e => setCreateForm(p => ({ ...p, line2: e.target.value }))}
                    placeholder="Address line 2" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <input type="text" value={createForm.city}
                      onChange={e => setCreateForm(p => ({ ...p, city: e.target.value }))}
                      placeholder="City" className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                    <input type="text" value={createForm.state}
                      onChange={e => setCreateForm(p => ({ ...p, state: e.target.value }))}
                      placeholder="State" className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <input type="text" value={createForm.pincode}
                    onChange={e => setCreateForm(p => ({ ...p, pincode: e.target.value }))}
                    placeholder="Pincode" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-3 bg-black text-primary font-bold rounded-xl hover:bg-gray-900 flex items-center justify-center gap-2 disabled:opacity-70">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {pwTarget && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => !savingPw && setPwTarget(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-base flex items-center gap-2"><KeyRound className="w-4 h-4" /> Change Password</h2>
              <button onClick={() => setPwTarget(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-3">For <strong>{pwTarget.email}</strong></p>
            <input type="text" value={pwValue} onChange={e => setPwValue(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setPwTarget(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 text-sm">Cancel</button>
              <button onClick={handleSetPassword} disabled={savingPw || pwValue.length < 6}
                className="flex-1 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </>
      )}

      {/* LOGIN LINK MODAL */}
      {linkInfo && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setLinkInfo(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-base flex items-center gap-2"><LogIn className="w-4 h-4 text-blue-600" /> Login Link Ready</h2>
              <button onClick={() => setLinkInfo(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              One-tap login link for <strong>{linkInfo.email}</strong>. Opening it logs you in as that user
              <span className="text-amber-600"> — your admin session will be replaced.</span>
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 text-[11px] font-mono break-all max-h-32 overflow-y-auto">
              {linkInfo.link}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(linkInfo.link); showMsg('Link copied!'); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 text-sm flex items-center justify-center gap-2">
                <Copy className="w-4 h-4" /> Copy
              </button>
              <a href={linkInfo.link} target="_blank" rel="noreferrer"
                onClick={() => setLinkInfo(null)}
                className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 text-sm flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" /> Open & Login
              </a>
            </div>
          </div>
        </>
      )}

      {/* DETAIL DRAWER */}
      {detail && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setDetail(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="font-black">{detail.name}</h2>
                <p className="text-xs text-gray-400">{detail.email}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div className="truncate"><p className="text-[10px] text-gray-400 uppercase font-semibold">Email</p><p className="font-bold truncate">{detail.email}</p></div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Phone</p><p className="font-bold">{detail.phone || '—'}</p></div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Joined</p><p className="font-bold">{new Date(detail.created_at).toLocaleDateString('en-IN')}</p></div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Last login</p><p className="font-bold">{detail.last_sign_in_at ? new Date(detail.last_sign_in_at).toLocaleDateString('en-IN') : '—'}</p></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleLoginAs(detail)} disabled={generatingLink === detail.id}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-blue-700 disabled:opacity-60">
                  {generatingLink === detail.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                  Login as
                </button>
                <button onClick={() => { setPwTarget(detail); setPwValue(''); }}
                  className="flex-1 py-2.5 bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-amber-600">
                  <KeyRound className="w-3.5 h-3.5" /> Change Password
                </button>
                <button onClick={() => handleDelete(detail)}
                  className="flex-1 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-red-100">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Addresses ({addresses.length})
                </p>
                {loadingDetail ? (
                  <div className="text-xs text-gray-400 py-4 text-center">Loading addresses...</div>
                ) : addresses.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-4 text-center text-xs text-gray-400">No addresses on file.</div>
                ) : (
                  <div className="space-y-2">
                    {addresses.map(a => (
                      <div key={a.id} className="bg-gray-50 rounded-xl p-3 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-bold text-gray-800">{a.full_name || detail.name}</p>
                          {a.is_default && <span className="text-[9px] font-bold bg-primary text-black px-2 py-0.5 rounded-full">DEFAULT</span>}
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                          {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}{a.state ? `, ${a.state}` : ''} – {a.pincode}
                        </p>
                        {a.phone && <p className="text-gray-500 mt-1">📞 {a.phone}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
