import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { User, Package, MapPin, Heart, Star, Tag, Clock, Bell, Lock, HelpCircle, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const NAV_ITEMS = [
  { href: '/profile', icon: User, label: 'My Profile' },
  { href: '/profile/orders', icon: Package, label: 'My Orders' },
  { href: '/profile/addresses', icon: MapPin, label: 'My Addresses' },
  { href: '/profile/wishlist', icon: Heart, label: 'My Wishlist' },
  { href: '/profile/reviews', icon: Star, label: 'My Reviews' },
  { href: '/profile/coupons', icon: Tag, label: 'My Coupons' },
  { href: '/profile/recently', icon: Clock, label: 'Recently Viewed' },
  { href: '/profile/notifications', icon: Bell, label: 'Notifications' },
  { href: '/profile/password', icon: Lock, label: 'Change Password' },
  { href: '/profile/help', icon: HelpCircle, label: 'Help & Support' },
];

export function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      window.location.href = '/';
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User card */}
      <div className="p-5 bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] rounded-2xl mb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-black font-black text-lg flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm truncate">{user?.name}</p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = location === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-primary text-black font-bold shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-black'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="pt-3 mt-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-24">
              <SidebarContent />
            </div>
          </aside>

          {/* Mobile sidebar toggle */}
          <div className="lg:hidden fixed bottom-6 right-6 z-50">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-14 h-14 bg-primary text-black rounded-full shadow-xl flex items-center justify-center"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile sidebar drawer */}
          {sidebarOpen && (
            <>
              <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
              <div className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 p-5 overflow-y-auto lg:hidden shadow-2xl">
                <SidebarContent />
              </div>
            </>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
