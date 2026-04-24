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

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id,name,category,price,original_price,discount,rating,reviews,image,is_new,is_bestseller')
    .order('created_at', { ascending: false });
  if (error || !data) {
    console.warn('[sbCatalog] products fetch failed', error);
    return [];
  }
  return (data as ProductRow[]).map(mapRow);
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
