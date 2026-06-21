import React from 'react';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice } from '@/lib/utils';
import type { SbProduct } from '@/lib/adminApi';

interface Props {
  product: SbProduct;
}

// Renders a Supabase-backed product (full image URLs, original_price, etc.)
export function DbProductCard({ product }: Props) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wished = isInWishlist(product.id);

  const img = (Array.isArray(product.images) && product.images[0]) || product.image || '';
  const original = Number(product.original_price || product.price);
  const price = Number(product.price);
  const discount = Number(product.discount || (original > price ? Math.round(((original - price) / original) * 100) : 0));

  const handleAdd = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price,
      originalPrice: original,
      discount,
      category: product.category,
      rating: product.rating,
      reviews: product.reviews,
      image: img,
      isBestseller: product.is_bestseller,
      isNew: product.is_new,
    });
  };

  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col group relative">
      <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
        {product.is_bestseller && (<span className="bg-black text-white text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">Bestseller</span>)}
        {product.is_new && (<span className="bg-primary text-black text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider shadow-sm">New</span>)}
      </div>
      <button onClick={() => toggleWishlist(product.id)} className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-all">
        <Heart className={`w-4 h-4 ${wished ? 'fill-red-500 text-red-500' : ''}`} />
      </button>
      <div className="aspect-square bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] relative flex items-center justify-center overflow-hidden">
        {img ? (
          <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span className="text-6xl font-black text-black/10">{product.name.charAt(0)}</span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 text-[13px] leading-snug line-clamp-2 min-h-[38px]">{product.name}</h3>
        <div className="flex items-center gap-1 mt-2">
          <div className="flex text-primary">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-primary' : ''}`} />
            ))}
          </div>
          <span className="text-[10px] text-gray-500 font-medium">({product.reviews})</span>
        </div>
        <div className="mt-3 flex items-end gap-2 flex-wrap">
          <span className="font-bold text-base">{formatPrice(price)}</span>
          {original > price && <span className="text-gray-400 text-xs line-through">{formatPrice(original)}</span>}
          {discount > 0 && <span className="text-green-600 text-[10px] font-bold">({discount}% OFF)</span>}
        </div>
        <button onClick={handleAdd} className="mt-4 w-full bg-primary text-black font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all">
          <ShoppingCart className="w-4 h-4" /> Add to Cart
        </button>
      </div>
    </motion.div>
  );
}
