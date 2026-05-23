import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  `${import.meta.env.BASE_URL}images/hero-banner-1.png`,
  `${import.meta.env.BASE_URL}images/hero-banner-2.png`,
  `${import.meta.env.BASE_URL}images/hero-banner-3.png`,
  `${import.meta.env.BASE_URL}images/hero-banner-4.png`,
  `${import.meta.env.BASE_URL}images/hero-banner-5.png`,
];

export function HeroSlider() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000, stopOnInteraction: false })
  ]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi]);

  const scrollPrev = React.useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = React.useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  return (
    <div className="relative group overflow-hidden bg-gray-100">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((src, index) => (
            <div className="flex-[0_0_100%] min-w-0" key={index}>
              <img 
                src={src} 
                alt={`JB Jewellery Banner ${index + 1}`} 
                className="w-full h-auto object-contain block"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1599643478514-4a884f1b4a60?w=1920&q=80`;
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button 
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        onClick={scrollPrev}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        onClick={scrollNext}
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === selectedIndex ? 'bg-primary w-8' : 'bg-white/60 hover:bg-white'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
}
