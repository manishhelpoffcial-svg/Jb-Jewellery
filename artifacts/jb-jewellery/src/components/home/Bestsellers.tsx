import React, { useState } from 'react';
import { products } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';

const tabs = ["Earrings", "Necklaces", "Chokers", "Bracelets", "Rings", "Hair Accessories"];

export function Bestsellers() {
  const [activeTab, setActiveTab] = useState("Earrings");
  
  const displayProducts = products
    .filter(p => p.category.includes(activeTab) || (activeTab === "Chokers" && p.category === "Necklaces"))
    .slice(0, 8);
    
  // Fill empty slots for layout if needed
  const filler = displayProducts.length < 8 
    ? products.filter(p => p.isBestseller && !displayProducts.includes(p)).slice(0, 8 - displayProducts.length)
    : [];

  const finalProducts = [...displayProducts, ...filler];

  return (
    <section className="py-16 bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4">
        
        {/* Banner */}
        <div className="w-full h-[120px] sm:h-[180px] rounded-2xl overflow-hidden mb-12 shadow-sm cursor-pointer hover:shadow-md transition-shadow relative">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-banner-2.png`} 
            alt="Bestsellers" 
            className="w-full h-full object-cover"
            onError={(e) => {
               (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=80`;
            }}
          />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Bestsellers</h2>
            <p className="text-gray-500 font-medium text-sm">Styles that everyone is loving right now.</p>
          </div>
          <a href="#" className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
            View All Bestsellers &rarr;
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 overflow-x-auto hide-scrollbar mb-8 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-primary text-black' 
                  : 'border-transparent text-gray-400 hover:text-black hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {finalProducts.map(p => (
            <ProductCard key={p.id} product={{...p, isBestseller: true}} />
          ))}
        </div>

      </div>
    </section>
  );
}
