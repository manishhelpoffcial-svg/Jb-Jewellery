import React, { useEffect, useState } from 'react';
import { Star, Pencil, Trash2, X, Save, Plus, Camera, Image as ImageIcon } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { api, type ApiReview } from '@/lib/api';
import { getAllOrders } from '@/lib/orders';
import { useAuth } from '@/context/AuthContext';
import { products } from '@/data/products';

const REVIEW_PHOTOS_KEY = (uid?: string | null) => `jb-review-photos${uid ? `:${uid}` : ''}`;
const MAX_PHOTO_BYTES = 600 * 1024;
const MAX_PHOTOS = 4;

function readPhotos(uid?: string | null): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(REVIEW_PHOTOS_KEY(uid));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function writePhotos(uid: string, key: string, list: string[]) {
  const all = readPhotos(uid);
  all[key] = list;
  localStorage.setItem(REVIEW_PHOTOS_KEY(uid), JSON.stringify(all));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

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
  const [photos, setPhotos] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [deliveredProductIds, setDeliveredProductIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = () => {
    api.reviews.my()
      .then(({ reviews: r }) => setReviews(r))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    setPhotos(readPhotos(user?.uid));
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

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const openAdd = (product: { id: string; name: string }) => {
    setSelectedProduct(product);
    setEditingId(null);
    setRating(5);
    setReviewText('');
    setReviewPhotos([]);
    setShowForm(true);
  };

  const openEdit = (r: ApiReview) => {
    setSelectedProduct({ id: r.product_id, name: r.product_name });
    setEditingId(r.id);
    setRating(r.rating);
    setReviewText(r.review_text);
    setReviewPhotos(photos[r.id] || []);
    setShowForm(true);
  };

  const onPickPhotos = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    for (const f of arr) {
      if (reviewPhotos.length >= MAX_PHOTOS) {
        showMsg(`Maximum ${MAX_PHOTOS} photos`, false);
        break;
      }
      if (!f.type.startsWith('image/')) { showMsg('Only image files', false); continue; }
      if (f.size > MAX_PHOTO_BYTES) { showMsg(`${f.name} is larger than 600kB`, false); continue; }
      try {
        const url = await fileToDataUrl(f);
        setReviewPhotos(prev => [...prev, url].slice(0, MAX_PHOTOS));
      } catch {
        showMsg('Could not read photo', false);
      }
    }
  };

  const removePhoto = (i: number) => setReviewPhotos(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!selectedProduct || !user) return;
    setSaving(true);
    try {
      let key = editingId;
      if (editingId) {
        await api.reviews.update(editingId, { rating, reviewText });
      } else {
        const { review } = await api.reviews.create({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          rating,
          reviewText,
        });
        key = review.id;
      }
      if (key) {
        writePhotos(user.uid, key, reviewPhotos);
        setPhotos(readPhotos(user.uid));
      }
      showMsg(editingId ? 'Review updated!' : 'Review submitted!');
      load();
      setShowForm(false);
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to save', false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await api.reviews.delete(id).catch(() => {});
    if (user) {
      writePhotos(user.uid, id, []);
      setPhotos(readPhotos(user.uid));
    }
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
            {reviews.map(r => {
              const rPhotos = photos[r.id] || [];
              return (
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
                  {rPhotos.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {rPhotos.map((p, i) => (
                        <a key={i} href={p} target="_blank" rel="noreferrer">
                          <img src={p} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-100 hover:scale-105 transition-transform" />
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
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
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Product Photos <span className="text-gray-400 font-normal">(optional, max {MAX_PHOTOS})</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {reviewPhotos.map((p, i) => (
                    <div key={i} className="relative">
                      <img src={p} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                      <button onClick={() => removePhoto(i)} type="button"
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center hover:bg-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {reviewPhotos.length < MAX_PHOTOS && (
                    <label className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 cursor-pointer transition-colors">
                      <Camera className="w-4 h-4" />
                      <span className="text-[9px] mt-0.5 font-bold">Add</span>
                      <input type="file" accept="image/*" multiple hidden
                        onChange={(e) => { onPickPhotos(e.target.files); e.target.value = ''; }} />
                    </label>
                  )}
                </div>
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
