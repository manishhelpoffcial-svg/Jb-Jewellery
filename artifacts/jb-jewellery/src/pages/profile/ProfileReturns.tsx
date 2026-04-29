import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  RotateCcw, Package, X as XIcon, Plus, Truck, CheckCircle2, IndianRupee,
  RefreshCw, AlertTriangle, Clock,
} from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { useAuth } from '@/context/AuthContext';
import { getAllOrders, Order, updateOrderStatus } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';
import {
  addReturn, cancelReturn, getReturns, ReturnKind, ReturnRequest, ReturnStatus,
} from '@/lib/userExtras';

const STATUS_META: Record<ReturnStatus, { label: string; bg: string; color: string; dot: string }> = {
  pending:           { label: 'Pending Review',      bg: 'bg-yellow-50',  color: 'text-yellow-700',  dot: 'bg-yellow-400' },
  approved:          { label: 'Approved',            bg: 'bg-blue-50',    color: 'text-blue-700',    dot: 'bg-blue-500' },
  pickup_scheduled:  { label: 'Pickup Scheduled',    bg: 'bg-purple-50',  color: 'text-purple-700',  dot: 'bg-purple-500' },
  received:          { label: 'Item Received',       bg: 'bg-indigo-50',  color: 'text-indigo-700',  dot: 'bg-indigo-500' },
  refunded:          { label: 'Refunded',            bg: 'bg-green-50',   color: 'text-green-700',   dot: 'bg-green-500' },
  rejected:          { label: 'Rejected',            bg: 'bg-red-50',     color: 'text-red-700',     dot: 'bg-red-500' },
};

const KIND_META: Record<ReturnKind, { label: string; icon: typeof RotateCcw; color: string }> = {
  return:   { label: 'Return',   icon: RotateCcw, color: 'text-orange-600' },
  exchange: { label: 'Exchange', icon: RefreshCw, color: 'text-blue-600' },
  cancel:   { label: 'Cancel',   icon: XIcon,     color: 'text-red-600' },
};

const RETURN_REASONS = [
  'Item is defective / damaged',
  'Wrong item received',
  'Item does not match description',
  'Quality not as expected',
  'Size / fit issue',
  'No longer needed',
  'Other',
];

export default function ProfileReturns() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState<ReturnKind>('return');
  const [orderId, setOrderId] = useState('');
  const [productName, setProductName] = useState('');
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState(0);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    getAllOrders().then(all => setOrders(all.filter(o => o.userId === user.uid || !o.userId)));
    setReturns(getReturns(user.uid));
  }, [user]);

  const eligibleOrders = useMemo(() => {
    return orders.filter(o => o.status === 'delivered' || o.status === 'pending' || o.status === 'confirmed');
  }, [orders]);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const openForm = (preselectKind: ReturnKind = 'return') => {
    setKind(preselectKind);
    setOrderId(eligibleOrders[0]?.orderId || '');
    setProductName(eligibleOrders[0]?.items?.[0]?.name || '');
    setReason(RETURN_REASONS[0]);
    setNotes('');
    setAmount(eligibleOrders[0]?.grandTotal || 0);
    setShowForm(true);
  };

  const onOrderChange = (id: string) => {
    setOrderId(id);
    const o = orders.find(x => x.orderId === id);
    if (o) {
      setProductName(o.items[0]?.name || '');
      setAmount(o.grandTotal);
    }
  };

  const submit = async () => {
    if (!user) return;
    if (!orderId) { showMsg('Please pick an order', false); return; }
    if (kind === 'cancel') {
      // Cancel = also flip the order status to cancelled.
      await updateOrderStatus(orderId, 'cancelled').catch(() => {});
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: 'cancelled' } : o));
    }
    addReturn(user.uid, {
      orderId, productName, kind, reason, notes, amount,
    });
    setReturns(getReturns(user.uid));
    setShowForm(false);
    showMsg(`${KIND_META[kind].label} request submitted!`);
  };

  const cancelReq = (id: string) => {
    if (!user) return;
    if (!confirm('Withdraw this request?')) return;
    cancelReturn(user.uid, id);
    setReturns(getReturns(user.uid));
  };

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-black text-gray-900">Returns & Refunds</h1>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => openForm('return')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-xl text-xs hover:bg-yellow-400 transition-all">
              <Plus className="w-3.5 h-3.5" /> New Return
            </button>
            <button onClick={() => openForm('exchange')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs hover:bg-blue-100 transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Exchange
            </button>
            <button onClick={() => openForm('cancel')}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-bold rounded-xl text-xs hover:bg-red-100 transition-all">
              <XIcon className="w-3.5 h-3.5" /> Cancel Order
            </button>
          </div>
        </div>

        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Requests',  value: returns.length, icon: RotateCcw, color: 'bg-orange-50 text-orange-600' },
            { label: 'Pending',         value: returns.filter(r => r.status === 'pending').length, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
            { label: 'In Transit',      value: returns.filter(r => r.status === 'pickup_scheduled' || r.status === 'received').length, icon: Truck, color: 'bg-blue-50 text-blue-600' },
            { label: 'Refunded',        value: formatPrice(returns.filter(r => r.status === 'refunded').reduce((s, r) => s + r.amount, 0)), icon: IndianRupee, color: 'bg-green-50 text-green-600' },
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

        {/* Policy banner */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-yellow-800">Easy 7-Day Returns</p>
            <p className="text-xs text-yellow-700 mt-0.5 leading-relaxed">
              Returns are accepted within 7 days of delivery for defective or wrong items. Refunds are processed within 5–7 business days to the original payment method.
            </p>
          </div>
        </div>

        {/* Requests list */}
        {returns.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="w-14 h-14 mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-600">No return or refund requests yet</p>
            <p className="text-gray-400 text-sm mt-1">Raise a request from a delivered order to start.</p>
            <Link href="/profile/orders"
              className="inline-block mt-5 px-6 py-2.5 bg-primary text-black font-bold rounded-xl text-sm hover:bg-yellow-400 transition-all">
              View My Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {returns.map(r => {
              const km = KIND_META[r.kind];
              const sm = STATUS_META[r.status];
              const KIcon = km.icon;
              return (
                <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${km.color} flex-shrink-0`}>
                        <KIcon className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm">
                          {km.label} · <span className="font-mono">{r.id}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          Order #{r.orderId.slice(0, 8).toUpperCase()} · {r.productName}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · Reason: {r.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full ${sm.bg} ${sm.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                        {sm.label}
                      </span>
                      <p className="font-black text-gray-900 text-sm">{formatPrice(r.amount)}</p>
                    </div>
                  </div>

                  {/* Refund tracker */}
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
                    {(['pending', 'approved', 'received', 'refunded'] as ReturnStatus[]).map((s, i, arr) => {
                      const order = arr.indexOf(r.status as ReturnStatus);
                      const reached = i <= (order < 0 ? 0 : order);
                      return (
                        <React.Fragment key={s}>
                          <span className={`flex items-center gap-1 ${reached ? 'text-green-700' : 'text-gray-300'}`}>
                            {reached ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-2 h-2 rounded-full bg-gray-200" />}
                            {STATUS_META[s].label}
                          </span>
                          {i < arr.length - 1 && <span className={`flex-1 h-0.5 ${reached ? 'bg-green-200' : 'bg-gray-100'}`} />}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {r.status === 'pending' && (
                    <div className="mt-3 flex justify-end">
                      <button onClick={() => cancelReq(r.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all">
                        Withdraw request
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New request modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-lg">{KIND_META[kind].label} Request</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {eligibleOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-200" />
                <p className="text-sm font-semibold text-gray-600">No eligible orders found</p>
                <p className="text-xs text-gray-400 mt-1">Returns are only available for delivered or recent orders.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {(['return', 'exchange', 'cancel'] as ReturnKind[]).map(k => (
                    <button key={k} onClick={() => setKind(k)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${kind === k ? 'bg-primary text-black border-primary' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'}`}>
                      {KIND_META[k].label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Order</label>
                  <select value={orderId} onChange={e => onOrderChange(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary">
                    {eligibleOrders.map(o => (
                      <option key={o.orderId} value={o.orderId}>
                        #{o.orderId.slice(0, 8).toUpperCase()} — {formatPrice(o.grandTotal)} ({o.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Product</label>
                  <input value={productName} onChange={e => setProductName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Reason</label>
                  <select value={reason} onChange={e => setReason(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary">
                    {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Additional notes <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    placeholder="Any extra details that will help us process this faster..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none" />
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={submit} className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2">
                    Submit Request
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </ProfileLayout>
  );
}
