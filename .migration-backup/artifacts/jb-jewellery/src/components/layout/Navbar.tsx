import React, { useState } from 'react';
import { Search, Heart, ShoppingCart, User, Menu, X, LogOut, Package, ShieldCheck, Home, Tag, MapPin, RotateCcw, Star, CreditCard, Ticket, Clock, HelpCircle, Bell, Lock } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "New Arrivals", href: "/products?category=New Arrivals" },
  { label: "Earrings", href: "/products?category=Earrings" },
  { label: "Necklaces", href: "/products?category=Necklaces" },
  { label: "Chokers", href: "/products?category=Chokers" },
  { label: "Bracelets", href: "/products?category=Bracelets" },
  { label: "Rings", href: "/products?category=Rings" },
  { label: "Anklets", href: "/products?category=Anklets" },
  { label: "Hair Accessories", href: "/products?category=Hair Accessories" },
  { label: "Combo Deals", href: "/products?category=Combo Deals" },
  { label: "Sale", href: "/products?sale=true" },
];

export function Navbar() {
  const [location] = useLocation();
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlistIds } = useWishlist();
  const { user, openAuthModal, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white w-full border-b border-gray-100 shadow-sm">
      {/* Top Row */}
      <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
        {/* Mobile Menu Button & Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 text-gray-700 hover:text-black shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex flex-col items-start cursor-pointer group shrink-0">
            <span className="text-2xl md:text-3xl font-black leading-none tracking-tight group-hover:opacity-80 transition-opacity">JB</span>
            <span className="text-[10px] md:text-xs text-primary font-bold tracking-widest uppercase">Jewellery Collection</span>
          </Link>
        </div>

        {/* Search Bar - Desktop only */}
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

        {/* Icons Row */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 relative">

          {/* Search icon — mobile only */}
          <button
            onClick={() => setSearchOpen(p => !p)}
            className="md:hidden p-1.5 text-gray-600 hover:text-black transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Account / Login */}
          <div className="relative">
            <button
              onClick={() => user ? setUserMenuOpen(p => !p) : openAuthModal('login')}
              className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-black transition-colors"
              aria-label={user ? 'Account' : 'Login'}
            >
              {user ? (
                <>
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-black text-black">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="hidden sm:block text-[10px] font-medium">{user.name.split(' ')[0]}</span>
                </>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  <span className="hidden sm:block text-[10px] font-medium">Login</span>
                </>
              )}
            </button>

            {/* Desktop User Dropdown */}
            {userMenuOpen && user && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl w-48 py-1 z-20">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-bold text-sm text-gray-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>
                  {user.role === 'admin' && (
                    <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors">
                      <ShieldCheck className="w-3.5 h-3.5" /> Admin Panel
                    </Link>
                  )}
                  <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <User className="w-3.5 h-3.5" /> My Profile
                  </Link>
                  <Link href="/my-orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <Package className="w-3.5 h-3.5" /> My Orders
                  </Link>
                  <Link href="/profile/wishlist" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <Heart className="w-3.5 h-3.5" /> My Wishlist
                  </Link>
                  <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Wishlist */}
          <Link href="/profile/wishlist" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-black transition-colors relative">
            <Heart className="w-5 h-5" />
            <span className="hidden sm:block text-[10px] font-medium">Wishlist</span>
            {wishlistIds.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-black transition-colors relative"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:block text-[10px] font-medium">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar — expands when search icon tapped */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for jewellery..."
              autoFocus
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav Row — desktop */}
      <div className="border-t border-gray-50 overflow-x-auto hide-scrollbar">
        <nav className="container mx-auto px-4 flex items-center gap-6 sm:gap-8 min-w-max">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className={`py-3 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors
                ${(label === 'Home' && location === '/') || location.startsWith(href) && href !== '/'
                  ? 'border-primary text-black'
                  : 'border-transparent text-gray-600 hover:text-black hover:border-primary/50'
                }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
              <span className="text-xl font-black">JB <span className="text-primary">Jewellery</span></span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User section */}
            {user ? (
              <div className="px-5 py-4 border-b bg-primary/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shrink-0">
                    <span className="font-black text-sm text-black">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 border-b shrink-0">
                <button
                  onClick={() => { openAuthModal('login'); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 bg-primary text-black font-bold rounded-xl text-sm mb-2"
                >
                  Login
                </button>
                <button
                  onClick={() => { openAuthModal('register'); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl text-sm"
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto">
              <div className="py-2">
                {NAV_LINKS.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                  >
                    {label === 'Home' ? <Home className="w-4 h-4 shrink-0" /> : <Tag className="w-4 h-4 shrink-0" />}
                    {label}
                  </Link>
                ))}
              </div>

              {/* Account actions — only when logged in */}
              {user && (
                <div className="border-t border-gray-100 py-2">
                  <p className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">My Account</p>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <User className="w-4 h-4 shrink-0" /> My Profile
                  </Link>
                  <Link href="/profile/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Package className="w-4 h-4 shrink-0" /> My Orders
                  </Link>
                  <Link href="/profile/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Heart className="w-4 h-4 shrink-0" /> My Wishlist
                  </Link>
                  <Link href="/profile/addresses" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <MapPin className="w-4 h-4 shrink-0" /> My Addresses
                  </Link>
                  <Link href="/profile/returns" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <RotateCcw className="w-4 h-4 shrink-0" /> Returns &amp; Refunds
                  </Link>
                  <Link href="/profile/reviews" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Star className="w-4 h-4 shrink-0" /> My Reviews
                  </Link>
                  <Link href="/profile/payments" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <CreditCard className="w-4 h-4 shrink-0" /> Payment / Wallet
                  </Link>
                  <Link href="/profile/coupons" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Ticket className="w-4 h-4 shrink-0" /> My Coupons
                  </Link>
                  <Link href="/profile/recently" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Clock className="w-4 h-4 shrink-0" /> Recently Viewed
                  </Link>
                  <Link href="/profile/notifications" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Bell className="w-4 h-4 shrink-0" /> Notifications
                  </Link>
                  <Link href="/profile/help" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <HelpCircle className="w-4 h-4 shrink-0" /> Help &amp; Support
                  </Link>
                  <Link href="/profile/password" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Lock className="w-4 h-4 shrink-0" /> Change Password
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors">
                      <ShieldCheck className="w-4 h-4 shrink-0" /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 shrink-0" /> Logout
                  </button>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
