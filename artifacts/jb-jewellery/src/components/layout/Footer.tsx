import React from 'react';
import { Facebook, Instagram, Mail, Phone, MapPin, Star, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t-4 border-primary">

      {/* Google Reviews Banner */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-b border-primary/20 py-5">
        <div className="container mx-auto px-4">
          <a
            href="https://share.google/6dyMN84wnsBzK2FbT"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 group"
          >
            {/* Google logo + rating */}
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 48 48" className="w-7 h-7 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              <div>
                <div className="text-xs text-gray-500 font-medium leading-none mb-0.5">Google Rating</div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xl text-gray-900 leading-none">4.8</span>
                  <div className="flex">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden sm:block w-px h-10 bg-primary/30" />

            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 group-hover:text-black transition-colors">
              <span>Read our customer reviews on Google</span>
              <ExternalLink className="w-4 h-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </a>
        </div>
      </div>

      {/* Main Footer Body */}
      <div className="bg-white pt-14 pb-8">
        <div className="container mx-auto px-4">

          {/* Logo + Brand section with 3D Bubble */}
          <div className="flex flex-col items-center mb-14">
            {/* 3D Bubble Logo */}
            <div className="relative mb-4 group">
              {/* Outer glow rings */}
              <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-primary/30 via-yellow-200/20 to-primary/10 blur-xl animate-pulse" />
              <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/40 to-yellow-100/60 blur-md" />
              {/* 3D bubble shell */}
              <div
                className="relative w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #FFF9C4 40%, #FFD700 80%, #D4A800 100%)',
                  boxShadow: '0 8px 32px rgba(255,215,0,0.6), 0 2px 8px rgba(0,0,0,0.12), inset 0 -4px 12px rgba(180,140,0,0.3), inset 0 4px 12px rgba(255,255,255,0.7)',
                }}
              >
                {/* Bubble highlight */}
                <div className="absolute top-3 left-4 w-6 h-4 rounded-full bg-white/70 blur-sm rotate-[-20deg]" />
                <img
                  src={`${import.meta.env.BASE_URL}images/jb-logo.png`}
                  alt="JB Jewellery Collection"
                  className="w-20 h-20 object-contain drop-shadow-md relative z-10"
                />
              </div>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-gray-900 mt-1">JB <span className="text-primary">Jewellery</span> Collection</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-sm text-center">Premium fashion & artificial jewellery designed to make you sparkle every day.</p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 pb-12 border-b border-gray-100">

            {/* Contact */}
            <div>
              <h3 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-wider border-b-2 border-primary pb-2 inline-block">Contact</h3>
              <ul className="space-y-3 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  <span>Surat, Gujarat, India</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0 text-primary" />
                  <a href="tel:+919999999999" className="hover:text-primary transition-colors">+91 99999 99999</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0 text-primary" />
                  <a href="mailto:hello@jbjewellery.com" className="hover:text-primary transition-colors">hello@jbjewellery.com</a>
                </li>
              </ul>
            </div>

            {/* Explore */}
            <div>
              <h3 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-wider border-b-2 border-primary pb-2 inline-block">Explore</h3>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="#" className="hover:text-primary transition-colors">Shop All</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Bestsellers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Combo Deals</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Gift Hampers</a></li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h3 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-wider border-b-2 border-primary pb-2 inline-block">Policies & Help</h3>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Return & Exchange</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Track Order</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-wider border-b-2 border-primary pb-2 inline-block">Stay Updated</h3>
              <p className="text-sm text-gray-500 mb-3">Get new arrivals & exclusive offers straight to your inbox.</p>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:border-primary transition-colors">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2.5 text-sm outline-none bg-white text-gray-800 placeholder-gray-400"
                />
                <button className="bg-primary text-black font-bold px-4 text-sm hover:bg-yellow-400 transition-colors">
                  →
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Support: Mon – Sat · 10:30am – 5:30pm</p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">© 2025 JB Jewellery Collection. All Rights Reserved.</p>

            <div className="flex items-center gap-3">
              <a
                href="https://share.google/6dyMN84wnsBzK2FbT"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-gray-700 font-semibold text-xs px-3 py-2 rounded-full transition-colors"
              >
                <svg viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Rate us on Google
              </a>

              <a href="#" className="w-9 h-9 rounded-full bg-gray-50 hover:bg-primary flex items-center justify-center text-gray-500 hover:text-black transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-50 hover:bg-primary flex items-center justify-center text-gray-500 hover:text-black transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
