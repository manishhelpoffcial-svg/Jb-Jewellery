import React from 'react';
import { Link } from 'wouter';
import { Heart, ShoppingCart } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { products } from '@/data/products';
import { formatPrice } from '@/lib/utils';

export default function ProfileWishlist() {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const wishlistProducts = products.filter(p => wishlistIds.includes(p.id));

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900">My Wishlist</h1>
          {wishlistIds.length > 0 && (
            <span className="text-sm text-gray-500">{wishlistIds.length} item{wishlistIds.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center">
            <Heart className="w-14 h-14 mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-600">Your wishlist is empty</p>
            <p className="text-gray-400 text-sm mt-1">Save products you love by tapping the heart icon.</p>
            <Link href="/products" className="inline-block mt-5 px-6 py-2.5 bg-primary text-black font-bold rounded-xl text-sm hover:bg-yellow-400 transition-all">Shop Now</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {wishlistProducts.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                <div className="relative aspect-square bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] flex items-center justify-center">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-black/10">{p.name.charAt(0)}</span>
                  )}
                  <button onClick={() => toggleWishlist(p.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  </button>
                  {p.discount > 0 && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{p.discount}% OFF</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">{p.name}</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm font-black text-gray-900">{formatPrice(p.price)}</span>
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
