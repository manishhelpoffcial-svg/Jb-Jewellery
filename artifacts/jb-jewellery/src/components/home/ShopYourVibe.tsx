import React from 'react';
import { ArrowRight } from 'lucide-react';

const vibes = [
  { title: "BOSS BABE BASIC", sub: "Minimal, Mindful, Made To Impress", bg: "bg-[#111111]", text: "text-white", btnBg: "bg-white", btnText: "text-black" },
  { title: "GLAM GIRL", sub: "Turn heads everywhere", bg: "bg-primary", text: "text-black", btnBg: "bg-black", btnText: "text-white" },
  { title: "EVERY DAY SLAY", sub: "Jewellery for every mood", bg: "bg-[#FFFBE6]", text: "text-black", btnBg: "bg-black", btnText: "text-white" }
];

export function ShopYourVibe() {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-black mb-8">Shop Your Vibe</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vibes.map((vibe, i) => (
            <div 
              key={i} 
              className={`${vibe.bg} ${vibe.text} h-[280px] rounded-2xl p-8 flex flex-col justify-end group cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300`}
            >
              <h3 className="text-2xl font-black mb-2 uppercase tracking-wide group-hover:scale-105 origin-left transition-transform">{vibe.title}</h3>
              <p className="text-sm opacity-90 mb-6 font-medium">{vibe.sub}</p>
              
              <button className={`${vibe.btnBg} ${vibe.btnText} font-bold py-3 px-6 rounded-full w-max flex items-center gap-2 group-hover:gap-4 transition-all`}>
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
