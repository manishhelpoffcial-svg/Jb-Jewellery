import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

const vibes = [
  { image: 'vibe-1.png', title: 'Boss Babe Basic', category: 'Necklaces' },
  { image: 'vibe-2.png', title: 'Glam Girl Hours', category: 'Earrings' },
  { image: 'vibe-3.png', title: 'Everyday Slay', category: 'Bracelets' },
  { image: 'vibe-4.png', title: 'Campus Girl', category: 'Rings' },
  { image: 'vibe-5.png', title: 'Bold Babe Edit', category: 'Hair Accessories' },
];

export function ShopYourVibe() {
  return (
    <section className="py-14 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-1">Shop Your Vibe ✨</h2>
            <p className="text-gray-500 text-sm font-medium">Find jewellery that matches your mood & personality.</p>
          </div>
        </div>

        <div className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pb-4 snap-x snap-mandatory">
          {vibes.map((vibe, i) => (
            <motion.div
              key={vibe.title}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="relative w-[220px] sm:w-[260px] lg:w-[300px] shrink-0 snap-start rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
              <Link href={`/products?category=${encodeURIComponent(vibe.category)}`}>
                <img
                  src={`${import.meta.env.BASE_URL}images/${vibe.image}`}
                  alt={vibe.title}
                  className="w-full aspect-[3/4] object-cover"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
