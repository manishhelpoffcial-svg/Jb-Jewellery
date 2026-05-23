import React, { useState } from 'react';
import { Tag, Copy, CheckCircle } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';

const COUPONS = [
  { code: 'JBFIRST', type: 'percentage', value: 50, minOrder: 299, maxDiscount: 200, expiry: '2025-12-31', status: 'valid' as const },
  { code: 'FLAT100', type: 'flat', value: 100, minOrder: 599, maxDiscount: 100, expiry: '2025-06-30', status: 'valid' as const },
  { code: 'WELCOME20', type: 'percentage', value: 20, minOrder: 199, maxDiscount: 150, expiry: '2025-12-31', status: 'valid' as const },
];

export default function ProfileCoupons() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const isExpired = (expiry: string) => new Date(expiry) < new Date();

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black text-gray-900">My Coupons</h1>

        {COUPONS.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Tag className="w-14 h-14 mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-600">No coupons available</p>
            <p className="text-gray-400 text-sm mt-1">Exclusive coupons will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COUPONS.map(c => {
              const expired = isExpired(c.expiry);
              return (
                <div key={c.code} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${expired ? 'border-gray-100 opacity-60' : 'border-primary/30'}`}>
                  {/* Dashed border top */}
                  <div className={`h-2 ${expired ? 'bg-gray-200' : 'bg-primary'}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xl font-black font-mono tracking-wide text-gray-900">{c.code}</p>
                        <p className="text-sm font-semibold text-gray-600 mt-0.5">
                          {c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                          {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${expired ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                        {expired ? 'EXPIRED' : 'VALID'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">Min order: ₹{c.minOrder}</p>
                    <p className="text-xs text-gray-400 mb-4">Valid till: {new Date(c.expiry).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                    {!expired && (
                      <button onClick={() => handleCopy(c.code)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 hover:bg-primary/20 text-yellow-800 font-bold rounded-xl text-sm transition-all">
                        {copied === c.code ? <><CheckCircle className="w-4 h-4 text-green-600" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}
