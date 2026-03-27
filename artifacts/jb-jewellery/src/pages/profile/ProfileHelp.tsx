import React, { useState } from 'react';
import { MessageCircle, Mail, ChevronDown, ChevronUp, Instagram, Phone } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { openWhatsApp } from '@/lib/orders';

const FAQS = [
  { q: 'How do I place an order?', a: 'Browse our collection, add products to your cart, then go to checkout. Fill in your delivery address and confirm your order. You\'ll receive a confirmation email immediately.' },
  { q: 'How do I track my order?', a: 'Go to My Profile → My Orders to see the real-time status of all your orders. You will also receive email updates for each status change.' },
  { q: 'What is the return & refund policy?', a: 'We accept returns within 7 days of delivery for defective or wrong items. Contact us via WhatsApp or email with your order ID and photos for a quick resolution.' },
  { q: 'What is the delivery time?', a: 'Orders are typically delivered within 5–7 business days. You will receive a shipping notification once your order is dispatched.' },
  { q: 'How do I use a coupon?', a: 'Enter your coupon code in the "Apply Coupon" field at checkout. The discount will be automatically applied to your order total.' },
  { q: 'What payment methods are accepted?', a: 'We accept all major UPI apps (PhonePe, Google Pay, Paytm), net banking, debit/credit cards, and Cash on Delivery for orders above ₹299.' },
];

export default function ProfileHelp() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black text-gray-900">Help & Support</h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => openWhatsApp('Hi! I need help with my JB Jewellery order.')}
            className="flex items-center gap-4 bg-[#25D366] text-white p-5 rounded-2xl hover:bg-[#22c55e] transition-all text-left">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-base">WhatsApp Us</p>
              <p className="text-white/80 text-sm">Usually replies in minutes</p>
            </div>
          </button>
          <a href="mailto:manish@grafxcore.in"
            className="flex items-center gap-4 bg-white border border-gray-100 shadow-sm text-gray-800 p-5 rounded-2xl hover:bg-gray-50 transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="font-bold text-base">Email Us</p>
              <p className="text-gray-500 text-sm">manish@grafxcore.in</p>
            </div>
          </a>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-800">Frequently Asked Questions</h3>
          </div>
          <div>
            {FAQS.map((faq, i) => (
              <div key={i} className="border-b border-gray-50 last:border-0">
                <button onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-semibold text-gray-800 pr-4">{faq.q}</span>
                  {open === i ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {open === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">+91 74329 20601</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">manish@grafxcore.in</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Instagram className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">@jbjewellerycollection</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">Business Hours: Mon–Sat, 10 AM – 7 PM</span>
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}
