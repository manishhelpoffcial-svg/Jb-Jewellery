import React from 'react';
import { Marquee } from '@/components/layout/Marquee';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSlider } from '@/components/home/HeroSlider';
import { CategoryRow } from '@/components/home/CategoryRow';
import { JbExclusive } from '@/components/home/JbExclusive';
import { ShopYourVibe } from '@/components/home/ShopYourVibe';
import { Bestsellers } from '@/components/home/Bestsellers';
import { ShopUnderBudget } from '@/components/home/ShopUnderBudget';
import { NewArrivals } from '@/components/home/NewArrivals';
import { SpecialOffer } from '@/components/home/SpecialOffer';
import { ComboDeals } from '@/components/home/ComboDeals';
import { Reviews } from '@/components/home/Reviews';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

export default function Home() {
  return (
    <CartProvider>
      <WishlistProvider>
        <div className="min-h-screen flex flex-col w-full relative">
          <Marquee />
          <Navbar />
          
          <main className="flex-1">
            <HeroSlider />
            <CategoryRow />
            <JbExclusive />
            <ShopYourVibe />
            <Bestsellers />
            <ShopUnderBudget />
            <NewArrivals />
            <SpecialOffer />
            <ComboDeals />
            <Reviews />
          </main>
          
          <Footer />
          <CartDrawer />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}
