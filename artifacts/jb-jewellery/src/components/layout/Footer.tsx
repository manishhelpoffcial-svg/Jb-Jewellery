import React from 'react';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Top brand section */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="bg-primary/10 p-6 rounded-full mb-4">
            <span className="text-4xl font-black tracking-tight text-black">JB</span>
          </div>
          <h2 className="text-xl font-bold text-primary uppercase tracking-widest mb-2">Jewellery Collection</h2>
          <p className="text-gray-500 max-w-md text-sm">
            Premium fashion & artificial jewellery designed to make you sparkle every day.
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
              <li><a href="#" className="hover:text-primary transition-colors">Return & Exchange</a></li>
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
