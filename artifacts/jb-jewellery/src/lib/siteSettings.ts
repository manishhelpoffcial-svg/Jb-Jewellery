import { settingsApi } from './adminApi';

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

const CACHE_KEY = 'jb-site-settings-cache';

function deepMerge<T>(base: T, override: Partial<T>): T {
  if (!override) return base;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const key of Object.keys(override) as (keyof T)[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseVal: any = (base as any)[key];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/** Synchronous best-effort cache (used for initial render before API responds). */
export function loadCachedSettings(): SiteSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return deepMerge(DEFAULT_SETTINGS, parsed);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Authoritative load from Supabase via the API. */
export async function fetchSettings(): Promise<SiteSettings> {
  try {
    const { settings } = await settingsApi.get();
    const merged = deepMerge(DEFAULT_SETTINGS, settings as Partial<SiteSettings>);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
    return merged;
  } catch {
    return loadCachedSettings();
  }
}

/** Persist to Supabase via the admin API. */
export async function saveSettings(settings: SiteSettings) {
  await settingsApi.save(settings as unknown as Record<string, unknown>);
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jb-settings-updated'));
  }
}
