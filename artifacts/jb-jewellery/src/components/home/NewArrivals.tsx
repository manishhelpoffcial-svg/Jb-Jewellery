import React from 'react';
import { products } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';

export function NewArrivals() {
  const newProducts = products.filter(p => p.isNew).slice(0, 4);

  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-1">New Arrivals</h2>
            <p className="text-gray-600 font-medium text-sm">Fresh drops, every week 💛</p>
          </div>
          <a href="#" className="hidden sm:flex text-black font-bold text-sm hover:text-primary transition-colors items-center gap-1">
            View All &rarr;
          </a>
        </div>

        <div className="flex gap-4 sm:gap-5 overflow-x-auto hide-scrollbar pb-6 snap-x lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 lg:gap-6">
          {newProducts.map(p => (
            <div key={p.id} className="w-[200px] sm:w-[230px] shrink-0 snap-start lg:w-auto">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        
        <a href="#" className="sm:hidden block text-center mt-4 text-black font-bold text-sm bg-white py-3 rounded-full border border-gray-200">
          View All New Arrivals
        </a>
      </div>
    </section>
  );
}
