import React, { useState } from 'react';
import { Bell, Save, CheckCircle } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';

const EMAIL_PREFS_KEY = 'jb-notification-prefs';

const EMAIL_OPTIONS = [
  { key: 'orderConfirm', label: 'Order Confirmation', desc: 'Get notified when your order is placed' },
  { key: 'orderStatus', label: 'Order Status Updates', desc: 'Confirmed, Shipped, Delivered alerts' },
  { key: 'delivery', label: 'Delivery Notification', desc: 'Know when your order arrives' },
  { key: 'promo', label: 'Promotional Offers', desc: 'Exclusive deals and discount codes' },
  { key: 'newArrivals', label: 'New Arrivals', desc: 'Be the first to know about new products' },
];

const WA_OPTIONS = [
  { key: 'waOrder', label: 'Order Confirmation', desc: 'WhatsApp message on order placement' },
  { key: 'waShipping', label: 'Shipping Updates', desc: 'Track your package via WhatsApp' },
  { key: 'waOffers', label: 'Offers & Deals', desc: 'Receive exclusive offers on WhatsApp' },
];

function getPrefs() {
  const raw = localStorage.getItem(EMAIL_PREFS_KEY);
  const defaults = Object.fromEntries([...EMAIL_OPTIONS, ...WA_OPTIONS].map(o => [o.key, true]));
  return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
}

export default function ProfileNotifications() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(getPrefs);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    localStorage.setItem(EMAIL_PREFS_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black text-gray-900">Notification Settings</h1>

        {saved && (
          <div className="px-4 py-3 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Preferences saved!</div>
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
      </div>
    </ProfileLayout>
  );
}
