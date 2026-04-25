import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { categoriesApi, type SbCategory } from '@/lib/adminApi';

export function CategoryRow() {
  const [cats, setCats] = useState<SbCategory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    categoriesApi.listPublic('main')
      .then((r) => setCats(r.categories))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && cats.length === 0) return null;

  return (
    <section className="py-8 lg:py-12 bg-white border-b border-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto hide-scrollbar pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
          {cats.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-3 shrink-0 snap-center group cursor-pointer lg:shrink lg:w-auto"
            >
              <div className="w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] lg:w-full lg:h-auto lg:aspect-square rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 group-hover:shadow-lg relative bg-gradient-to-br from-gray-100 to-gray-200">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-gray-400">{cat.name.charAt(0)}</div>
                )}
              </div>
              <span className="font-bold text-xs sm:text-[13px] lg:text-sm xl:text-base text-gray-800 text-center">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
