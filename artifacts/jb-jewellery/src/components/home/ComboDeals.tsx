import React from 'react';
import { ArrowRight } from 'lucide-react';

const banners = [
  { img: 'hero-banner-3.png', title: 'Buy Any 6 @ ₹499 + Flat 10% Off' },
  { img: 'hero-banner-4.png', title: 'Buy Any 8 @ ₹597 + Flat 10% Off' },
  { img: 'hero-banner-5.png', title: 'Buy Any 10 @ ₹999 + Free Gift' },
];

export function ComboDeals() {
  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-black text-center mb-10">Unbeatable Combo Deals 🔥</h2>
        
        <div className="space-y-6 max-w-4xl mx-auto">
          {banners.map((banner, i) => (
            <div 
              key={i} 
              className="relative w-full h-[140px] sm:h-[200px] rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all border border-gray-100"
            >
              <img 
                src={`${import.meta.env.BASE_URL}images/${banner.img}`} 
                alt={banner.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.classList.add('bg-black', 'flex', 'items-center', 'p-8');
                  e.currentTarget.parentElement!.innerHTML = `
                    <h3 class="text-white text-2xl sm:text-4xl font-black tracking-wide w-2/3">${banner.title.toUpperCase()}</h3>
                  `;
                }}
              />
              
              {/* Optional overlay button if images don't have buttons painted in */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-end pr-8 sm:pr-12">
                <button className="hidden sm:flex bg-primary text-black font-bold py-3 px-6 rounded-full items-center gap-2 transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all shadow-lg">
                  Shop Combo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
