import React, { useState } from 'react';
import { Plus, Tag, Trash2, AlertTriangle, X } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface Coupon {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrder: number;
  maxDiscount: number;
  expiry: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

const INITIAL_COUPONS: Coupon[] = [
  { code: 'JBFIRST', type: 'percentage', value: 50, minOrder: 299, maxDiscount: 200, expiry: '2025-12-31', usageLimit: 1000, usedCount: 342, isActive: true },
  { code: 'FLAT100', type: 'flat', value: 100, minOrder: 599, maxDiscount: 100, expiry: '2025-06-30', usageLimit: 500, usedCount: 87, isActive: true },
  { code: 'WELCOME20', type: 'percentage', value: 20, minOrder: 199, maxDiscount: 150, expiry: '2025-12-31', usageLimit: 2000, usedCount: 156, isActive: true },
];

const empty: Omit<Coupon, 'usedCount'> = {
  code: '', type: 'percentage', value: 0, minOrder: 0, maxDiscount: 0, expiry: '', usageLimit: 100, isActive: true,
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof empty>({ ...empty });
  const [deleteCode, setDeleteCode] = useState<string | null>(null);

  const handleAdd = () => {
    if (!form.code || !form.value) return;
    setCoupons(prev => [...prev, { ...form, code: form.code.toUpperCase(), usedCount: 0 }]);
    setShowForm(false);
    setForm({ ...empty });
  };

  const handleDelete = (code: string) => {
    setCoupons(prev => prev.filter(c => c.code !== code));
    setDeleteCode(null);
  };

  const toggleActive = (code: string) => {
    setCoupons(prev => prev.map(c => c.code === code ? { ...c, isActive: !c.isActive } : c));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Coupons</h1>
            <p className="text-gray-500 text-sm">{coupons.length} coupons created</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all">
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(c => (
            <div key={c.code} className={`bg-white rounded-2xl border-2 p-5 shadow-sm relative overflow-hidden transition-all ${c.isActive ? 'border-primary' : 'border-gray-200 opacity-60'}`}>
              {/* Dashed border line */}
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
                <div className="flex justify-between"><span>Min Order:</span><span className="font-semibold">₹{c.minOrder}</span></div>
                <div className="flex justify-between"><span>Max Discount:</span><span className="font-semibold">₹{c.maxDiscount}</span></div>
                <div className="flex justify-between"><span>Expiry:</span><span className="font-semibold">{new Date(c.expiry).toLocaleDateString('en-IN')}</span></div>
                <div className="flex justify-between"><span>Usage:</span><span className="font-semibold">{c.usedCount} / {c.usageLimit}</span></div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.isActive ? '🟢 Active' : '⭕ Inactive'}
                </span>
                <button onClick={() => toggleActive(c.code)} className="text-xs font-semibold text-primary hover:underline">
                  {c.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Coupon Modal */}
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
                <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:border-primary" placeholder="JBFIRST" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Discount Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as 'percentage' | 'flat' }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary">
                    <option value="percentage">Percentage %</option>
                    <option value="flat">Flat ₹</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Value *</label>
                  <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: +e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Min Order (₹)</label>
                  <input type="number" value={form.minOrder} onChange={e => setForm(p => ({ ...p, minOrder: +e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Max Discount (₹)</label>
                  <input type="number" value={form.maxDiscount} onChange={e => setForm(p => ({ ...p, maxDiscount: +e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Expiry Date</label>
                  <input type="date" value={form.expiry} onChange={e => setForm(p => ({ ...p, expiry: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Usage Limit</label>
                  <input type="number" value={form.usageLimit} onChange={e => setForm(p => ({ ...p, usageLimit: +e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleAdd} className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Create Coupon
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirm */}
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
