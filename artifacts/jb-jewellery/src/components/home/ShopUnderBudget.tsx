import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { categoriesApi, type SbCategory } from '@/lib/adminApi';

export function ShopUnderBudget() {
  const [cats, setCats] = useState<SbCategory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    categoriesApi.listPublic('price')
      .then((r) => setCats(r.categories))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && cats.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-8 text-center sm:text-left">Shop Under Budget</h2>

        <div className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pb-6 snap-x lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 lg:gap-6">
          {cats.map((item) => (
            <Link
              key={item.id}
              href={`/category/${item.slug}`}
              className="w-[260px] shrink-0 snap-start block rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer lg:w-auto"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-3xl text-primary">
                    {item.name}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
