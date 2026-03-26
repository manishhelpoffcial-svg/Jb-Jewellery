import React from 'react';
import { Search, Heart, ShoppingCart, User, Menu } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

const NAV_LINKS = [
  "Home", "New Arrivals", "Earrings", "Necklaces", "Chokers", 
  "Bracelets", "Rings", "Anklets", "Hair Accessories", "Combo Deals", "Sale 🔥"
];

export function Navbar() {
  const [location] = useLocation();
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlistIds } = useWishlist();

  return (
    <header className="sticky top-0 z-40 bg-white w-full border-b border-gray-100 shadow-sm">
      {/* Top Row */}
      <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-4">
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-3 md:w-1/4">
          <button className="md:hidden p-1 text-gray-700 hover:text-black">
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex flex-col items-start cursor-pointer group">
            <span className="text-2xl md:text-3xl font-black leading-none tracking-tight group-hover:opacity-80 transition-opacity">JB</span>
            <span className="text-[10px] md:text-xs text-primary font-bold tracking-widest uppercase">Jewellery Collection</span>
          </Link>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-2xl relative">
          <input 
            type="text" 
            placeholder="Search for jewellery..." 
            className="w-full pl-5 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <button className="absolute right-1 top-1 bottom-1 bg-primary text-primary-foreground px-4 rounded-full flex items-center justify-center hover:bg-yellow-400 transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Icons */}
        <div className="flex items-center justify-end gap-5 md:w-1/4">
          <button className="hidden sm:flex flex-col items-center gap-1 text-gray-600 hover:text-black transition-colors">
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Account</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-black transition-colors relative">
            <Heart className="w-5 h-5" />
            <span className="hidden sm:block text-[10px] font-medium">Wishlist</span>
            {wishlistIds.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 sm:top-0 sm:right-1 bg-primary text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {wishlistIds.length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-black transition-colors relative"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:block text-[10px] font-medium">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 sm:top-0 sm:right-0 bg-primary text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Nav Row */}
      <div className="border-t border-gray-50 overflow-x-auto hide-scrollbar">
        <nav className="container mx-auto px-4 flex items-center gap-6 sm:gap-8 min-w-max">
          {NAV_LINKS.map((link) => (
            <Link 
              key={link} 
              href="#" 
              className={`py-3 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors
                ${link === 'Home' ? 'border-primary text-black' : 'border-transparent text-gray-600 hover:text-black hover:border-primary/50'}`}
            >
              {link}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
