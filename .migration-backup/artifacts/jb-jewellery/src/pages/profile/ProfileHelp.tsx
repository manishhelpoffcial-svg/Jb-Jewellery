import React, { useEffect, useState } from 'react';
import {
  MessageCircle, Mail, ChevronDown, ChevronUp, Instagram, Phone,
  Plus, Send, CheckCircle, Clock, X as XIcon, Ticket as TicketIcon,
} from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { openWhatsApp } from '@/lib/orders';
import { useAuth } from '@/context/AuthContext';
import { addTicket, getTickets, SupportTicket } from '@/lib/userExtras';

const FAQS = [
  { q: 'How do I place an order?', a: 'Browse our collection, add products to your cart, then go to checkout. Fill in your delivery address and confirm your order. You\'ll receive a confirmation email immediately.' },
  { q: 'How do I track my order?', a: 'Go to My Profile → My Orders to see the real-time status of all your orders. You will also receive email updates for each status change.' },
  { q: 'What is the return & refund policy?', a: 'We accept returns within 7 days of delivery for defective or wrong items. Contact us via WhatsApp or email with your order ID and photos for a quick resolution.' },
  { q: 'What is the delivery time?', a: 'Orders are typically delivered within 5–7 business days. You will receive a shipping notification once your order is dispatched.' },
  { q: 'How do I use a coupon?', a: 'Enter your coupon code in the "Apply Coupon" field at checkout. The discount will be automatically applied to your order total.' },
  { q: 'What payment methods are accepted?', a: 'We accept all major UPI apps (PhonePe, Google Pay, Paytm), net banking, debit/credit cards, and Cash on Delivery for orders above ₹299.' },
];

export default function ProfileHelp() {
  const { user } = useAuth();
  const [open, setOpen] = useState<number | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('order');
  const [message, setMessage] = useState('');
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) setTickets(getTickets(user.uid));
  }, [user]);

  const submitTicket = () => {
    if (!user) return;
    if (!subject.trim() || !message.trim()) return;
    addTicket(user.uid, { orderId: orderId.trim() || undefined, subject: subject.trim(), category, message: message.trim() });
    setTickets(getTickets(user.uid));
    setSubject(''); setMessage(''); setOrderId(''); setCategory('order');
    setShowForm(false);
    setSubmitMsg('Ticket raised! Our team will respond within 24 hours.');
    setTimeout(() => setSubmitMsg(null), 4000);
  };

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black text-gray-900">Help & Support</h1>

        {submitMsg && (
          <div className="px-4 py-3 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {submitMsg}
          </div>
        )}

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

        {/* My Tickets */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <TicketIcon className="w-4 h-4 text-yellow-600" /> My Tickets
            </h3>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-black font-bold rounded-xl text-xs hover:bg-yellow-400 transition-all">
              <Plus className="w-3 h-3" /> Raise a Ticket
            </button>
          </div>
          {tickets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No tickets raised yet. Need help with an order? Open one above.</p>
          ) : (
            <div className="space-y-2">
              {tickets.map(t => {
                const statusMeta = t.status === 'open'
                  ? { label: 'Open', icon: Clock, color: 'bg-yellow-50 text-yellow-700' }
                  : t.status === 'in_progress'
                  ? { label: 'In Progress', icon: Send, color: 'bg-blue-50 text-blue-700' }
                  : { label: 'Resolved', icon: CheckCircle, color: 'bg-green-50 text-green-700' };
                const Icon = statusMeta.icon;
                return (
                  <div key={t.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{t.subject}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          #{t.id.slice(0, 8).toUpperCase()}
                          {t.orderId ? ` · Order ${t.orderId}` : ''} · {new Date(t.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${statusMeta.color} px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0`}>
                        <Icon className="w-3 h-3" /> {statusMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{t.message}</p>
                  </div>
                );
              })}
            </div>
          )}
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

      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-lg flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-yellow-600" /> Raise a Ticket
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value as SupportTicket['category'])}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary">
                  <option value="order">Order Issue</option>
                  <option value="payment">Payment / Refund</option>
                  <option value="delivery">Delivery</option>
                  <option value="product">Product Quality</option>
                  <option value="account">Account</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Order ID <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="JB2026-1234"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Subject *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief summary of your issue"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Describe your issue *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                  placeholder="Provide as much detail as possible so we can help quickly..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Our support team typically responds within 24 hours. For urgent matters, message us on WhatsApp.
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={submitTicket} disabled={!subject.trim() || !message.trim()}
                  className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2 disabled:opacity-60">
                  <Send className="w-4 h-4" /> Submit
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </ProfileLayout>
  );
}
