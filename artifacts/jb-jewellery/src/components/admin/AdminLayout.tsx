import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, BarChart2, Settings, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Orders', icon: Package, href: '/admin/orders' },
  { label: 'Products', icon: ShoppingBag, href: '/admin/products' },
  { label: 'Customers', icon: Users, href: '/admin/customers' },
  { label: 'Coupons', icon: Tag, href: '/admin/coupons' },
  { label: 'Analytics', icon: BarChart2, href: '/admin/analytics' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-black text-white z-50 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-2xl font-black leading-none">JB</p>
            <p className="text-[10px] text-primary font-bold tracking-widest uppercase">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(item => {
            const active = location === item.href || (item.href !== '/admin' && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-primary text-black' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          {user && (
            <div className="px-4 py-3 mb-2 bg-white/5 rounded-xl">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-white/50 truncate">{user.email}</p>
            </div>
          )}
          <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b px-4 sm:px-8 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="font-bold text-gray-900">Admin Panel</p>
            <p className="text-xs text-gray-500">Manage your JB Jewellery store</p>
          </div>
          <Link href="/" className="text-xs text-gray-500 hover:text-black font-medium">← View Store</Link>
        </header>

        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
