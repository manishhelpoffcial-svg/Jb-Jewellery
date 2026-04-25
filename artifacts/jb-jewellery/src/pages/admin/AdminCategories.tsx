import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, AlertTriangle, X, Loader2, Eye, EyeOff, Pencil, Image as ImageIcon, Link as LinkIcon, Upload, Check, Search, Layers } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminCategoriesApi, uploadsApi, adminApi, type SbCategory, type CategoryType, type SbProduct } from '@/lib/adminApi';

// ── helpers ────────────────────────────────────────────────────────────────
const TYPE_META: Record<CategoryType, { label: string; desc: string; tint: string }> = {
  main:  { label: 'Main Categories',   desc: 'Earrings, Necklaces, Rings… auto-filtered by product.category',   tint: 'bg-blue-100 text-blue-700' },
  vibe:  { label: 'Shop Your Vibe',    desc: 'Boss Babe, Glam Girl… you choose which products show in each',   tint: 'bg-pink-100 text-pink-700' },
  price: { label: 'Shop Under Budget', desc: 'Under ₹99, ₹199… auto-filtered by max price',                    tint: 'bg-green-100 text-green-700' },
  combo: { label: 'Unbeatable Combos', desc: 'Buy any N at fixed ₹ — admin assigns eligible products',         tint: 'bg-amber-100 text-amber-700' },
};

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type Toast = { msg: string; kind: 'success' | 'error' } | null;

interface FormState {
  id?: string;
  slug: string;
  name: string;
  type: CategoryType;
  image: string;
  subtitle: string;
  product_category: string;
  max_price: string;
  combo_count: string;
  combo_price: string;
  combo_extra: string;
  is_visible: boolean;
  sort_order: number;
}

const empty = (type: CategoryType): FormState => ({
  slug: '', name: '', type,
  image: '', subtitle: '', product_category: '',
  max_price: '', combo_count: '', combo_price: '', combo_extra: '',
  is_visible: true, sort_order: 0,
});

// ── main page ──────────────────────────────────────────────────────────────
export default function AdminCategories() {
  const [tab, setTab] = useState<CategoryType>('main');
  const [cats, setCats] = useState<SbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [picking, setPicking] = useState<SbCategory | null>(null);
  const [allProducts, setAllProducts] = useState<SbProduct[]>([]);

  const showToast = (msg: string, kind: 'success' | 'error' = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  };

  const reload = async () => {
    setLoading(true);
    try {
      const { categories } = await adminCategoriesApi.list();
      setCats(categories);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);
  useEffect(() => {
    adminApi.listProducts().then((r) => setAllProducts(r.products)).catch(() => {});
  }, []);

  const visible = useMemo(() => cats.filter((c) => c.type === tab), [cats, tab]);

  const toggleVisible = async (c: SbCategory) => {
    try {
      const { category } = await adminCategoriesApi.update(c.id, { is_visible: !c.is_visible });
      setCats((p) => p.map((x) => (x.id === c.id ? { ...x, ...category } : x)));
      showToast(category.is_visible ? 'Now visible on home page' : 'Hidden from home page');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  const handleSave = async (form: FormState) => {
    const slug = (form.slug || slugify(form.name));
    if (!form.name.trim() || !slug) {
      showToast('Name is required', 'error');
      return;
    }
    const payload: Partial<SbCategory> = {
      slug,
      name: form.name.trim(),
      type: form.type,
      image: form.image || null,
      subtitle: form.subtitle || null,
      is_visible: form.is_visible,
      sort_order: Number(form.sort_order) || 0,
      product_category: form.type === 'main' ? (form.product_category || null) : null,
      max_price: form.type === 'price' ? (form.max_price ? Number(form.max_price) : null) : null,
      combo_count: form.type === 'combo' ? (form.combo_count ? Number(form.combo_count) : null) : null,
      combo_price: form.type === 'combo' ? (form.combo_price ? Number(form.combo_price) : null) : null,
      combo_extra: form.type === 'combo' ? (form.combo_extra || null) : null,
    };
    try {
      if (form.id) {
        const { category } = await adminCategoriesApi.update(form.id, payload);
        setCats((p) => p.map((x) => (x.id === form.id ? { ...x, ...category } : x)));
        showToast('Saved');
      } else {
        const { category } = await adminCategoriesApi.create(payload);
        setCats((p) => [...p, { ...category, product_ids: [] }]);
        showToast('Category created');
      }
      setEditing(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminCategoriesApi.remove(deleteId);
      setCats((p) => p.filter((c) => c.id !== deleteId));
      setDeleteId(null);
      showToast('Category deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  const saveProductPicks = async (catId: string, ids: string[]) => {
    try {
      await adminCategoriesApi.setProducts(catId, ids);
      setCats((p) => p.map((c) => (c.id === catId ? { ...c, product_ids: ids } : c)));
      setPicking(null);
      showToast(`${ids.length} products assigned`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {toast && (
          <div className={`fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold text-white ${toast.kind === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>{toast.msg}</div>
        )}

        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Layers className="w-6 h-6 text-primary" /> Categories</h1>
          <p className="text-sm text-gray-500">Control every category section that shows on the home page.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_META) as CategoryType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${tab === t ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:border-black'}`}
            >
              {TYPE_META[t].label}
              <span className="ml-2 text-[10px] opacity-70">{cats.filter((c) => c.type === t).length}</span>
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl px-4 py-3 text-xs text-gray-600 flex items-center justify-between">
          <span><b>{TYPE_META[tab].label}:</b> {TYPE_META[tab].desc}</span>
          <button onClick={() => setEditing(empty(tab))} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-black font-bold rounded-lg hover:bg-yellow-400 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No {TYPE_META[tab].label.toLowerCase()} yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.sort((a, b) => a.sort_order - b.sort_order).map((c) => (
              <div key={c.id} className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all ${c.is_visible ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full ${TYPE_META[c.type].tint}`}>{c.type.toUpperCase()}</span>
                  {!c.is_visible && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full bg-gray-900 text-white">HIDDEN</span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div>
                    <p className="font-black text-sm text-gray-900 leading-tight">{c.name}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">/{c.slug}</p>
                  </div>
                  {c.type === 'price' && c.max_price != null && (
                    <p className="text-xs text-gray-500">Max price: <b className="text-black">₹{c.max_price}</b></p>
                  )}
                  {c.type === 'combo' && (
                    <p className="text-xs text-gray-500">Buy <b>{c.combo_count}</b> @ <b className="text-black">₹{c.combo_price}</b></p>
                  )}
                  {c.type === 'main' && c.product_category && (
                    <p className="text-xs text-gray-500">Auto-loads: <b className="text-black">{c.product_category}</b></p>
                  )}
                  {(c.type === 'vibe' || c.type === 'combo') && (
                    <p className="text-xs text-gray-500">{c.product_ids?.length || 0} products assigned</p>
                  )}
                  <div className="flex items-center gap-1 pt-2">
                    <button onClick={() => toggleVisible(c)} title={c.is_visible ? 'Hide from home' : 'Show on home'} className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${c.is_visible ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {c.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {c.is_visible ? 'Visible' : 'Hidden'}
                    </button>
                    <button onClick={() => setEditing({
                      id: c.id, slug: c.slug, name: c.name, type: c.type,
                      image: c.image || '', subtitle: c.subtitle || '',
                      product_category: c.product_category || '',
                      max_price: c.max_price?.toString() || '',
                      combo_count: c.combo_count?.toString() || '',
                      combo_price: c.combo_price?.toString() || '',
                      combo_extra: c.combo_extra || '',
                      is_visible: c.is_visible, sort_order: c.sort_order,
                    })} title="Edit" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(c.id)} title="Delete" className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  {(c.type === 'vibe' || c.type === 'combo') && (
                    <button onClick={() => setPicking(c)} className="w-full text-xs font-bold py-2 bg-black text-white rounded-lg hover:bg-gray-800">
                      Manage Products →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && <CategoryFormModal initial={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setDeleteId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Delete this category?</h3>
            <p className="text-sm text-gray-500">It will disappear from the home page immediately. Product assignments will be removed too.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 border rounded-xl font-semibold">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600">Delete</button>
            </div>
          </div>
        </>
      )}
      {picking && (
        <ProductPickerModal
          category={picking}
          allProducts={allProducts}
          onClose={() => setPicking(null)}
          onSave={(ids) => saveProductPicks(picking.id, ids)}
        />
      )}
    </AdminLayout>
  );
}

// ── Form Modal ─────────────────────────────────────────────────────────────
function CategoryFormModal({ initial, onClose, onSave }: { initial: FormState; onClose: () => void; onSave: (f: FormState) => Promise<void> | void }) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [imgMode, setImgMode] = useState<'link' | 'upload'>(form.image ? 'link' : 'link');
  const [uploading, setUploading] = useState(false);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadsApi.categoryImage(file);
      update('image', url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    await onSave({ ...form, slug: form.slug || slugify(form.name) });
    setSaving(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-black text-lg">{form.id ? 'Edit Category' : 'New Category'} · <span className="text-xs uppercase tracking-wide text-gray-500">{TYPE_META[form.type].label}</span></h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Name *</label>
              <input value={form.name} onChange={(e) => update('name', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="e.g. Boss Babe Basic" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Slug (URL)</label>
              <input value={form.slug} onChange={(e) => update('slug', slugify(e.target.value))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary" placeholder="auto-from-name" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={(e) => update('sort_order', +e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          {form.type === 'vibe' && (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Subtitle (caption)</label>
              <input value={form.subtitle} onChange={(e) => update('subtitle', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="Power. Poise. Polish." />
            </div>
          )}

          {form.type === 'main' && (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Maps to Product Category</label>
              <input value={form.product_category} onChange={(e) => update('product_category', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="Earrings" />
              <p className="text-[11px] text-gray-400 mt-1">All products with this <code>category</code> field will appear on the page.</p>
            </div>
          )}

          {form.type === 'price' && (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Max Price (₹) *</label>
              <input type="number" value={form.max_price} onChange={(e) => update('max_price', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="99" />
              <p className="text-[11px] text-gray-400 mt-1">All products priced ≤ this will auto-show.</p>
            </div>
          )}

          {form.type === 'combo' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Buy any (count) *</label>
                <input type="number" value={form.combo_count} onChange={(e) => update('combo_count', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="6" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Combo Price (₹) *</label>
                <input type="number" value={form.combo_price} onChange={(e) => update('combo_price', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="499" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Extra Perk (optional)</label>
                <input value={form.combo_extra} onChange={(e) => update('combo_extra', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="Flat 10% Off / Free Gift" />
              </div>
            </div>
          )}

          {/* Image */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Category Image</label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setImgMode('link')} className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 ${imgMode === 'link' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}><LinkIcon className="w-3 h-3" /> URL</button>
              <button type="button" onClick={() => setImgMode('upload')} className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 ${imgMode === 'upload' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}><Upload className="w-3 h-3" /> Upload</button>
            </div>
            {imgMode === 'link' ? (
              <input value={form.image} onChange={(e) => update('image', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="https://…" />
            ) : (
              <label className="block">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
                <div className="w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-sm text-center cursor-pointer hover:border-primary">
                  {uploading ? <span className="flex items-center justify-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</span> : 'Click to upload an image'}
                </div>
              </label>
            )}
            {form.image && (
              <div className="mt-2 relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                <img src={form.image} alt="" className="w-full h-full object-cover" />
                <button onClick={() => update('image', '')} className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input type="checkbox" checked={form.is_visible} onChange={(e) => update('is_visible', e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-semibold">Visible on home page</span>
          </label>
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving || !form.name.trim()} className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Product Picker Modal ───────────────────────────────────────────────────
function ProductPickerModal({ category, allProducts, onClose, onSave }: { category: SbCategory; allProducts: SbProduct[]; onClose: () => void; onSave: (ids: string[]) => Promise<void> | void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(category.product_ids || []));
  const [q, setQ] = useState('');
  const [filterFit, setFilterFit] = useState(false);
  const [saving, setSaving] = useState(false);

  // For combo categories, suggest products that "fit" (avg price <= combo_price/combo_count * 1.5)
  const fitMax = category.type === 'combo' && category.combo_count && category.combo_price
    ? (Number(category.combo_price) / Number(category.combo_count)) * 1.6
    : null;

  const filtered = allProducts.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (filterFit && fitMax != null && Number(p.price) > fitMax) return false;
    return true;
  });

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const submit = async () => {
    setSaving(true);
    await onSave(Array.from(selected));
    setSaving(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg">Manage products in “{category.name}”</h2>
            <p className="text-xs text-gray-500">
              {selected.size} selected
              {category.type === 'combo' && fitMax && (
                <> · suggested per-item price ≤ <b>₹{Math.round(fitMax)}</b></>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-3 border-b flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
          {category.type === 'combo' && fitMax != null && (
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={filterFit} onChange={(e) => setFilterFit(e.target.checked)} className="w-4 h-4 accent-primary" />
              Only fitting price
            </label>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((p) => {
                const on = selected.has(p.id);
                const img = (Array.isArray(p.images) && p.images[0]) || p.image;
                return (
                  <button key={p.id} onClick={() => toggle(p.id)} className={`text-left rounded-xl border-2 overflow-hidden transition-all ${on ? 'border-primary shadow-md' : 'border-gray-100 hover:border-gray-300'}`}>
                    <div className="aspect-square bg-gray-50 relative">
                      {img ? <img src={img} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-8 h-8" /></div>}
                      {on && <div className="absolute inset-0 bg-primary/20 flex items-center justify-center"><div className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center"><Check className="w-4 h-4" /></div></div>}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-bold truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-500">₹{p.price}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save ({selected.size})
          </button>
        </div>
      </div>
    </>
  );
}
