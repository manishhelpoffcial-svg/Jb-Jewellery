import React, { useEffect, useMemo, useState } from 'react';
import {
  Star, Plus, Trash2, Eye, EyeOff, X, Save, Loader2, Search, Image as ImageIcon, ShieldCheck, User as UserIcon, AlertTriangle, Upload,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  adminApi, productReviewsApi, uploadsApi,
  type SbProduct, type SbProductReview,
} from '@/lib/adminApi';

type Toast = { msg: string; type: 'success' | 'error' } | null;

interface DraftReview {
  product_id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  images: string[];
}

const emptyDraft: DraftReview = {
  product_id: '',
  customer_name: '',
  rating: 5,
  review_text: '',
  images: [],
};

export default function AdminProductReviews() {
  const [reviews, setReviews] = useState<SbProductReview[]>([]);
  const [products, setProducts] = useState<SbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [filterVisible, setFilterVisible] = useState<'all' | 'visible' | 'hidden'>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<DraftReview>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const productById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])) as Record<string, SbProduct>,
    [products],
  );

  const reload = async () => {
    setLoading(true);
    try {
      const [{ reviews }, { products }] = await Promise.all([
        productReviewsApi.list(),
        adminApi.listProducts(),
      ]);
      setReviews(reviews);
      setProducts(products);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filterProduct && r.product_id !== filterProduct) return false;
      if (filterVisible === 'visible' && !r.is_visible) return false;
      if (filterVisible === 'hidden' && r.is_visible) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${r.customer_name} ${r.review_text} ${r.product_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reviews, filterProduct, filterVisible, search]);

  const handleToggleVisibility = async (r: SbProductReview) => {
    try {
      const { review } = await productReviewsApi.update(r.id, { is_visible: !r.is_visible });
      setReviews((prev) => prev.map((x) => (x.id === review.id ? review : x)));
      showToast(review.is_visible ? 'Review is now visible' : 'Review hidden from site');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await productReviewsApi.remove(id);
      setReviews((prev) => prev.filter((x) => x.id !== id));
      setDeleteId(null);
      showToast('Review deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  const openAdd = () => {
    setDraft({ ...emptyDraft, product_id: filterProduct || products[0]?.id || '' });
    setShowForm(true);
  };

  const handleAddImage = async (file: File) => {
    if (draft.images.length >= 2) {
      showToast('Maximum 2 images per review', 'error');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadsApi.adminReviewImage(file);
      setDraft((d) => ({ ...d, images: [...d.images, url] }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!draft.product_id || !draft.customer_name || !draft.rating) {
      showToast('Product, customer name, and rating are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const productName = productById[draft.product_id]?.name || '';
      const { review } = await productReviewsApi.add({
        product_id: draft.product_id,
        product_name: productName,
        customer_name: draft.customer_name,
        rating: draft.rating,
        review_text: draft.review_text,
        images: draft.images,
        source: 'admin',
      });
      setReviews((prev) => [review, ...prev]);
      setShowForm(false);
      showToast('Review added');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {toast && (
          <div className={`fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
            {toast.msg}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Product Reviews</h1>
            <p className="text-gray-500 text-sm">{reviews.length} total · {reviews.filter((r) => r.is_visible).length} visible · {reviews.filter((r) => !r.is_visible).length} hidden</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> Add Manual Review
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviewer or text…"
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
          >
            <option value="">All products</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={filterVisible}
            onChange={(e) => setFilterVisible(e.target.value as 'all' | 'visible' | 'hidden')}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">All status</option>
            <option value="visible">Visible only</option>
            <option value="hidden">Hidden only</option>
          </select>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading reviews…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            <Star className="w-12 h-12 mx-auto mb-3" />
            <p className="text-sm font-medium">No reviews match your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const product = productById[r.product_id];
              return (
                <div key={r.id} className={`bg-white rounded-2xl border ${r.is_visible ? 'border-gray-100' : 'border-gray-300 bg-gray-50/50'} p-5 shadow-sm`}>
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center font-black text-sm shrink-0">
                      {r.customer_initial || r.customer_name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900 text-sm">{r.customer_name}</p>
                            {r.is_verified && (
                              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Verified Buyer
                              </span>
                            )}
                            {r.source === 'admin' && (
                              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Admin Added</span>
                            )}
                            {!r.is_visible && (
                              <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Hidden</span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {product ? product.name : (r.product_name || r.product_id)} · {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleVisibility(r)}
                            title={r.is_visible ? 'Hide from site' : 'Show on site'}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                          >
                            {r.is_visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setDeleteId(r.id)}
                            title="Delete review"
                            className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 mt-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={`w-4 h-4 ${n <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>

                      {r.review_text && (
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">{r.review_text}</p>
                      )}

                      {r.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {r.images.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition-colors">
                              <img src={url} alt={`review ${i + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Manual Review Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-black text-lg">Add Manual Review</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Product *</label>
                <select
                  value={draft.product_id}
                  onChange={(e) => setDraft((d) => ({ ...d, product_id: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">— Select product —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Customer Name *</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={draft.customer_name}
                    onChange={(e) => setDraft((d) => ({ ...d, customer_name: e.target.value }))}
                    placeholder="e.g. Priya M."
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Rating *</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setDraft((d) => ({ ...d, rating: n }))}
                      className="p-1"
                    >
                      <Star className={`w-7 h-7 ${n <= draft.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Review Text</label>
                <textarea
                  value={draft.review_text}
                  onChange={(e) => setDraft((d) => ({ ...d, review_text: e.target.value }))}
                  rows={4}
                  maxLength={2000}
                  placeholder="What the customer said about this product…"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"
                />
                <div className="text-[10px] text-gray-400 mt-1">{draft.review_text.length}/2000</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Photos (optional, max 2)
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {draft.images.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setDraft((d) => ({ ...d, images: d.images.filter((_, j) => j !== i) }))}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {draft.images.length < 2 && (
                    <label className={`w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-xs text-gray-400 cursor-pointer hover:border-primary hover:text-primary transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-4 h-4 mb-1" /> Upload</>}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleAddImage(f);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Add Review'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setDeleteId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Delete this review?</h3>
            <p className="text-gray-500 text-sm mb-6">This will permanently remove it from the database.</p>
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
