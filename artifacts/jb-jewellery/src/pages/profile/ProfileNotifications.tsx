import React, { useEffect, useState } from 'react';
import {
  Bell, Save, CheckCircle, Package, Tag, Truck, Wallet,
  CheckCheck, Trash2, MessageCircle,
} from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { useAuth } from '@/context/AuthContext';
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  clearNotifications, NotifKind, Notification,
} from '@/lib/userExtras';

const EMAIL_PREFS_KEY = 'jb-notification-prefs';

const EMAIL_OPTIONS = [
  { key: 'orderConfirm', label: 'Order Confirmation', desc: 'Get notified when your order is placed' },
  { key: 'orderStatus', label: 'Order Status Updates', desc: 'Confirmed, Shipped, Delivered alerts' },
  { key: 'delivery', label: 'Delivery Notification', desc: 'Know when your order arrives' },
  { key: 'refund', label: 'Refund & Return Alerts', desc: 'Updates on returns and refund processing' },
  { key: 'promo', label: 'Promotional Offers', desc: 'Exclusive deals and discount codes' },
  { key: 'newArrivals', label: 'New Arrivals', desc: 'Be the first to know about new products' },
];

const WA_OPTIONS = [
  { key: 'waOrder', label: 'Order Confirmation', desc: 'WhatsApp message on order placement' },
  { key: 'waShipping', label: 'Shipping Updates', desc: 'Track your package via WhatsApp' },
  { key: 'waOffers', label: 'Offers & Deals', desc: 'Receive exclusive offers on WhatsApp' },
];

const KIND_META: Record<NotifKind, { icon: typeof Bell; bg: string; color: string }> = {
  order:    { icon: Package,      bg: 'bg-blue-50',   color: 'text-blue-600' },
  offer:    { icon: Tag,          bg: 'bg-pink-50',   color: 'text-pink-600' },
  delivery: { icon: Truck,        bg: 'bg-purple-50', color: 'text-purple-600' },
  refund:   { icon: Wallet,       bg: 'bg-green-50',  color: 'text-green-600' },
  support:  { icon: MessageCircle, bg: 'bg-yellow-50', color: 'text-yellow-700' },
};

function getPrefs() {
  try {
    const raw = localStorage.getItem(EMAIL_PREFS_KEY);
    const defaults = Object.fromEntries([...EMAIL_OPTIONS, ...WA_OPTIONS].map(o => [o.key, true]));
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return Object.fromEntries([...EMAIL_OPTIONS, ...WA_OPTIONS].map(o => [o.key, true]));
  }
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function ProfileNotifications() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(getPrefs);
  const [saved, setSaved] = useState(false);
  const [feed, setFeed] = useState<Notification[]>([]);
  const [tab, setTab] = useState<'feed' | 'settings'>('feed');

  useEffect(() => {
    setFeed(getNotifications(user?.uid));
  }, [user]);

  const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    localStorage.setItem(EMAIL_PREFS_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const onRead = (id: string) => {
    if (!user) return;
    markNotificationRead(user.uid, id);
    setFeed(getNotifications(user.uid));
    window.dispatchEvent(new Event('jb-profile-updated'));
  };

  const onMarkAll = () => {
    if (!user) return;
    markAllNotificationsRead(user.uid);
    setFeed(getNotifications(user.uid));
    window.dispatchEvent(new Event('jb-profile-updated'));
  };

  const onClear = () => {
    if (!user) return;
    if (!confirm('Clear all notifications?')) return;
    clearNotifications(user.uid);
    setFeed([]);
    window.dispatchEvent(new Event('jb-profile-updated'));
  };

  const unread = feed.filter(n => !n.read).length;

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Notifications</h1>
            <p className="text-xs text-gray-500 mt-0.5">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('feed')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${tab === 'feed' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Inbox {unread > 0 && <span className="ml-1.5 bg-red-500 text-white text-[10px] rounded-full px-1.5">{unread}</span>}
          </button>
          <button onClick={() => setTab('settings')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${tab === 'settings' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Preferences
          </button>
        </div>

        {tab === 'feed' && (
          <>
            {feed.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <Bell className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                <p className="font-bold text-gray-600">No notifications yet</p>
                <p className="text-gray-400 text-sm mt-1">We'll notify you about orders, offers and more.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 justify-end">
                  {unread > 0 && (
                    <button onClick={onMarkAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                  <button onClick={onClear}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 className="w-3.5 h-3.5" /> Clear all
                  </button>
                </div>
                <div className="space-y-2">
                  {feed.map(n => {
                    const km = KIND_META[n.kind];
                    const Icon = km.icon;
                    return (
                      <button key={n.id} onClick={() => onRead(n.id)}
                        className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-all ${n.read ? 'bg-white border-gray-100' : 'bg-yellow-50/50 border-yellow-100'} hover:shadow-sm`}>
                        <span className={`w-10 h-10 rounded-xl ${km.bg} flex items-center justify-center ${km.color} flex-shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-gray-900 truncate">{n.title}</p>
                            <span className="text-[10px] font-semibold text-gray-400 flex-shrink-0">{relTime(n.createdAt)}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'settings' && (
          <>
            {saved && (
              <div className="px-4 py-3 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Preferences saved!
              </div>
            )}

            {/* Email */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center"><Bell className="w-4 h-4 text-blue-600" /></div>
                <h3 className="font-bold text-gray-800">Email Notifications</h3>
              </div>
              <div className="space-y-3">
                {EMAIL_OPTIONS.map(o => (
                  <div key={o.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{o.label}</p>
                      <p className="text-xs text-gray-400">{o.desc}</p>
                    </div>
                    <button onClick={() => toggle(o.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs[o.key] ? 'bg-primary' : 'bg-gray-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${prefs[o.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center"><span className="text-green-600 font-bold text-sm">WA</span></div>
                <h3 className="font-bold text-gray-800">WhatsApp Notifications</h3>
              </div>
              <div className="space-y-3">
                {WA_OPTIONS.map(o => (
                  <div key={o.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{o.label}</p>
                      <p className="text-xs text-gray-400">{o.desc}</p>
                    </div>
                    <button onClick={() => toggle(o.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs[o.key] ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${prefs[o.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSave} className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all">
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </>
        )}
      </div>
    </ProfileLayout>
  );
}
