export type Review = {
  id: string;
  name: string;
  initial: string;
  text: string;
  rating: number;
};

export type SiteSettings = {
  seo: {
    title: string;
    description: string;
    keywords: string;
    ogImage: string;
  };
  footer: {
    aboutText: string;
    address: string;
    phone: string;
    email: string;
    locationUrl: string;
    copyrightText: string;
  };
  social: {
    instagram: string;
    facebook: string;
    whatsapp: string;
    twitter: string;
  };
  reviews: {
    averageRating: number;
    totalCustomers: string;
    items: Review[];
  };
};

export const DEFAULT_SETTINGS: SiteSettings = {
  seo: {
    title: 'JB Jewellery Collection — Premium Fashion Jewellery',
    description:
      'Shop premium fashion & artificial jewellery at JB Jewellery Collection. Earrings, necklaces, chokers, bracelets, rings & more. Free shipping above ₹399.',
    keywords:
      'jewellery, fashion jewellery, earrings, necklaces, chokers, bracelets, rings, indian jewellery, artificial jewellery',
    ogImage: '',
  },
  footer: {
    aboutText:
      'We bring you the finest collection of fashion jewellery. Handpicked designs that blend tradition with modern aesthetics.',
    address: '123 Jewellery Lane, Fashion District, Mumbai 400001',
    phone: '+91 99999 99999',
    email: 'hello@jbjewellery.com',
    locationUrl: 'https://maps.google.com/?q=Mumbai',
    copyrightText: '© 2025 JB Jewellery Collection. All Rights Reserved.',
  },
  social: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    whatsapp: 'https://wa.me/919999999999',
    twitter: 'https://twitter.com/',
  },
  reviews: {
    averageRating: 4.9,
    totalCustomers: '10,000+',
    items: [
      { id: '1', name: 'Riya S.', initial: 'R', rating: 5, text: 'Absolutely love the quality! The pearl drop earrings look so premium. Fast delivery too.' },
      { id: '2', name: 'Priya M.', initial: 'P', rating: 5, text: 'Bought the 6 for 499 combo. Such a steal! The designs are exactly as shown in pictures.' },
      { id: '3', name: 'Sneha K.', initial: 'S', rating: 5, text: 'The chokers are so beautiful and lightweight. Wearing them daily to office.' },
      { id: '4', name: 'Ananya R.', initial: 'A', rating: 5, text: 'Great customer service and the packaging was so cute. Highly recommended!' },
    ],
  },
};

const STORAGE_KEY = 'jb-site-settings';

function deepMerge<T>(base: T, override: Partial<T>): T {
  if (!override) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const baseVal: any = (base as any)[key];
    const overrideVal: any = (override as any)[key];
    if (
      overrideVal &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal) &&
      baseVal &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      out[key] = deepMerge(baseVal, overrideVal);
    } else if (overrideVal !== undefined) {
      out[key] = overrideVal;
    }
  }
  return out as T;
}

export function loadSettings(): SiteSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return deepMerge(DEFAULT_SETTINGS, parsed);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: SiteSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('jb-settings-updated'));
}

export function resetSettings() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('jb-settings-updated'));
}
