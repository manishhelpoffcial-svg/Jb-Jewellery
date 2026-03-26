import React from 'react';

const budgets = [
  { img: 'under-99.png', label: 'Under ₹99' },
  { img: 'under-199.png', label: 'Under ₹199' },
  { img: 'under-299.png', label: 'Under ₹299' },
  { img: 'under-499.png', label: 'Under ₹499' },
];

export function ShopUnderBudget() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-8 text-center sm:text-left">Shop Under Budget</h2>
        
        <div className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pb-6 snap-x lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
          {budgets.map((item, i) => (
            <a 
              key={i} 
              href="#" 
              className="w-[280px] sm:w-1/4 shrink-0 snap-start block rounded-2xl overflow-hidden group shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 lg:w-auto"
            >
              <div className="aspect-[4/3] bg-gray-50 relative">
                <img 
                  src={`${import.meta.env.BASE_URL}images/${item.img}`} 
                  alt={item.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-primary/20', 'to-primary/5');
                    e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center font-black text-3xl text-primary">${item.label}</div>`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <h3 className="absolute bottom-4 left-4 font-black text-white text-xl">{item.label}</h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
