import React, { useState, useEffect } from 'react';
import { User, Edit3, Save, X, Package, Heart, Star, IndianRupee } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { getAllOrders } from '@/lib/orders';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice } from '@/lib/utils';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const { wishlistIds } = useWishlist();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [stats, setStats] = useState({ orders: 0, spent: 0, reviews: 0 });

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
  }, [user]);

  useEffect(() => {
    Promise.all([
      getAllOrders(),
      api.reviews.my(),
    ]).then(([orders, { reviews }]) => {
      const spent = orders.reduce((s, o) => s + o.grandTotal, 0);
      setStats({ orders: orders.length, spent, reviews: reviews.length });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.auth.updateProfile({ name: name.trim(), phone: phone.trim() });
      setMsg({ text: 'Profile updated successfully!', ok: true });
      setEditing(false);
      // Re-fetch user
      const { user: updated } = await api.auth.me();
      // Update local storage token isn't needed — context re-reads on reload
      // We just show success
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : 'Failed to update', ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const STATS = [
    { icon: Package, label: 'Total Orders', value: stats.orders, color: 'bg-blue-50 text-blue-600' },
    { icon: IndianRupee, label: 'Total Spent', value: formatPrice(stats.spent), color: 'bg-green-50 text-green-600' },
    { icon: Heart, label: 'Wishlist Items', value: wishlistIds.length, color: 'bg-pink-50 text-pink-600' },
    { icon: Star, label: 'Reviews Given', value: stats.reviews, color: 'bg-yellow-50 text-yellow-600' },
  ];

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
          {!editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all text-sm">
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-5 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#FFC200] flex items-center justify-center text-black font-black text-3xl flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">{user?.name}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className="inline-block mt-2 text-xs font-bold bg-primary/20 text-yellow-700 px-3 py-1 rounded-full">
                {user?.role === 'admin' ? '👑 Admin' : '✨ Member'}
              </span>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Phone Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email Address</label>
                <input value={user?.email} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setEditing(false); setName(user?.name || ''); setPhone(user?.phone || ''); }} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2 disabled:opacity-70">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Full Name', value: user?.name },
                { label: 'Email Address', value: user?.email },
                { label: 'Phone Number', value: user?.phone || 'Not added' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </ProfileLayout>
  );
}
