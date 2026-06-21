import React, { useState, useEffect, useRef } from 'react';
import {
  User, Edit3, Save, X, Package, Heart, Star, IndianRupee,
  ShieldCheck, BadgeCheck, Camera, Cake, Gift, Lock,
} from 'lucide-react';
import { Link } from 'wouter';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { getAllOrders } from '@/lib/orders';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice } from '@/lib/utils';
import { getProfileExtras, setProfileExtras } from '@/lib/userExtras';

const MAX_AVATAR_BYTES = 800 * 1024; // 800kB

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { wishlistIds } = useWishlist();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [extras, setExtras] = useState(() => getProfileExtras(user?.uid));
  const [dob, setDob] = useState(extras.dob || '');
  const [anniversary, setAnniversary] = useState(extras.anniversary || '');
  const [avatar, setAvatar] = useState(extras.avatarDataUrl || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [stats, setStats] = useState({ orders: 0, spent: 0, reviews: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    const e = getProfileExtras(user?.uid);
    setExtras(e);
    setDob(e.dob || '');
    setAnniversary(e.anniversary || '');
    setAvatar(e.avatarDataUrl || '');
  }, [user]);

  useEffect(() => {
    Promise.all([getAllOrders(), api.reviews.my()])
      .then(([orders, { reviews }]) => {
        const spent = orders.reduce((s, o) => s + o.grandTotal, 0);
        setStats({ orders: orders.length, spent, reviews: reviews.length });
      })
      .catch(() => {});
  }, []);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const handlePickAvatar = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith('image/')) {
      showMsg('Please select an image file', false);
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      showMsg('Image must be smaller than 800kB', false);
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      setAvatar(url);
      setProfileExtras(user.uid, { avatarDataUrl: url });
      window.dispatchEvent(new Event('jb-profile-updated'));
      showMsg('Profile picture updated');
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'Could not upload image', false);
    }
  };

  const removeAvatar = () => {
    if (!user) return;
    setAvatar('');
    setProfileExtras(user.uid, { avatarDataUrl: undefined });
    window.dispatchEvent(new Event('jb-profile-updated'));
  };

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    try {
      await api.auth.updateProfile({ name: name.trim(), phone: phone.trim() }).catch(() => {});
      setProfileExtras(user.uid, { dob, anniversary });
      window.dispatchEvent(new Event('jb-profile-updated'));
      showMsg('Profile updated successfully!');
      setEditing(false);
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to update', false);
    } finally {
      setSaving(false);
    }
  };

  const STATS = [
    { icon: Package, label: 'Total Orders', value: stats.orders, color: 'bg-blue-50 text-blue-600' },
    { icon: IndianRupee, label: 'Total Spent', value: formatPrice(stats.spent), color: 'bg-green-50 text-green-600' },
    { icon: Heart, label: 'Wishlist Items', value: wishlistIds.length, color: 'bg-pink-50 text-pink-600' },
    { icon: Star, label: 'Reviews Given', value: stats.reviews, color: 'bg-yellow-50 text-yellow-600' },
  ];

  const fmtDate = (s?: string) =>
    s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Not added';

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all text-sm">
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
            <div className="relative group">
              {avatar ? (
                <img src={avatar} alt={user?.name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-primary/40" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#FFC200] flex items-center justify-center text-black font-black text-4xl">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                title="Upload photo"
                className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all border-2 border-white"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePickAvatar(f);
                  e.target.value = '';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-gray-900 truncate">{user?.name}</h2>
              <p className="text-gray-500 text-sm truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-primary/20 text-yellow-700 px-3 py-1 rounded-full">
                  {user?.role === 'admin' ? <><ShieldCheck className="w-3 h-3" /> Admin</> : <><BadgeCheck className="w-3 h-3" /> Member</>}
                </span>
                {avatar && (
                  <button onClick={removeAvatar}
                    className="text-[11px] text-gray-400 hover:text-red-500 underline-offset-2 hover:underline">
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Phone Number</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 ..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Date of Birth</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Anniversary <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="date" value={anniversary} onChange={e => setAnniversary(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email Address</label>
                <input value={user?.email} disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => {
                  setEditing(false);
                  setName(user?.name || '');
                  setPhone(user?.phone || '');
                  setDob(extras.dob || '');
                  setAnniversary(extras.anniversary || '');
                }} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2 disabled:opacity-70">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Full Name', value: user?.name, icon: User },
                { label: 'Email Address', value: user?.email, icon: User },
                { label: 'Phone Number', value: user?.phone || 'Not added', icon: User },
                { label: 'Date of Birth', value: fmtDate(extras.dob), icon: Cake },
                { label: 'Anniversary', value: fmtDate(extras.anniversary), icon: Gift },
                { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—', icon: BadgeCheck },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-gray-300" /> {label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
                </div>
              ))}
            </div>
          )}

          {!editing && (
            <Link href="/profile/password"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-black bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-xl transition-all">
              <Lock className="w-4 h-4" /> Change Password
            </Link>
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
