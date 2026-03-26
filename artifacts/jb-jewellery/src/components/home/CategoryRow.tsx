import React from 'react';

const categories = [
  { img: 'earrings.jpeg', name: 'Earrings' },
  { img: 'necklaces.jpeg', name: 'Necklaces' },
  { img: 'rings.jpeg', name: 'Rings' },
  { img: 'bracelets.jpeg', name: 'Bracelets' },
  { img: 'hair-accessories.jpeg', name: 'Hair Accessories' },
  { img: 'gift-hampers.jpeg', name: 'Gift Hampers' },
];

export function CategoryRow() {
  return (
    <section className="py-8 lg:py-12 bg-white border-b border-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto hide-scrollbar pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
          {categories.map((cat, i) => (
            <a 
              key={i} 
              href="#" 
              className="flex flex-col items-center gap-3 shrink-0 snap-center group cursor-pointer lg:shrink lg:w-auto"
            >
              <div className="w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] lg:w-full lg:h-auto lg:aspect-square rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 group-hover:shadow-lg relative">
                <img 
                  src={`${import.meta.env.BASE_URL}images/${cat.img}`} 
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-gray-100', 'to-gray-200');
                    e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center font-bold text-2xl text-gray-400">${cat.name.charAt(0)}</div>`;
                  }}
                />
              </div>
              <span className="font-bold text-xs sm:text-[13px] lg:text-sm xl:text-base text-gray-800 text-center">
                {cat.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
