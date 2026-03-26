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

      <div className="flex flex-col gap-6 px-4 lg:px-8">
        {banners.map((banner, i) => (
          <React.Fragment key={i}>
            <Link href="/products?combo=true">
              <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm cursor-pointer group">
                <img
                  src={`${import.meta.env.BASE_URL}images/${banner.img}`}
                  alt={banner.title}
                  className="w-full h-auto block"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.classList.add('bg-black', 'flex', 'items-center', 'p-8', 'min-h-[140px]');
                    e.currentTarget.parentElement!.innerHTML = `
                      <h3 class="text-white text-2xl sm:text-4xl font-black tracking-wide w-2/3">${banner.title.toUpperCase()}</h3>
                    `;
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
              </div>
            </Link>
            {i < banners.length - 1 && (
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300 font-semibold tracking-widest uppercase">More Deals</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
