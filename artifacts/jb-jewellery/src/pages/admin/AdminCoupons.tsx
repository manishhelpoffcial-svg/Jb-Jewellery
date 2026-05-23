import React, { useEffect, useState } from 'react';
import { Plus, Tag, Trash2, AlertTriangle, X, CircleCheck, CircleOff, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminApi, type SbCoupon } from '@/lib/adminApi';

interface FormCoupon {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  min_order: number;
  max_discount: number;
  expiry: string;
  usage_limit: number;
  is_active: boolean;
}

const empty: FormCoupon = {
  code: '',
  type: 'percentage',
  value: 0,
  min_order: 0,
  max_discount: 0,
  expiry: '',
  usage_limit: 100,
  is_active: true,
};

type ToastState = { msg: string; type: 'success' | 'error' } | null;

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<SbCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormCoupon>({ ...empty });
  const [saving, setSaving] = useState(false);
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const reload = async () => {
    setLoading(true);
    try {
      const { coupons } = await adminApi.listCoupons();
      setCoupons(coupons);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const handleAdd = async () => {
    if (!form.code || !form.value) return;
    setSaving(true);
    try {
      const { coupon } = await adminApi.createCoupon({
        ...form,
        code: form.code.toUpperCase(),
        expiry: form.expiry || null,
      });
      setCoupons((prev) => [coupon, ...prev]);
      setShowForm(false);
      setForm({ ...empty });
      showToast('Coupon created!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create coupon', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code: string) => {
    try {
      await adminApi.deleteCoupon(code);
      setCoupons((prev) => prev.filter((c) => c.code !== code));
      setDeleteCode(null);
      showToast('Coupon deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  const toggleActive = async (c: SbCoupon) => {
    try {
      const { coupon } = await adminApi.updateCoupon(c.code, { is_active: !c.is_active });
      setCoupons((prev) => prev.map((x) => (x.code === c.code ? coupon : x)));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {toast && (
          <div className={`fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 transition-all ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
            {toast.msg}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Coupons</h1>
            <p className="text-gray-500 text-sm">{coupons.length} coupons · synced with Supabase</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all">
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading coupons…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div key={c.code} className={`bg-white rounded-2xl border-2 p-5 shadow-sm relative overflow-hidden transition-all ${c.is_active ? 'border-primary' : 'border-gray-200 opacity-60'}`}>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-50 rounded-r-full border border-gray-200" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-50 rounded-l-full border border-gray-200" />

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="font-black text-lg font-mono text-black">{c.code}</span>
                  </div>
                  <button onClick={() => setDeleteCode(c.code)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-primary/10 rounded-xl p-3 mb-4 text-center">
                  <p className="text-2xl font-black text-black">
                    {c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}
                  </p>
                  <p className="text-xs text-gray-600 font-medium">{c.type === 'percentage' ? 'Percentage Off' : 'Flat Discount'}</p>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between"><span>Min Order:</span><span className="font-semibold">₹{c.min_order}</span></div>
                  <div className="flex justify-between"><span>Max Discount:</span><span className="font-semibold">₹{c.max_discount}</span></div>
                  <div className="flex justify-between"><span>Expiry:</span><span className="font-semibold">{c.expiry ? new Date(c.expiry).toLocaleDateString('en-IN') : '—'}</span></div>
                  <div className="flex justify-between"><span>Usage:</span><span className="font-semibold">{c.used_count} / {c.usage_limit}</span></div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.is_active ? <><CircleCheck className="w-3 h-3" /> Active</> : <><CircleOff className="w-3 h-3" /> Inactive</>}
                  </span>
                  <button onClick={() => toggleActive(c)} className="text-xs font-semibold text-primary hover:underline">
                    {c.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-black text-lg">Create New Coupon</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Coupon Code *</label>
                <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:border-primary" placeholder="JBFIRST" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Discount Type</label>
                  <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as 'percentage' | 'flat' }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary">
                    <option value="percentage">Percentage %</option>
                    <option value="flat">Flat ₹</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Value *</label>
                  <input type="number" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: +e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Min Order (₹)</label>
                  <input type="number" value={form.min_order} onChange={(e) => setForm((p) => ({ ...p, min_order: +e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Max Discount (₹)</label>
                  <input type="number" value={form.max_discount} onChange={(e) => setForm((p) => ({ ...p, max_discount: +e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Expiry Date</label>
                  <input type="date" value={form.expiry} onChange={(e) => setForm((p) => ({ ...p, expiry: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Usage Limit</label>
                  <input type="number" value={form.usage_limit} onChange={(e) => setForm((p) => ({ ...p, usage_limit: +e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Create Coupon'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {deleteCode && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setDeleteCode(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Delete Coupon "{deleteCode}"?</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteCode(null)} className="flex-1 py-3 border rounded-xl font-semibold">Cancel</button>
              <button onClick={() => handleDelete(deleteCode)} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600">Delete</button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
