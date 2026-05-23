import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { categoriesApi, type SbCategory } from '@/lib/adminApi';

export function ShopYourVibe() {
  const [cats, setCats] = useState<SbCategory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    categoriesApi.listPublic('vibe')
      .then((r) => setCats(r.categories))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && cats.length === 0) return null;

  return (
    <section className="py-14 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-1">Shop Your Vibe</h2>
            <p className="text-gray-500 text-sm font-medium">Find jewellery that matches your mood &amp; personality.</p>
          </div>
        </div>

        <div className="flex gap-4 sm:gap-5 overflow-x-auto hide-scrollbar pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0 lg:gap-6">
          {cats.map((vibe, i) => (
            <motion.div
              key={vibe.id}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="relative w-[220px] sm:w-[250px] shrink-0 snap-start rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-shadow duration-300 lg:w-auto"
            >
              <Link href={`/category/${vibe.slug}`}>
                <div className="relative aspect-[3/4] bg-gradient-to-br from-pink-50 to-rose-100 overflow-hidden">
                  {vibe.image ? (
                    <img
                      src={vibe.image}
                      alt={vibe.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-black text-rose-400/40">{vibe.name}</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white">
                    <p className="font-black text-base leading-tight">{vibe.name}</p>
                    {vibe.subtitle && <p className="text-[11px] opacity-80 line-clamp-1">{vibe.subtitle}</p>}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
