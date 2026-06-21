import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Marquee } from '@/components/layout/Marquee';
import { ProductCard } from '@/components/product/ProductCard';
import { products } from '@/data/products';

export default function Products() {
  const query = new URLSearchParams(window.location.search);
  const category = query.get('category');
  const maxPrice = query.get('maxPrice') ? Number(query.get('maxPrice')) : null;
  const combo = query.get('combo') === 'true';

  let filtered = products;
  let title = 'All Products';
  let subtitle = 'Browse our full collection';

  if (category) {
    filtered = products.filter(p =>
      p.category.toLowerCase().includes(category.toLowerCase())
    );
    title = category;
    subtitle = `Explore our ${category.toLowerCase()} collection`;
  } else if (maxPrice !== null) {
    filtered = products.filter(p => p.price <= maxPrice);
    title = `Under ₹${maxPrice}`;
    subtitle = `Products priced under ₹${maxPrice}`;
  } else if (combo) {
    filtered = products.filter(p => p.isBestseller || p.isNew);
    title = 'Unbeatable Combo Deals';
    subtitle = 'Grab more, save more with our combo offers';
  }

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Marquee />
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-black font-medium text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-1">{title}</h1>
            <p className="text-gray-500 text-sm font-medium">{subtitle}</p>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="font-bold text-gray-700 text-lg">No products found</p>
              <Link href="/" className="px-6 py-3 bg-primary text-black font-bold rounded-full text-sm hover:bg-yellow-400 transition-colors">
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
