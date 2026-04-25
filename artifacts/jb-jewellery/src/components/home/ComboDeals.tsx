import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { categoriesApi, type SbCategory } from '@/lib/adminApi';

export function ComboDeals() {
  const [cats, setCats] = useState<SbCategory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    categoriesApi.listPublic('combo')
      .then((r) => setCats(r.categories))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && cats.length === 0) return null;

  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-black text-center mb-10">Unbeatable Combo Deals 🔥</h2>
      </div>

      <div className="flex flex-col gap-6 px-4 lg:px-8">
        {cats.map((banner, i) => {
          const headline = banner.combo_count && banner.combo_price
            ? `Buy Any ${banner.combo_count} @ ₹${banner.combo_price}${banner.combo_extra ? ` + ${banner.combo_extra}` : ''}`
            : banner.name;
          return (
            <React.Fragment key={banner.id}>
              <Link href={`/category/${banner.slug}`}>
                <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm cursor-pointer group">
                  {banner.image ? (
                    <img
                      src={banner.image}
                      alt={headline}
                      className="w-full h-auto block"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = 'none';
                        const parent = el.parentElement!;
                        parent.classList.add('bg-black', 'flex', 'items-center', 'p-8', 'min-h-[140px]');
                        parent.innerHTML = `<h3 class="text-white text-2xl sm:text-4xl font-black tracking-wide w-2/3">${headline.toUpperCase()}</h3>`;
                      }}
                    />
                  ) : (
                    <div className="bg-black flex items-center p-8 min-h-[140px]">
                      <h3 className="text-white text-2xl sm:text-4xl font-black tracking-wide w-2/3">{headline.toUpperCase()}</h3>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                </div>
              </Link>
              {i < cats.length - 1 && (
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-300 font-semibold tracking-widest uppercase">More Deals</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
