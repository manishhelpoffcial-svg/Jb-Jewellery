import React from 'react';
import { X, Minus, Plus, ShoppingBag, ChevronRight, Heart, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice } from '@/lib/utils';
import { useLocation } from 'wouter';

export function CartDrawer() {
  const {
    items, savedItems, isCartOpen, setIsCartOpen,
    removeFromCart, updateQuantity, cartTotal,
    saveForLater, moveToCart, removeSaved,
  } = useCart();
  const { user, openAuthModal } = useAuth();
  const { toggleWishlist, wishlistIds } = useWishlist();
  const [, navigate] = useLocation();

  const moveToWishlist = (productId: string) => {
    if (!wishlistIds.includes(productId)) toggleWishlist(productId);
    removeFromCart(productId);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (!user) {
      openAuthModal('login');
      return;
    }
    navigate('/checkout');
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

                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                        <button onClick={() => saveForLater(item.id)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-black transition-colors">
                          <Bookmark className="w-3 h-3" /> Save for later
                        </button>
                        <span className="text-gray-200">·</span>
                        <button onClick={() => moveToWishlist(item.id)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-pink-600 transition-colors">
                          <Heart className="w-3 h-3" /> Move to wishlist
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Save For Later */}
              {savedItems.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                    <Bookmark className="w-3.5 h-3.5" /> Saved for Later ({savedItems.length})
                  </p>
                  <div className="space-y-3">
                    {savedItems.map(s => (
                      <div key={s.id} className="flex gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] rounded-lg flex items-center justify-center shrink-0 text-lg font-bold">
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 line-clamp-2">{s.name}</p>
                          <p className="text-xs font-bold mt-1">{formatPrice(s.price)}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <button onClick={() => moveToCart(s.id)}
                              className="text-[10px] font-bold text-yellow-700 hover:text-yellow-800">
                              Move to Cart
                            </button>
                            <span className="text-gray-200 text-[10px]">·</span>
                            <button onClick={() => removeSaved(s.id)}
                              className="text-[10px] font-bold text-gray-400 hover:text-red-500">
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 p-6 space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                {cartTotal < 399 && (
                  <div className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                    Add {formatPrice(399 - cartTotal)} more for FREE shipping!
                  </div>
                )}
                <div className="flex items-center justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full py-4 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ChevronRight className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-center text-gray-500">Apply coupons & pay via WhatsApp at checkout.</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
