import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const vibes = [
  {
    image: 'vibe-1.png',
    title: 'Boss Babe Basic',
    sub: 'Minimal, Mindful, Made To Impress',
  },
  {
    image: 'vibe-2.png',
    title: 'Glam Girl Hours',
    sub: 'Shine Loud, Glow Louder',
  },
  {
    image: 'vibe-3.png',
    title: 'Everyday Slay',
    sub: 'Effortless Sparkle For Your Daily Story',
  },
  {
    image: 'vibe-4.png',
    title: 'Campus Girl',
    sub: 'Main Character Energy On Campus',
  },
  {
    image: 'vibe-5.png',
    title: 'Bold Babe Edit',
    sub: 'Unapologetic. Unfiltered. You.',
  },
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
          <a href="#" className="text-primary font-bold text-sm hover:underline flex items-center gap-1 shrink-0">
            View All <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Horizontally scrollable vibe cards */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
          {vibes.map((vibe, i) => (
            <motion.div
              key={vibe.title}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="relative w-[220px] sm:w-[260px] shrink-0 snap-start rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-shadow duration-300 lg:w-auto"
            >
              {/* Image */}
              <img
                src={`${import.meta.env.BASE_URL}images/${vibe.image}`}
                alt={vibe.title}
                className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Overlay gradient + text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex flex-col justify-end p-4">
                <h3 className="text-white font-black text-lg leading-tight drop-shadow-md">{vibe.title}</h3>
                <p className="text-white/80 text-xs mt-1 mb-3 leading-snug">{vibe.sub}</p>
                <button className="bg-primary text-black text-xs font-bold py-2 px-4 rounded-full w-max flex items-center gap-1.5 hover:bg-yellow-400 transition-colors">
                  Shop Now <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
