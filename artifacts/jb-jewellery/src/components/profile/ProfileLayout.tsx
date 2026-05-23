import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  User, Package, MapPin, Heart, Star, Tag, Clock, Bell, Lock,
  HelpCircle, LogOut, Menu, X, ChevronRight, RotateCcw, Wallet,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getProfileExtras, getNotifications } from '@/lib/userExtras';

const NAV_GROUPS: { label: string; items: { href: string; icon: typeof User; label: string }[] }[] = [
  {
    label: 'Account',
    items: [
      { href: '/profile', icon: User, label: 'My Profile' },
      { href: '/profile/orders', icon: Package, label: 'My Orders' },
      { href: '/profile/returns', icon: RotateCcw, label: 'Returns & Refunds' },
      { href: '/profile/addresses', icon: MapPin, label: 'My Addresses' },
    ],
  },
  {
    label: 'Shopping',
    items: [
      { href: '/profile/wishlist', icon: Heart, label: 'My Wishlist' },
      { href: '/profile/reviews', icon: Star, label: 'My Reviews' },
      { href: '/profile/payments', icon: Wallet, label: 'Payments & Wallet' },
      { href: '/profile/coupons', icon: Tag, label: 'My Coupons' },
      { href: '/profile/recently', icon: Clock, label: 'Recently Viewed' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/profile/notifications', icon: Bell, label: 'Notifications' },
      { href: '/profile/password', icon: Lock, label: 'Change Password' },
      { href: '/profile/help', icon: HelpCircle, label: 'Help & Support' },
    ],
  },
];

export function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [extras, setExtras] = useState(() => getProfileExtras(user?.uid));
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setExtras(getProfileExtras(user?.uid));
    setUnreadCount(getNotifications(user?.uid).filter(n => !n.read).length);
    // Listen for cross-tab / in-app updates
    const handler = () => {
      setExtras(getProfileExtras(user?.uid));
      setUnreadCount(getNotifications(user?.uid).filter(n => !n.read).length);
    };
    window.addEventListener('storage', handler);
    window.addEventListener('jb-profile-updated', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('jb-profile-updated', handler);
    };
  }, [user?.uid]);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      window.location.href = '/';
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User card */}
      <div className="p-5 bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] rounded-2xl mb-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 mb-1 relative">
          {extras.avatarDataUrl ? (
            <img src={extras.avatarDataUrl} alt={user?.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-primary/40 flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-black font-black text-lg flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm truncate">{user?.name}</p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 space-y-3 overflow-y-auto -mx-1 px-1">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label }) => {
                const active = location === href;
                const isNotifs = href === '/profile/notifications';
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
                    <span className="flex-1">{label}</span>
                    {isNotifs && unreadCount > 0 && (
                      <span className="text-[10px] font-black bg-red-500 text-white rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                    {active && <ChevronRight className="w-3.5 h-3.5" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-24 max-h-[calc(100vh-7rem)]">
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
