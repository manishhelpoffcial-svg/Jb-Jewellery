import React from 'react';
import { Link } from 'wouter';

const banners = [
  { img: 'hero-banner-3.png', title: 'Buy Any 6 @ ₹499 + Flat 10% Off' },
  { img: 'hero-banner-4.png', title: 'Buy Any 8 @ ₹597 + Flat 10% Off' },
  { img: 'hero-banner-5.png', title: 'Buy Any 10 @ ₹999 + Free Gift' },
];

export function ComboDeals() {
  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-black text-center mb-10">Unbeatable Combo Deals 🔥</h2>
      </div>

      <div className="space-y-4 lg:space-y-6">
        {banners.map((banner, i) => (
          <Link key={i} href="/products?combo=true">
            <div className="relative w-full h-[140px] sm:h-[200px] lg:h-[280px] overflow-hidden cursor-pointer group">
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
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
