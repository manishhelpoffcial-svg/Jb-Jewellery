import React, { useState } from 'react';
import { products } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';

const filters = ["All", "Trending", "New", "Bestseller", "Combo"];

export function JbExclusive() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredProducts = products.filter(p => {
    if (activeFilter === "All") return true;
    if (activeFilter === "New") return p.isNew;
    if (activeFilter === "Bestseller") return p.isBestseller;
    if (activeFilter === "Trending") return p.rating > 4.7;
    return true; // Combo fallback to all for demo
  }).slice(0, 6);

  return (
    <section className="py-12 bg-gray-50/50">
      <div className="container mx-auto px-4">
        
        {/* Banner */}
        <div className="rounded-2xl overflow-hidden shadow-sm mb-8 relative group cursor-pointer">
          <img 
            src={`${import.meta.env.BASE_URL}images/jb-exclusive.png`} 
            alt="JB Exclusive"
            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1515562141207-7a48cb3ce12a?w=1200&q=80`;
            }}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 sm:gap-4 overflow-x-auto hide-scrollbar mb-8 justify-start sm:justify-center">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeFilter === f 
                  ? 'bg-primary text-black shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/50 hover:text-black'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pb-6 snap-x lg:grid lg:grid-cols-3 xl:grid-cols-3 lg:overflow-visible lg:pb-0">
          {filteredProducts.map(p => (
            <div key={p.id} className="w-[200px] sm:w-[240px] shrink-0 snap-start lg:w-auto">
              <ProductCard product={p} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
