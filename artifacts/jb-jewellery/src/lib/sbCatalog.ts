import { supabase } from './supabase';
import type { Product } from '@/data/products';

export interface SbCouponPublic {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  min_order: number;
  max_discount: number;
  expiry: string | null;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
}

interface ProductRow {
  id: string;
  name: string;
  category: string;
  price: number | string;
  original_price: number | string;
  discount: number | string;
  rating: number | string;
  reviews: number | string;
  image: string | null;
  is_new: boolean;
  is_bestseller: boolean;
}

function mapRow(r: ProductRow): Product {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    price: Number(r.price),
    originalPrice: Number(r.original_price),
    discount: Number(r.discount),
    rating: Number(r.rating),
    reviews: Number(r.reviews),
    image: r.image || undefined,
    isNew: !!r.is_new,
    isBestseller: !!r.is_bestseller,
  };
}

// ── Products cache: 3-min TTL + in-flight deduplication ──────────────────────
const PROD_CACHE_TTL = 180_000;
let _prodCache: { data: Product[]; expires: number } | null = null;
let _prodInflight: Promise<Product[]> | null = null;

export function bustProductsCache() { _prodCache = null; _prodInflight = null; }

export async function fetchProducts(): Promise<Product[]> {
  if (_prodCache && Date.now() < _prodCache.expires) return _prodCache.data;
  if (_prodInflight) return _prodInflight;
  _prodInflight = (async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,category,price,original_price,discount,rating,reviews,image,is_new,is_bestseller')
      .order('created_at', { ascending: false });
    if (error || !data) {
      console.warn('[sbCatalog] products fetch failed', error);
      _prodInflight = null;
      return [];
    }
    const result = (data as ProductRow[]).map(mapRow);
    _prodCache = { data: result, expires: Date.now() + PROD_CACHE_TTL };
    _prodInflight = null;
    return result;
  })();
  return _prodInflight;
}

export async function fetchActiveCoupons(): Promise<SbCouponPublic[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('is_active', true);
  if (error || !data) return [];
  return data as SbCouponPublic[];
}

export async function findCoupon(code: string): Promise<SbCouponPublic | null> {
  const { data } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();
  return (data as SbCouponPublic | null) || null;
}
