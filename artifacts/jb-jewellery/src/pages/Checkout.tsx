import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, MapPin, ShoppingBag, MessageCircle, ChevronRight, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { Address, Order, generateOrderId, buildWhatsAppMessage, openWhatsApp, saveOrder } from '@/lib/orders';

type Step = 'address' | 'review' | 'whatsapp';

const STEPS = [
  { key: 'address', label: 'Address', icon: MapPin },
  { key: 'review', label: 'Review Order', icon: ShoppingBag },
  { key: 'whatsapp', label: 'Place Order', icon: MessageCircle },
] as const;

const SHIPPING = 50;
const TAX_RATE = 0.05;

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','Puducherry','Jammu & Kashmir',
];

export default function Checkout() {
  const { items, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>('address');
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const [address, setAddress] = useState<Address>({
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  });

  const subtotal = cartTotal;
  const shipping = subtotal >= 399 ? 0 : SHIPPING;
  const tax = Math.round(subtotal * TAX_RATE);
  const grandTotal = subtotal + shipping + tax - couponDiscount;

  const VALID_COUPONS: Record<string, { type: 'percentage' | 'flat'; value: number; min: number; max: number }> = {
    'JBFIRST': { type: 'percentage', value: 50, min: 299, max: 200 },
    'FLAT100': { type: 'flat', value: 100, min: 599, max: 100 },
    'WELCOME20': { type: 'percentage', value: 20, min: 199, max: 150 },
  };

  const applyCoupon = () => {
    const c = VALID_COUPONS[couponCode.toUpperCase()];
    if (!c) { setCouponError('Invalid coupon code.'); setCouponSuccess(''); return; }
    if (subtotal < c.min) { setCouponError(`Min. order ₹${c.min} required.`); setCouponSuccess(''); return; }
    const disc = c.type === 'percentage' ? Math.min(Math.round(subtotal * c.value / 100), c.max) : Math.min(c.value, c.max);
    setCouponDiscount(disc);
    setCouponError('');
    setCouponSuccess(`Coupon applied! You saved ₹${disc}`);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('review');
  };

  const handlePlaceOrder = async () => {
    if (!user) return;
    setLoading(true);
    setOrderError('');
    try {
      const orderId = generateOrderId();
      const order: Order = {
        orderId,
        userId: user.uid,
        customerName: user.name,
        phone: address.phone,
        email: user.email,
        items,
        address,
        subtotal,
        shipping,
        tax,
        discount: couponDiscount,
        couponCode: couponCode.toUpperCase(),
        grandTotal,
        status: 'pending',
        statusHistory: [{ status: 'pending', time: new Date().toISOString() }],
        whatsappSent: false,
        createdAt: new Date().toISOString(),
      };
      const savedOrder = await saveOrder(order);
      clearCart();
      const message = buildWhatsAppMessage(savedOrder);
      openWhatsApp(message);
      navigate(`/order-success?orderId=${savedOrder.orderId}`);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <ShoppingBag className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500 font-medium">Your cart is empty.</p>
        <Link href="/" className="px-6 py-3 bg-primary text-black font-bold rounded-full hover:bg-yellow-400 transition-all">Continue Shopping</Link>
      </div>
    );
  }

  const currentStepIdx = STEPS.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <span className="text-2xl font-black leading-none">JB</span>
            <span className="text-[10px] text-primary font-bold tracking-widest uppercase">Jewellery Collection</span>
          </div>
          <h1 className="text-lg font-bold ml-4">Checkout</h1>
        </div>
        {/* Step indicator */}
        <div className="container mx-auto px-4 pb-4">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className={`flex items-center gap-2 ${i <= currentStepIdx ? 'text-black' : 'text-gray-400'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i < currentStepIdx ? 'bg-green-500 text-white' : i === currentStepIdx ? 'bg-primary text-black' : 'bg-gray-200 text-gray-500'}`}>
                    {i < currentStepIdx ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-xs font-semibold hidden sm:block">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${i < currentStepIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Address */}
              {step === 'address' && (
                <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Delivery Address</h2>
                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Full Name *</label>
                        <input required value={address.fullName} onChange={e => setAddress(p => ({ ...p, fullName: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="Priya Sharma" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Phone Number *</label>
                        <input required type="tel" value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="9876543210" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Address Line 1 *</label>
                      <input required value={address.line1} onChange={e => setAddress(p => ({ ...p, line1: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="House no., Street, Area" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Address Line 2 (Optional)</label>
                      <input value={address.line2} onChange={e => setAddress(p => ({ ...p, line2: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="Flat no., Landmark" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">City *</label>
                        <input required value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="Mumbai" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">State *</label>
                        <select required value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Pincode *</label>
                        <input required pattern="[0-9]{6}" value={address.pincode} onChange={e => setAddress(p => ({ ...p, pincode: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="400001" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 mt-2">
                      Continue to Review <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Step 2: Review */}
              {step === 'review' && (
                <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary" /> Review Your Order</h2>
                  <div className="space-y-4 mb-6">
                    {items.map(item => (
                      <div key={item.id} className="flex gap-4 bg-gray-50 rounded-xl p-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-xl font-black text-black/20">{item.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.category}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                            <span className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon */}
                  <div className="border-t border-gray-100 pt-6 mb-6">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Have a Coupon?</label>
                    <div className="flex gap-2">
                      <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="JBFIRST" className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary uppercase font-mono" />
                      <button onClick={applyCoupon} className="px-5 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors">Apply</button>
                    </div>
                    {couponError && <p className="text-red-500 text-xs mt-1.5">{couponError}</p>}
                    {couponSuccess && <p className="text-green-600 text-xs mt-1.5">{couponSuccess}</p>}
                  </div>

                  {/* Address summary */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Delivering to</p>
                    <p className="text-sm font-semibold">{address.fullName}</p>
                    <p className="text-xs text-gray-500">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                    <p className="text-xs text-gray-500">{address.city}, {address.state} - {address.pincode}</p>
                    <button onClick={() => setStep('address')} className="text-xs text-primary font-semibold mt-2 hover:underline">Change Address</button>
                  </div>

                  <button onClick={() => setStep('whatsapp')} className="w-full py-4 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
                    Proceed to Place Order <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Step 3: WhatsApp Order */}
              {step === 'whatsapp' && (
                <motion.div key="whatsapp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-green-500" /> Place Order on WhatsApp</h2>
                  <p className="text-gray-500 text-sm mb-8">Your order details will be sent directly to us on WhatsApp. We'll confirm your order within minutes!</p>

                  <div className="bg-[#ECF8EF] border border-green-200 rounded-2xl p-6 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">JB Jewellery Collection</p>
                        <p className="text-xs text-gray-500">We reply within minutes!</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm text-gray-700">
                      <div className="flex justify-between"><span>Items ({items.length})</span><span className="font-semibold">{formatPrice(subtotal)}</span></div>
                      <div className="flex justify-between"><span>Shipping</span><span className="font-semibold">{shipping === 0 ? <span className="text-green-600">FREE</span> : formatPrice(shipping)}</span></div>
                      <div className="flex justify-between"><span>Tax (5%)</span><span className="font-semibold">{formatPrice(tax)}</span></div>
                      {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon ({couponCode})</span><span className="font-semibold">-{formatPrice(couponDiscount)}</span></div>}
                      <div className="flex justify-between text-lg font-black pt-2 border-t border-green-200 mt-2">
                        <span>Total</span>
                        <span className="text-green-700">{formatPrice(grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
                    <strong>How it works:</strong> After clicking the button below, WhatsApp will open with your complete order details. Simply send the message to place your order!
                  </div>

                  {orderError && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                      {orderError}
                    </div>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full py-5 bg-[#25D366] text-white font-bold text-lg rounded-2xl shadow-lg shadow-[#25D366]/30 hover:bg-[#22c55e] hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-6 h-6" />}
                    {loading ? 'Processing...' : 'Place Order on WhatsApp 💛'}
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-3">No payment required right now. Pay on delivery or as instructed on WhatsApp.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-32">
              <h3 className="font-bold text-lg mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-black/20">{item.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{shipping === 0 ? <span className="text-green-600 font-semibold">FREE</span> : formatPrice(shipping)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Tax</span><span>{formatPrice(tax)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-green-600 font-semibold"><span>Discount</span><span>-{formatPrice(couponDiscount)}</span></div>}
              </div>
              <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-black text-lg">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
              {subtotal < 399 && (
                <div className="mt-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  Add {formatPrice(399 - subtotal)} more for FREE shipping!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
