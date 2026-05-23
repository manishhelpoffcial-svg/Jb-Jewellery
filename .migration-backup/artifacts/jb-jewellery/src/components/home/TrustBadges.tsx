import React from 'react';
import { motion } from 'framer-motion';

const badges = [
  {
    gif: 'Heart.gif',
    title: 'Made with Love',
    desc: 'Every piece crafted with passion and care for you.',
  },
  {
    gif: 'packaging.gif',
    title: 'Premium Packaging',
    desc: 'Your jewellery arrives beautifully gift-ready.',
  },
  {
    gif: 'Phone.gif',
    title: 'WhatsApp Support',
    desc: 'Reach us instantly — we reply within minutes.',
  },
];

export function TrustBadges() {
  return (
    <section className="py-14 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Why Shop with JB?</h2>
          <p className="text-gray-500 text-sm font-medium">We go the extra mile so you smile.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 max-w-3xl mx-auto">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="flex flex-col items-center text-center gap-3 group"
            >
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}images/${badge.gif}`}
                  alt={badge.title}
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-1">{badge.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{badge.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
