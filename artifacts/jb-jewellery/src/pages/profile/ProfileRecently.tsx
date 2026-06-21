import React, { useEffect, useState } from 'react';
import { Clock, ShoppingCart, Heart } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { products } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice } from '@/lib/utils';

const STORAGE_KEY = 'jb-recently-viewed';
const MAX_ITEMS = 10;
const EXPIRY_DAYS = 30;

export function trackRecentlyViewed(productId: string) {
  const raw = localStorage.getItem(STORAGE_KEY);
  const existing: { id: string; time: number }[] = raw ? JSON.parse(raw) : [];
  const cutoff = Date.now() - EXPIRY_DAYS * 86400000;
  const filtered = existing.filter(i => i.time > cutoff && i.id !== productId);
  filtered.unshift({ id: productId, time: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
}

function getRecentlyViewed() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const cutoff = Date.now() - EXPIRY_DAYS * 86400000;
  const items: { id: string; time: number }[] = JSON.parse(raw);
  return items.filter(i => i.time > cutoff).map(i => i.id);
}

export default function ProfileRecently() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => { setIds(getRecentlyViewed()); }, []);

  const recentProducts = ids.map(id => products.find(p => p.id === id)).filter(Boolean) as typeof products;

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIds([]);
  };

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900">Recently Viewed</h1>
          {recentProducts.length > 0 && (
            <button onClick={handleClear} className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors">Clear All</button>
          )}
        </div>

        {recentProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Clock className="w-14 h-14 mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-600">No recently viewed products</p>
            <p className="text-gray-400 text-sm mt-1">Products you view will appear here for 30 days.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {recentProducts.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="relative aspect-square bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] flex items-center justify-center">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-black/10">{p.name.charAt(0)}</span>
                  )}
                  <button onClick={() => toggleWishlist(p.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                    <Heart className={`w-4 h-4 ${isInWishlist(p.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                  </button>
                  {p.discount > 0 && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{p.discount}% OFF</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">{p.name}</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm font-black">{formatPrice(p.price)}</span>
                    <span className="text-xs text-gray-400 line-through">{formatPrice(p.originalPrice)}</span>
                  </div>
                  <button onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-primary text-black font-bold rounded-xl text-xs hover:bg-yellow-400 transition-all">
                    <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}
