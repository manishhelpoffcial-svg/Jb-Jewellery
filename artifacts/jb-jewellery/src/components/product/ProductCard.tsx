import React from 'react';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { Product } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col group relative"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
        {product.isBestseller && (
          <span className="bg-black text-white text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
            Bestseller
          </span>
        )}
        {product.isNew && (
          <span className="bg-primary text-black text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider shadow-sm">
            New
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button 
        onClick={() => toggleWishlist(product.id)}
        className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-all"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
      </button>

      {/* Image Area */}
      <div className="aspect-square bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] relative flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img
            src={`${import.meta.env.BASE_URL}images/${product.image}`}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-6xl font-black text-black/10 group-hover:scale-110 transition-transform duration-500">
            {product.name.charAt(0)}
          </span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 text-[13px] leading-snug line-clamp-2 min-h-[38px]">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1 mt-2">
          <div className="flex text-primary">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-primary' : ''}`} />
            ))}
          </div>
          <span className="text-[10px] text-gray-500 font-medium">({product.reviews})</span>
        </div>

        <div className="mt-3 flex items-end gap-2 flex-wrap">
          <span className="font-bold text-base">{formatPrice(product.price)}</span>
          <span className="text-gray-400 text-xs line-through">{formatPrice(product.originalPrice)}</span>
          <span className="text-green-600 text-[10px] font-bold">({product.discount}% OFF)</span>
        </div>

        <button 
          onClick={() => addToCart(product)}
          className="mt-4 w-full bg-primary text-black font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-400 hover:shadow-md hover:shadow-primary/20 transition-all active:scale-[0.98]"
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
}
