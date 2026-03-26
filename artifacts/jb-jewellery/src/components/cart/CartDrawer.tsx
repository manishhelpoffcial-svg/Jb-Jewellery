import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
  const [couponCode, setCouponCode] = useState('');

  const handleCheckout = () => {
    const text = `Hi! I want to order from JB Jewellery:\n\n` + 
      items.map(item => `- ${item.name} (${item.quantity}x) - ${formatPrice(item.price * item.quantity)}`).join('\n') +
      `\n\nTotal Amount: ${formatPrice(cartTotal)}`;
    
    window.open(`https://wa.me/919999999999?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                My Cart ({items.length})
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-500">
                  <ShoppingBag className="w-16 h-16 opacity-20" />
                  <p>Your cart is empty.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="px-6 py-2 bg-primary text-black font-semibold rounded-full hover:shadow-lg transition-all"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative group">
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="absolute -top-2 -right-2 bg-white border border-gray-200 p-1 rounded-full text-gray-400 hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    
                    {/* Placeholder image */}
                    <div className="w-20 h-20 bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] rounded-lg flex flex-col items-center justify-center shrink-0">
                       <span className="text-2xl">{item.name.charAt(0)}</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h3 className="text-sm font-bold leading-tight line-clamp-2 text-gray-800">{item.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <span>{formatPrice(item.price)}</span>
                        </div>
                        
                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-l-lg transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-r-lg transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 p-6 space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Coupon Code" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  />
                  <button className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                    Apply
                  </button>
                </div>
                
                <div className="flex items-center justify-between text-lg font-bold text-gray-900 pt-2">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full py-4 bg-[#25D366] text-white font-bold rounded-xl shadow-lg shadow-[#25D366]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  Checkout on WhatsApp 🟢
                </button>
                <p className="text-[10px] text-center text-gray-500">Secure checkout via WhatsApp. No payment required right now.</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
