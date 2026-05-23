import React from 'react';

const messages = [
  "🚚 Free Shipping Above ₹399",
  "💛 New Collection Just Dropped",
  "Use Code JBFIRST for 50% OFF",
  "⭐ Rated 4.9 by 10,000+ Customers",
  "🎁 Free Gift on Orders Above ₹999"
];

export function Marquee() {
  return (
    <div className="bg-primary text-primary-foreground py-2 overflow-hidden flex whitespace-nowrap">
      <div className="flex animate-marquee min-w-full font-bold text-xs">
        {/* Render twice for seamless loop */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center">
            {messages.map((msg, j) => (
              <React.Fragment key={j}>
                <span className="mx-6">{msg}</span>
                <span className="opacity-50">|</span>
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
