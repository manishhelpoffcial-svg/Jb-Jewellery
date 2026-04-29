import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  Wallet, Plus, Trash2, CreditCard, Smartphone, Banknote, Building2,
  Star, Check, IndianRupee, ArrowDownLeft, ArrowUpRight, Tag, Receipt, X as XIcon,
} from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { useAuth } from '@/context/AuthContext';
import {
  getPaymentMethods, addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod,
  SavedPaymentMethod, PaymentMethodKind, getWallet, addWalletTxn,
} from '@/lib/userExtras';
import { getAllOrders, Order } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';

const KIND_META: Record<PaymentMethodKind, { label: string; icon: typeof CreditCard; color: string; bg: string }> = {
  upi:        { label: 'UPI',           icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50' },
  card:       { label: 'Card',          icon: CreditCard, color: 'text-blue-600',   bg: 'bg-blue-50' },
  cod:        { label: 'Cash on Delivery', icon: Banknote, color: 'text-green-600', bg: 'bg-green-50' },
  netbanking: { label: 'Net Banking',   icon: Building2,  color: 'text-orange-600', bg: 'bg-orange-50' },
};

export default function ProfilePayments() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [wallet, setWallet] = useState({ balance: 0, txns: [] as { id: string; delta: number; reason: string; createdAt: string }[] });
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [kind, setKind] = useState<PaymentMethodKind>('upi');
  const [label, setLabel] = useState('');
  const [detail, setDetail] = useState('');
  const [makeDefault, setMakeDefault] = useState(true);

  useEffect(() => {
    if (!user) return;
    setMethods(getPaymentMethods(user.uid));
    setWallet(getWallet(user.uid));
    getAllOrders().then(all => setOrders(all.filter(o => o.userId === user.uid || !o.userId)));
  }, [user]);

  const refreshMethods = () => user && setMethods(getPaymentMethods(user.uid));

  const onAdd = () => {
    if (!user || !label.trim()) return;
    addPaymentMethod(user.uid, { kind, label: label.trim(), detail: detail.trim(), isDefault: makeDefault });
    setLabel(''); setDetail(''); setMakeDefault(false);
    setShowAdd(false);
    refreshMethods();
  };

  const onDelete = (id: string) => {
    if (!user) return;
    if (!confirm('Remove this payment method?')) return;
    deletePaymentMethod(user.uid, id);
    refreshMethods();
  };

  const onSetDefault = (id: string) => {
    if (!user) return;
    setDefaultPaymentMethod(user.uid, id);
    refreshMethods();
  };

  const giftWallet = () => {
    if (!user) return;
    addWalletTxn(user.uid, 100, 'Welcome credit');
    setWallet(getWallet(user.uid));
  };

  const paymentHistory = useMemo(() => {
    return orders.map(o => ({
      id: o.orderId,
      method: 'Online',
      amount: o.grandTotal,
      status: o.status === 'cancelled' ? 'refunded' : 'paid',
      date: o.createdAt,
      coupon: o.couponCode,
    }));
  }, [orders]);

  const couponSavings = useMemo(() => {
    return orders.filter(o => o.couponCode).reduce((s, o) => s + (o.discount || 0), 0);
  }, [orders]);

  const totalPaid = useMemo(() => orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.grandTotal, 0), [orders]);

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black text-gray-900">Payments & Wallet</h1>

        {/* Wallet card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A] text-white p-6 shadow-xl">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">JB Wallet Balance</p>
                <p className="text-4xl font-black mt-2 tracking-tight">{formatPrice(wallet.balance)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary text-black flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {wallet.balance === 0 && (
                <button onClick={giftWallet}
                  className="bg-primary text-black font-bold text-xs px-4 py-2 rounded-xl hover:bg-yellow-400 transition-all">
                  Claim ₹100 welcome credit
                </button>
              )}
              <p className="text-xs text-gray-400">
                Wallet credits are auto-applied at checkout. Earned via reviews, refunds & promotions.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Paid',      value: formatPrice(totalPaid), icon: IndianRupee, color: 'bg-green-50 text-green-600' },
            { label: 'Saved with Coupons', value: formatPrice(couponSavings), icon: Tag, color: 'bg-pink-50 text-pink-600' },
            { label: 'Saved Methods',   value: methods.length, icon: CreditCard, color: 'bg-blue-50 text-blue-600' },
            { label: 'Wallet Txns',     value: wallet.txns.length, icon: Receipt, color: 'bg-yellow-50 text-yellow-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-lg font-black text-gray-900">{value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Saved payment methods */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Saved Payment Methods</h3>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-black font-bold rounded-xl text-xs hover:bg-yellow-400 transition-all">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {methods.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
              <CreditCard className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-500">No saved payment methods.</p>
              <p className="text-xs text-gray-400 mt-1">Add UPI, card, or net-banking to skip filling them at checkout.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {methods.map(m => {
                const km = KIND_META[m.kind];
                const Icon = km.icon;
                return (
                  <div key={m.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${m.isDefault ? 'border-primary/40 bg-primary/5' : 'border-gray-100 hover:bg-gray-50'} transition-all`}>
                    <span className={`w-10 h-10 rounded-xl ${km.bg} flex items-center justify-center ${km.color} flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{m.label}</p>
                      <p className="text-xs text-gray-500 truncate">{km.label}{m.detail ? ` · ${m.detail}` : ''}</p>
                    </div>
                    {m.isDefault ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Default
                      </span>
                    ) : (
                      <button onClick={() => onSetDefault(m.id)}
                        className="text-[11px] font-semibold text-gray-500 hover:text-black hover:bg-gray-100 px-2.5 py-1 rounded-lg transition-all">
                        Make default
                      </button>
                    )}
                    <button onClick={() => onDelete(m.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment history */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Payment History</h3>
          {paymentHistory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No transactions yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {paymentHistory.slice(0, 8).map(t => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.status === 'refunded' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {t.status === 'refunded' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        Order #{t.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {t.method}
                        {t.coupon ? ` · Coupon ${t.coupon}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-black ${t.status === 'refunded' ? 'text-red-600' : 'text-gray-900'}`}>
                      {t.status === 'refunded' ? '-' : ''}{formatPrice(t.amount)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{t.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {paymentHistory.length > 8 && (
            <Link href="/profile/orders" className="block text-center text-xs font-semibold text-yellow-700 hover:text-yellow-800 mt-2">
              View all orders →
            </Link>
          )}
        </div>

        {/* Wallet history */}
        {wallet.txns.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4">Wallet Activity</h3>
            <div className="divide-y divide-gray-50">
              {wallet.txns.map(t => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.reason}</p>
                    <p className="text-[11px] text-gray-400">{new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <p className={`text-sm font-black ${t.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t.delta > 0 ? '+' : ''}{formatPrice(t.delta)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coupon history shortcut */}
        <Link href="/profile/coupons"
          className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:bg-gray-50 transition-all">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600">
              <Tag className="w-5 h-5" />
            </span>
            <div>
              <p className="font-bold text-sm text-gray-900">Coupon History</p>
              <p className="text-xs text-gray-500">View available and used coupons</p>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-400">View →</span>
        </Link>
      </div>

      {/* Add modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAdd(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-lg">Add Payment Method</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {(Object.keys(KIND_META) as PaymentMethodKind[]).map(k => {
                const km = KIND_META[k];
                const Icon = km.icon;
                const active = kind === k;
                return (
                  <button key={k} onClick={() => setKind(k)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${active ? 'bg-primary text-black border-primary' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'}`}>
                    <Icon className="w-4 h-4" /> {km.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                  {kind === 'upi' ? 'UPI ID' : kind === 'card' ? 'Card label' : kind === 'netbanking' ? 'Bank name' : 'Label'}
                </label>
                <input value={label} onChange={e => setLabel(e.target.value)}
                  placeholder={kind === 'upi' ? 'name@upi' : kind === 'card' ? 'ICICI Visa **** 4242' : kind === 'netbanking' ? 'HDFC Bank' : 'Cash on Delivery'}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Detail <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={detail} onChange={e => setDetail(e.target.value)}
                  placeholder={kind === 'card' ? 'Expires 04/29' : 'Account holder, branch, etc.'}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input type="checkbox" checked={makeDefault} onChange={e => setMakeDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                Set as default payment method
              </label>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                We do not store full card numbers or CVVs. Saved methods are labels for your reference; you'll re-confirm at checkout via the secure payment gateway.
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={onAdd} disabled={!label.trim()}
                  className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2 disabled:opacity-60">
                  <Check className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </ProfileLayout>
  );
}
