import React from 'react';
import { Link } from 'wouter';

const budgets = [
  { img: 'under-99.png', label: 'Under ₹99', maxPrice: 99 },
  { img: 'under-199.png', label: 'Under ₹199', maxPrice: 199 },
  { img: 'under-299.png', label: 'Under ₹299', maxPrice: 299 },
  { img: 'under-499.png', label: 'Under ₹499', maxPrice: 499 },
];

export function ShopUnderBudget() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-8 text-center sm:text-left">Shop Under Budget</h2>
      </div>

      <div className="flex gap-0 overflow-x-auto hide-scrollbar pb-6 snap-x lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
        {budgets.map((item, i) => (
          <Link
            key={i}
            href={`/products?maxPrice=${item.maxPrice}`}
            className="w-[280px] sm:w-1/4 shrink-0 snap-start block overflow-hidden group cursor-pointer lg:w-auto"
          >
            <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
              <img
                src={`${import.meta.env.BASE_URL}images/${item.img}`}
                alt={item.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-primary/20', 'to-primary/5');
                  e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center font-black text-3xl text-primary">${item.label}</div>`;
                }}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
