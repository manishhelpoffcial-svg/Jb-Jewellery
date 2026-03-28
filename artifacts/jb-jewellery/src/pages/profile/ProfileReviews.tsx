import React, { useEffect, useState } from 'react';
import { Star, Pencil, Trash2, X, Save, Plus } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { api, type ApiReview } from '@/lib/api';
import { getAllOrders } from '@/lib/orders';
import { useAuth } from '@/context/AuthContext';
import { products } from '@/data/products';

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star className={`w-5 h-5 ${s <= (hover || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ProfileReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveredProductIds, setDeliveredProductIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = () => {
    api.reviews.my()
      .then(({ reviews: r }) => setReviews(r))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (user) {
      getAllOrders().then(orders => {
        const delivered = orders.filter(o => o.status === 'delivered');
        const ids = new Set(delivered.flatMap(o => o.items.map(i => i.id)));
        setDeliveredProductIds(ids);
      });
    }
  }, [user]);

  const reviewedIds = new Set(reviews.map(r => r.product_id));
  const reviewableProducts = products.filter(p => deliveredProductIds.has(p.id) && !reviewedIds.has(p.id));

  const openAdd = (product: { id: string; name: string }) => {
    setSelectedProduct(product);
    setEditingId(null);
    setRating(5);
    setReviewText('');
    setShowForm(true);
  };

  const openEdit = (r: ApiReview) => {
    setSelectedProduct({ id: r.product_id, name: r.product_name });
    setEditingId(r.id);
    setRating(r.rating);
    setReviewText(r.review_text);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.reviews.update(editingId, { rating, reviewText });
      } else {
        await api.reviews.create({ productId: selectedProduct.id, productName: selectedProduct.name, rating, reviewText });
      }
      setMsg({ text: editingId ? 'Review updated!' : 'Review submitted!', ok: true });
      load();
      setShowForm(false);
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : 'Failed to save', ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await api.reviews.delete(id).catch(() => {});
    load();
  };

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black text-gray-900">My Reviews</h1>

        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>
        )}

        {/* Reviewable products */}
        {reviewableProducts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5">
            <p className="text-sm font-bold text-yellow-800 mb-3">Products waiting for your review</p>
            <div className="space-y-2">
              {reviewableProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl p-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-sm font-black text-black/20 flex-shrink-0">{p.name.charAt(0)}</div>
                  <span className="text-sm font-semibold flex-1 truncate">{p.name}</span>
                  <button onClick={() => openAdd({ id: p.id, name: p.name })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-black font-bold rounded-xl text-xs hover:bg-yellow-400 transition-all">
                    <Plus className="w-3 h-3" /> Write Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Star className="w-14 h-14 mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-600">No reviews yet</p>
            <p className="text-gray-400 text-sm mt-1">Reviews will appear here after your orders are delivered.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{r.product_name}</p>
                    <StarRating rating={r.rating} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {r.review_text && <p className="text-sm text-gray-600 italic">"{r.review_text}"</p>}
                <p className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-lg">{editingId ? 'Edit Review' : 'Write Review'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            {selectedProduct && <p className="text-sm font-semibold text-gray-700 mb-4">{selectedProduct.name}</p>}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">Your Rating *</label>
                <StarRating rating={rating} onChange={setRating} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Your Review</label>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={4} placeholder="Share your experience with this product..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2 disabled:opacity-70">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </ProfileLayout>
  );
}
