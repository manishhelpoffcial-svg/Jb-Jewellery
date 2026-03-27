import React, { useState } from 'react';
import { Search, Heart, ShoppingCart, User, Menu, X, LogOut, Package } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';

const NAV_LINKS = [
  "Home", "New Arrivals", "Earrings", "Necklaces", "Chokers", 
  "Bracelets", "Rings", "Anklets", "Hair Accessories", "Combo Deals", "Sale 🔥"
];

export function Navbar() {
  const [location] = useLocation();
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlistIds } = useWishlist();
  const { user, openAuthModal, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white w-full border-b border-gray-100 shadow-sm">
      {/* Top Row */}
      <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-4">
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-3 md:w-1/4">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-1 text-gray-700 hover:text-black">
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
        <div className="flex items-center justify-end gap-4 md:w-1/4 relative">
          {/* Account */}
          <div className="relative">
            <button 
              onClick={() => user ? setUserMenuOpen(p => !p) : openAuthModal('login')}
              className="hidden sm:flex flex-col items-center gap-1 text-gray-600 hover:text-black transition-colors"
            >
              {user ? (
                <>
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-black text-black">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-[10px] font-medium">{user.name.split(' ')[0]}</span>
                </>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Login</span>
                </>
              )}
            </button>

            {/* User dropdown */}
            {userMenuOpen && user && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl w-44 py-1 z-20">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-bold text-sm text-gray-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>
                  {user.role === 'admin' && (
                    <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors">
                      🔑 Admin Panel
                    </Link>
                  )}
                  <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <User className="w-3.5 h-3.5" /> My Profile
                  </Link>
                  <Link href="/my-orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <Package className="w-3.5 h-3.5" /> My Orders
                  </Link>
                  <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
          
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

      {/* Mobile Slide Menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <span className="text-xl font-black">JB <span className="text-primary">Jewellery</span></span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            {user ? (
              <div className="px-5 py-4 border-b bg-primary/5">
                <p className="font-bold text-sm">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            ) : (
              <div className="px-5 py-4 border-b">
                <button onClick={() => { openAuthModal('login'); setMobileMenuOpen(false); }} className="w-full py-2.5 bg-primary text-black font-bold rounded-xl text-sm">Login / Sign Up</button>
              </div>
            )}
            <nav className="flex-1 overflow-y-auto py-4">
              {NAV_LINKS.map(link => (
                <Link key={link} href="#" onClick={() => setMobileMenuOpen(false)} className="block px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">
                  {link}
                </Link>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <Link href="/my-orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Package className="w-4 h-4" /> My Orders
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-primary hover:bg-primary/5">
                    🔑 Admin Panel
                  </Link>
                )}
                {user && (
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-500 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
