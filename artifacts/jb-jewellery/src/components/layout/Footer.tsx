import React, { useState } from 'react';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, Loader2, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

export function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      await api.subscribers.subscribe(email.trim());
      setStatus('success');
      setEmail('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setErrorMsg(msg.includes('already') ? 'You are already subscribed!' : 'Failed to subscribe. Try again.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Newsletter Banner */}
        <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2D2D2D] rounded-2xl px-6 py-8 md:px-10 md:py-10 mb-14 text-center md:text-left flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="flex-1">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Newsletter</p>
            <h3 className="text-xl md:text-2xl font-black text-white mb-1">Stay in the Sparkle Loop</h3>
            <p className="text-gray-400 text-sm">New arrivals, restock alerts & exclusive deals — straight to your inbox.</p>
          </div>
          <div className="w-full md:w-auto md:min-w-[340px]">
            {status === 'success' ? (
              <div className="flex items-center justify-center md:justify-start gap-2 text-green-400 font-semibold">
                <CheckCircle className="w-5 h-5" />
                <span>You're subscribed! Welcome aboard.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 min-w-0 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-5 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors text-sm whitespace-nowrap disabled:opacity-70 flex items-center gap-1.5"
                >
                  {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Subscribe
                </button>
              </form>
            )}
            {status === 'error' && <p className="text-red-400 text-xs mt-2">{errorMsg}</p>}
          </div>
        </div>

        {/* Top brand section */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="bg-primary/10 p-6 rounded-full mb-4">
            <span className="text-4xl font-black tracking-tight text-black">JB</span>
          </div>
          <h2 className="text-xl font-bold text-primary uppercase tracking-widest mb-2">Jewellery Collection</h2>
          <p className="text-gray-500 max-w-md text-sm">
            Premium fashion &amp; artificial jewellery designed to make you sparkle every day.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-black transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-black transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-black transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 border-t border-gray-50 pt-12">
          <div>
            <h3 className="font-bold mb-4 text-black">About JB</h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              We bring you the finest collection of fashion jewellery. Handpicked designs that blend tradition with modern aesthetics.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-black">Quick Links</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a href="#" className="hover:text-primary transition-colors">Track Order</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Return &amp; Exchange</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-black">Shop By Category</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a href="#" className="hover:text-primary transition-colors">Elegant Earrings</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Statement Necklaces</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Trendy Bracelets</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Bridal Combos</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-black">Contact Us</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>123 Jewellery Lane, Fashion District, Mumbai 400001</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span>+91 99999 99999</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>hello@jbjewellery.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="text-center pt-8 border-t border-gray-100 text-sm text-gray-400 font-medium">
          © 2025 JB Jewellery Collection. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
