import React from 'react';

export function SpecialOffer() {
  return (
    <section className="bg-black">
      <div className="w-full cursor-pointer hover:opacity-95 transition-opacity">
        <img 
          src={`${import.meta.env.BASE_URL}images/special-offer.png`} 
          alt="Don't Miss Your Special Offer" 
          className="w-full h-auto object-cover max-h-[400px]"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = `
              <div class="container mx-auto px-4 py-16 text-center">
                <h2 class="text-4xl md:text-6xl font-black text-primary mb-4 uppercase tracking-wider">Special Offer</h2>
                <p class="text-white text-xl">Don't Miss Out!</p>
              </div>
            `;
          }}
        />
      </div>
    </section>
  );
}
