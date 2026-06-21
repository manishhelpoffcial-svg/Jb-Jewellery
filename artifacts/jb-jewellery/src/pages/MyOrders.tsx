import React, { useEffect, useState } from 'react';
import { Package, ArrowLeft, Download, MessageCircle, ChevronDown, ChevronUp, Printer, Loader2, Star, X, Upload, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { getMyOrders, Order, openWhatsApp } from '@/lib/orders';
import { downloadInvoicePdf, printInvoice } from '@/lib/invoice';
import { formatPrice } from '@/lib/utils';
import { customerReviewsApi, uploadsApi } from '@/lib/adminApi';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; step: number }> = {
  pending:    { label: 'Order Placed',  color: 'text-yellow-700', bg: 'bg-yellow-100', step: 1 },
  confirmed:  { label: 'Confirmed',     color: 'text-blue-700',   bg: 'bg-blue-100',   step: 2 },
  processing: { label: 'Processing',    color: 'text-orange-700', bg: 'bg-orange-100', step: 3 },
  shipped:    { label: 'Shipped',       color: 'text-purple-700', bg: 'bg-purple-100', step: 4 },
  delivered:  { label: 'Delivered',     color: 'text-green-700',  bg: 'bg-green-100',  step: 5 },
  cancelled:  { label: 'Cancelled',     color: 'text-red-700',    bg: 'bg-red-100',    step: 0 },
};

const TIMELINE_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

interface ReviewModalState {
  productId: string;
  productName: string;
  orderId: string;
}

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<ReviewModalState | null>(null);
  const [reviewedKeys, setReviewedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getMyOrders(user.uid)
      .then(setOrders)
      .finally(() => setLoading(false));
    try {
      const stored = localStorage.getItem(`jb-reviewed-${user.uid}`);
      if (stored) setReviewedKeys(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, [user]);

  const markReviewed = (orderId: string, productId: string) => {
    if (!user) return;
    const key = `${orderId}::${productId}`;
    const next = new Set(reviewedKeys);
    next.add(key);
    setReviewedKeys(next);
    try { localStorage.setItem(`jb-reviewed-${user.uid}`, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
  };

  const openStoredOrDownload = (order: Order) => {
    if (order.invoiceUrl) window.open(order.invoiceUrl, '_blank');
    else downloadInvoicePdf(order);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
        <Package className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500 font-medium">Please login to view your orders.</p>
        <Link href="/" className="px-6 py-3 bg-primary text-black font-bold rounded-full hover:bg-yellow-400 transition-all">Go to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black">My Orders</h1>
            <p className="text-xs text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading your orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-2">No orders yet!</p>
            <p className="text-gray-400 text-sm mb-6">Start shopping and your orders will appear here.</p>
            <Link href="/" className="px-6 py-3 bg-primary text-black font-bold rounded-full hover:bg-yellow-400 transition-all">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isExpanded = expanded === order.orderId;
              return (
                <div key={order.orderId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-black text-sm font-mono">#{order.orderId}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-sm font-bold mt-1">{formatPrice(order.grandTotal)}</p>
                      <p className="text-xs text-gray-500">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={() => setExpanded(isExpanded ? null : order.orderId)} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {order.status !== 'cancelled' && (
                    <div className="px-5 pb-4">
                      <div className="flex items-center gap-0">
                        {TIMELINE_STEPS.map((step, i) => {
                          const current = STATUS_CONFIG[order.status]?.step || 1;
                          const done = i < current;
                          const active = i === current - 1;
                          return (
                            <React.Fragment key={step}>
                              <div className="flex flex-col items-center">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${done ? 'bg-green-500 border-green-500' : active ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}>
                                  {done && <span className="text-white text-[8px]">✓</span>}
                                </div>
                                <span className="text-[8px] text-gray-500 mt-1 whitespace-nowrap hidden sm:block">{STATUS_CONFIG[step]?.label}</span>
                              </div>
                              {i < TIMELINE_STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 transition-all ${i < current - 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Items Ordered</p>
                        <div className="space-y-2">
                          {order.items.map(item => {
                            const reviewedKey = `${order.orderId}::${item.id}`;
                            const alreadyReviewed = reviewedKeys.has(reviewedKey);
                            const canReview = order.status === 'delivered';
                            return (
                              <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] rounded-lg flex items-center justify-center shrink-0 text-sm font-black text-black/20">{item.name.charAt(0)}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate">{item.name}</p>
                                  <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                                </div>
                                <span className="text-xs font-bold whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                                {canReview && (
                                  alreadyReviewed ? (
                                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                                      <CheckCircle2 className="w-3 h-3" /> Reviewed
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => setReviewing({ productId: String(item.id), productName: item.name, orderId: order.orderId })}
                                      className="text-[10px] font-bold bg-primary text-black px-2.5 py-1 rounded-full hover:bg-yellow-400 flex items-center gap-1 whitespace-nowrap"
                                    >
                                      <Star className="w-3 h-3" /> Review
                                    </button>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
                        <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                        <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span></div>
                        <div className="flex justify-between text-gray-500"><span>Tax</span><span>{formatPrice(order.tax)}</span></div>
                        {order.discount > 0 && <div className="flex justify-between text-green-600 font-semibold"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
                        <div className="flex justify-between font-black text-base border-t border-gray-200 pt-2 mt-2"><span>Total</span><span>{formatPrice(order.grandTotal)}</span></div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Delivery Address</p>
                        <p className="text-sm text-gray-700">{order.address.fullName}</p>
                        <p className="text-xs text-gray-500">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</p>
                        <p className="text-xs text-gray-500">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => openStoredOrDownload(order)} className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold hover:border-primary hover:bg-primary/5 transition-all">
                          <Download className="w-3.5 h-3.5" /> Invoice
                        </button>
                        <button onClick={() => printInvoice(order)} className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold hover:border-primary hover:bg-primary/5 transition-all">
                          <Printer className="w-3.5 h-3.5" /> Print
                        </button>
                        <button onClick={() => openWhatsApp(`Hi! I need help with my JB Jewellery order #${order.orderId}.`)} className="flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-semibold hover:bg-[#22c55e] transition-all">
                          <MessageCircle className="w-3.5 h-3.5" /> Help
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewing && user && (
        <ReviewModal
          state={reviewing}
          userName={user.name || user.email || 'Customer'}
          userId={user.uid}
          onClose={() => setReviewing(null)}
          onDone={() => {
            markReviewed(reviewing.orderId, reviewing.productId);
            setReviewing(null);
          }}
        />
      )}
    </div>
  );
}

function ReviewModal({
  state, userName, userId, onClose, onDone,
}: {
  state: ReviewModalState;
  userName: string;
  userId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [name, setName] = useState(userName);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addImage = async (file: File) => {
    if (images.length >= 2) {
      setErr('Maximum 2 photos per review');
      return;
    }
    setErr(null);
    setUploading(true);
    try {
      const url = await uploadsApi.customerReviewImage(file);
      setImages((prev) => [...prev, url]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!name.trim()) { setErr('Please enter your name'); return; }
    setErr(null);
    setSubmitting(true);
    try {
      await customerReviewsApi.submit({
        product_id: state.productId,
        product_name: state.productName,
        user_id: userId,
        customer_name: name.trim(),
        rating,
        review_text: text.trim(),
        images,
      });
      setSuccess(true);
      setTimeout(onDone, 1300);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h3 className="font-black text-base">Write a Review</h3>
            <p className="text-xs text-gray-500 truncate max-w-[260px]">{state.productName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
        </div>

        {success ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-bold text-gray-900">Thanks for your review!</p>
            <p className="text-sm text-gray-500 mt-1">It will appear once approved.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} className="p-1">
                    <Star className={`w-8 h-8 transition-colors ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Display Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Your Review</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Tell others what you loved about this product…"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"
              />
              <div className="text-[10px] text-gray-400 mt-1">{text.length}/2000</div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Add Photos (optional, max 2)</label>
              <div className="flex flex-wrap gap-2 items-center">
                {images.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length < 2 && (
                  <label className={`w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-[10px] text-gray-400 cursor-pointer hover:border-primary hover:text-primary transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-4 h-4 mb-1" /> Photo</>}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) addImage(f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {err && <p className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button
                onClick={submit}
                disabled={submitting || uploading}
                className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
