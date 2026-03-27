import React, { useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, X, Save, Bell, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { products as initialProducts, Product } from '@/data/products';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

const CATEGORIES = ['Earrings', 'Necklaces', 'Bracelets', 'Rings', 'Hair Accessories', 'Anklets', 'Combos'];

type EditProduct = Omit<Product, 'id'> & { id?: string };

const emptyProduct: EditProduct = {
  name: '', price: 0, originalPrice: 0, discount: 0,
  category: 'Earrings', rating: 4.5, reviews: 0, isNew: false, isBestseller: false,
};

type ToastState = { msg: string; type: 'success' | 'error' } | null;

export default function AdminProducts() {
  const [prods, setProds] = useState<Product[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditProduct>(emptyProduct);
  const [isNew, setIsNew] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notifying, setNotifying] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openAdd = () => { setEditing(emptyProduct); setIsNew(true); setShowForm(true); };
  const openEdit = (p: Product) => { setEditing({ ...p }); setIsNew(false); setShowForm(true); };

  const handleSave = async () => {
    if (!editing.name || !editing.price) return;
    let savedProduct: Product;
    if (isNew) {
      savedProduct = { ...editing, id: `prod-${Date.now()}` } as Product;
      setProds(prev => [...prev, savedProduct]);
    } else {
      savedProduct = { ...editing } as Product;
      setProds(prev => prev.map(p => p.id === editing.id ? savedProduct : p));
    }
    setShowForm(false);

    // Auto-notify subscribers if it's a new arrival
    if (isNew && editing.isNew) {
      try {
        const result = await api.notify.newArrival({
          name: editing.name,
          category: editing.category,
          price: editing.price,
          originalPrice: editing.originalPrice,
          discount: editing.discount,
        });
        showToast(`✨ New arrival notification sent to ${result.notified} subscriber(s)!`);
      } catch {
        showToast('Product saved. Notification could not be sent.', 'error');
      }
    }
  };

  const handleDelete = (id: string) => {
    setProds(prev => prev.filter(p => p.id !== id));
    setDeleteId(null);
  };

  const handleNotifyRestock = async (p: Product) => {
    setNotifying(p.id);
    try {
      const result = await api.notify.restock({
        name: p.name,
        category: p.category,
        price: p.price,
      });
      showToast(`🔔 Restock alert sent to ${result.notified} subscriber(s)!`);
    } catch {
      showToast('Failed to send restock alert.', 'error');
    } finally {
      setNotifying(null);
    }
  };

  const handleNotifyNewArrival = async (p: Product) => {
    setNotifying(p.id);
    try {
      const result = await api.notify.newArrival({
        name: p.name,
        category: p.category,
        price: p.price,
        originalPrice: p.originalPrice,
        discount: p.discount,
      });
      showToast(`✨ New arrival notification sent to ${result.notified} subscriber(s)!`);
    } catch {
      showToast('Failed to send notification.', 'error');
    } finally {
      setNotifying(null);
    }
  };

  const recalcDiscount = (mrp: number, final: number) => Math.round(((mrp - final) / mrp) * 100);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 transition-all ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
            {toast.msg}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Products</h1>
            <p className="text-gray-500 text-sm">{prods.length} products in catalogue</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Product', 'Category', 'MRP', 'Price', 'Discount', 'Tags', 'Notify', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {prods.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-black/20">
                          {p.name.charAt(0)}
                        </div>
                        <p className="font-semibold text-gray-800 text-xs max-w-[160px] line-clamp-2">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.category}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 line-through">{formatPrice(p.originalPrice)}</td>
                    <td className="px-4 py-3 font-bold text-xs">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{p.discount}% OFF</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {p.isNew && <span className="text-[10px] font-bold bg-primary text-black px-1.5 py-0.5 rounded">New</span>}
                        {p.isBestseller && <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded">Best</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {p.isNew && (
                          <button
                            onClick={() => handleNotifyNewArrival(p)}
                            disabled={notifying === p.id}
                            title="Notify subscribers: New Arrival"
                            className="flex items-center gap-1 px-2 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                          >
                            {notifying === p.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                            New
                          </button>
                        )}
                        <button
                          onClick={() => handleNotifyRestock(p)}
                          disabled={notifying === p.id}
                          title="Notify subscribers: Restocked"
                          className="flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                        >
                          {notifying === p.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Restock
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-primary/10 rounded-lg text-gray-500 hover:text-primary transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500 transition-colors">
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
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-black text-lg">{isNew ? 'Add New Product' : 'Edit Product'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Product Name *</label>
                <input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="Pearl Drop Earrings" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Category</label>
                <select value={editing.category} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">MRP (₹)</label>
                  <input type="number" value={editing.originalPrice} onChange={e => { const mrp = +e.target.value; setEditing(p => ({ ...p, originalPrice: mrp, discount: recalcDiscount(mrp, p.price) })); }} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Selling Price (₹)</label>
                  <input type="number" value={editing.price} onChange={e => { const price = +e.target.value; setEditing(p => ({ ...p, price, discount: recalcDiscount(p.originalPrice, price) })); }} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="bg-primary/10 px-4 py-2 rounded-xl text-sm">
                Discount: <span className="font-bold text-green-700">{editing.discount}% OFF</span> (auto-calculated)
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Rating (0–5)</label>
                <input type="number" min={0} max={5} step={0.1} value={editing.rating} onChange={e => setEditing(p => ({ ...p, rating: +e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!editing.isNew} onChange={e => setEditing(p => ({ ...p, isNew: e.target.checked }))} className="w-4 h-4 accent-yellow-400" />
                  <span className="text-sm font-semibold">New Arrival</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!editing.isBestseller} onChange={e => setEditing(p => ({ ...p, isBestseller: e.target.checked }))} className="w-4 h-4 accent-yellow-400" />
                  <span className="text-sm font-semibold">Bestseller</span>
                </label>
              </div>
              {isNew && editing.isNew && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-start gap-2">
                  <Bell className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-800 font-medium">Subscribers will be automatically notified about this new arrival when you save.</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Save Product
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setDeleteId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Delete Product?</h3>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 border rounded-xl font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600">Delete</button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
