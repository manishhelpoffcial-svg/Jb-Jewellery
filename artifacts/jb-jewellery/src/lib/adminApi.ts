const BASE = '/jb-api/sb-admin';

function adminToken(): string {
  return (import.meta.env.VITE_ADMIN_PASSWORD as string) || '';
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(BASE + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-admin-token': adminToken(),
      ...(init.headers || {}),
    },
  });
  const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) {
    throw new Error((data.error as string) || r.statusText || 'Request failed');
  }
  return data as T;
}

// ── Customer types ───────────────────────────────────────────────────────────
export interface SbAddress {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  pincode: string;
  country: string | null;
  is_default: boolean;
  created_at: string;
}

export interface SbCustomer {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  addresses: SbAddress[];
  address_count: number;
}

export interface SbCustomerDetail {
  customer: Omit<SbCustomer, 'addresses' | 'address_count'>;
  addresses: SbAddress[];
}

// ── Product / coupon / order / dashboard types ───────────────────────────────
export interface SbProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  original_price: number;
  discount: number;
  rating: number;
  reviews: number;
  image: string | null;
  images: string[];
  is_new: boolean;
  is_bestseller: boolean;
  stock: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SbProductReview {
  id: string;
  product_id: string;
  product_name: string | null;
  user_id: string | null;
  customer_name: string;
  customer_initial: string | null;
  rating: number;
  review_text: string;
  images: string[];
  is_visible: boolean;
  is_verified: boolean;
  source: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface SbCoupon {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  min_order: number;
  max_discount: number;
  expiry: string | null;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SbOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface SbOrderAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface SbOrder {
  id: string;
  user_id: string | null;
  customer_name: string;
  phone: string;
  email: string;
  items: SbOrderItem[];
  address: SbOrderAddress;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  coupon_code: string | null;
  grand_total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  status_history: { status: string; timestamp: string; note?: string }[];
  whatsapp_sent: boolean;
  invoice_url: string | null;
  invoice_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface SbDashboard {
  stats: {
    total_orders: number;
    pending_orders: number;
    delivered_orders: number;
    total_revenue: number;
    product_count: number;
    coupon_count: number;
    customer_count: number;
  };
  chart_7d: { label: string; date: string; orders: number; revenue: number }[];
  status_breakdown: Record<string, number>;
  recent_orders: SbOrder[];
}

// ── API surface ──────────────────────────────────────────────────────────────
export const adminApi = {
  // Customers
  listCustomers: () => req<{ customers: SbCustomer[] }>('/customers'),
  getCustomer: (id: string) => req<SbCustomerDetail>(`/customers/${id}`),
  createCustomer: (body: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    address?: { line1: string; line2?: string; city: string; state?: string; pincode: string };
  }) =>
    req<{ id: string; email: string }>('/customers', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteCustomer: (id: string) =>
    req<{ success: true }>(`/customers/${id}`, { method: 'DELETE' }),
  setPassword: (id: string, password: string) =>
    req<{ success: true }>(`/customers/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    }),
  loginLink: (id: string, redirectTo?: string) =>
    req<{ action_link: string; email: string }>(`/customers/${id}/login-link`, {
      method: 'POST',
      body: JSON.stringify({ redirectTo: redirectTo || window.location.origin }),
    }),

  // Products
  listProducts: () => req<{ products: SbProduct[] }>('/products'),
  createProduct: (body: Partial<SbProduct>) =>
    req<{ product: SbProduct }>('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: string, body: Partial<SbProduct>) =>
    req<{ product: SbProduct }>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteProduct: (id: string) =>
    req<{ success: true }>(`/products/${id}`, { method: 'DELETE' }),

  // Coupons
  listCoupons: () => req<{ coupons: SbCoupon[] }>('/coupons'),
  createCoupon: (body: Partial<SbCoupon>) =>
    req<{ coupon: SbCoupon }>('/coupons', { method: 'POST', body: JSON.stringify(body) }),
  updateCoupon: (code: string, body: Partial<SbCoupon>) =>
    req<{ coupon: SbCoupon }>(`/coupons/${code}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteCoupon: (code: string) =>
    req<{ success: true }>(`/coupons/${code}`, { method: 'DELETE' }),

  // Orders
  listOrders: () => req<{ orders: SbOrder[] }>('/orders'),
  updateOrderStatus: (id: string, status: string, note?: string, tracking_number?: string) =>
    req<{ order: SbOrder }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note, tracking_number }),
    }),
  uploadInvoice: (id: string, pdf_base64: string) =>
    req<{ invoice_url: string; invoice_path: string }>(`/orders/${id}/invoice`, {
      method: 'POST',
      body: JSON.stringify({ pdf_base64 }),
    }),

  // Dashboard
  dashboard: () => req<SbDashboard>('/dashboard'),
};

// ── Uploads ──────────────────────────────────────────────────────────────────
async function uploadImage(endpoint: string, file: File): Promise<string> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
  const r = await fetch(`/jb-api${endpoint}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': (import.meta.env.VITE_ADMIN_PASSWORD as string) || '',
    },
    body: JSON.stringify({ base64, filename: file.name, mime: file.type }),
  });
  const data = (await r.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!r.ok || !data.url) throw new Error(data.error || 'Upload failed');
  return data.url;
}

async function uploadImagePublic(endpoint: string, file: File): Promise<string> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('Could not read file'));
    r.readAsDataURL(file);
  });
  const r = await fetch(`/jb-api${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ base64, filename: file.name, mime: file.type }),
  });
  const data = (await r.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!r.ok || !data.url) throw new Error(data.error || 'Upload failed');
  return data.url;
}

export const uploadsApi = {
  productImage: (file: File) => uploadImage('/uploads/product-image', file),
  adminReviewImage: (file: File) => uploadImage('/uploads/admin/review-image', file),
  customerReviewImage: (file: File) => uploadImagePublic('/uploads/review-image', file),
  categoryImage: (file: File) => uploadImage('/uploads/category-image', file),
};

// ── Categories ──────────────────────────────────────────────────────────────
export type CategoryType = 'main' | 'vibe' | 'price' | 'combo';

export interface SbCategory {
  id: string;
  slug: string;
  name: string;
  type: CategoryType;
  image: string | null;
  subtitle: string | null;
  description: string | null;
  product_category: string | null;
  max_price: number | null;
  combo_count: number | null;
  combo_price: number | null;
  combo_extra: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_ids?: string[];
}

// ── Client-side category cache: 2-min TTL + in-flight deduplication ──────────
const CAT_CACHE_TTL = 120_000;
type AllCatResult = { categories: SbCategory[]; byType: Record<string, SbCategory[]> };
let _allCatCache: { data: AllCatResult; expires: number } | null = null;
let _allCatInflight: Promise<AllCatResult> | null = null;

function fetchAllCategoriesRaw(): Promise<AllCatResult> {
  if (_allCatCache && Date.now() < _allCatCache.expires) return Promise.resolve(_allCatCache.data);
  if (_allCatInflight) return _allCatInflight;
  _allCatInflight = fetch('/jb-api/categories/all')
    .then((r) => { if (!r.ok) throw new Error('Failed to load categories'); return r.json() as Promise<AllCatResult>; })
    .then((data) => {
      _allCatCache = { data, expires: Date.now() + CAT_CACHE_TTL };
      _allCatInflight = null;
      return data;
    })
    .catch((err) => { _allCatInflight = null; throw err; });
  return _allCatInflight;
}

export const categoriesApi = {
  // Single fetch for ALL types → components filter client-side (zero extra requests)
  listAll: fetchAllCategoriesRaw,
  listPublic: async (type?: CategoryType): Promise<{ categories: SbCategory[] }> => {
    const all = await fetchAllCategoriesRaw();
    if (!type) return { categories: all.categories };
    return { categories: (all.byType[type] as SbCategory[]) || [] };
  },
  getBySlug: async (slug: string): Promise<{ category: SbCategory; products: SbProduct[] }> => {
    const r = await fetch(`/jb-api/categories/${encodeURIComponent(slug)}`);
    const data = (await r.json().catch(() => ({}))) as { category?: SbCategory; products?: SbProduct[]; error?: string };
    if (!r.ok || !data.category) throw new Error(data.error || 'Failed to load category');
    return { category: data.category, products: data.products || [] };
  },
  bustCache: () => { _allCatCache = null; _allCatInflight = null; },
};

// Use direct admin fetch for admin category endpoints (different prefix)
async function catAdminReq<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`/jb-api/categories${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-admin-token': (import.meta.env.VITE_ADMIN_PASSWORD as string) || '',
      ...(init.headers || {}),
    },
  });
  const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new Error((data.error as string) || 'Request failed');
  return data as T;
}

export const adminCategoriesApi = {
  list: () => catAdminReq<{ categories: SbCategory[] }>('/admin/list'),
  create: (body: Partial<SbCategory>) =>
    catAdminReq<{ category: SbCategory }>('/admin', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<SbCategory>) =>
    catAdminReq<{ category: SbCategory }>(`/admin/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) =>
    catAdminReq<{ success: true }>(`/admin/${id}`, { method: 'DELETE' }),
  setProducts: (id: string, productIds: string[]) =>
    catAdminReq<{ success: true; count: number }>(`/admin/${id}/products`, {
      method: 'PUT',
      body: JSON.stringify({ product_ids: productIds }),
    }),
};

// ── Customer-facing reviews API (no admin token) ────────────────────────────
export interface CustomerReviewSubmission {
  product_id: string;
  product_name?: string;
  user_id?: string;
  customer_name: string;
  rating: number;
  review_text?: string;
  images?: string[];
}

export const customerReviewsApi = {
  listForProduct: async (productId: string): Promise<{ reviews: SbProductReview[] }> => {
    const r = await fetch(`/jb-api/product-reviews/product/${encodeURIComponent(productId)}`);
    if (!r.ok) throw new Error('Failed to load reviews');
    return r.json();
  },
  submit: async (body: CustomerReviewSubmission): Promise<{ review: SbProductReview }> => {
    const r = await fetch('/jb-api/product-reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await r.json().catch(() => ({}))) as { review?: SbProductReview; error?: string };
    if (!r.ok || !data.review) throw new Error(data.error || 'Failed to submit review');
    return { review: data.review };
  },
};

// ── Site settings ────────────────────────────────────────────────────────────
export const settingsApi = {
  get: async (): Promise<{ settings: Record<string, unknown>; updated_at: string | null }> => {
    const r = await fetch('/jb-api/site-settings');
    if (!r.ok) throw new Error('Failed to load site settings');
    return r.json();
  },
  save: async (settings: Record<string, unknown>) => {
    const r = await fetch('/jb-api/site-settings', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': (import.meta.env.VITE_ADMIN_PASSWORD as string) || '',
      },
      body: JSON.stringify({ settings }),
    });
    const data = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) throw new Error(data.error || 'Failed to save settings');
    return { ok: true };
  },
};

// ── Product reviews (admin) ──────────────────────────────────────────────────
async function adminReviewReq<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`/jb-api/product-reviews${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-admin-token': (import.meta.env.VITE_ADMIN_PASSWORD as string) || '',
      ...(init.headers || {}),
    },
  });
  const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new Error((data.error as string) || 'Request failed');
  return data as T;
}

export const productReviewsApi = {
  list: (productId?: string) =>
    adminReviewReq<{ reviews: SbProductReview[] }>(productId ? `?product_id=${encodeURIComponent(productId)}` : ''),
  add: (body: Partial<SbProductReview>) =>
    adminReviewReq<{ review: SbProductReview }>('/admin', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<SbProductReview>) =>
    adminReviewReq<{ review: SbProductReview }>(`/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) =>
    adminReviewReq<{ success: true }>(`/${id}`, { method: 'DELETE' }),
};


// ── Email Templates (admin) ─────────────────────────────────────────────────
async function emailReq<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`/jb-api/admin/email-templates${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-admin-token': (import.meta.env.VITE_ADMIN_PASSWORD as string) || '',
      ...(init.headers || {}),
    },
  });
  const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new Error((data.error as string) || 'Request failed');
  return data as T;
}

export interface EmailTemplateMeta {
  key: string;
  name: string;
  description: string;
  category: 'Customer' | 'Admin' | 'Marketing';
  defaultSubject: string;
  audience: string;
}

export const emailTemplatesApi = {
  list: () => emailReq<{ templates: EmailTemplateMeta[] }>(''),
  preview: (key: string) =>
    emailReq<{ template: EmailTemplateMeta; html: string }>(`/${encodeURIComponent(key)}/preview`),
  send: (key: string, body: { email: string; subject?: string }) =>
    emailReq<{ success: true; sentTo: string }>(`/${encodeURIComponent(key)}/send`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ── Brand asset upload (logo / signature) ───────────────────────────────────
export async function uploadBrandAsset(file: File, kind: 'logo' | 'signature' = 'logo'): Promise<string> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('Could not read file'));
    r.readAsDataURL(file);
  });
  const res = await fetch('/jb-api/uploads/brand-asset', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': (import.meta.env.VITE_ADMIN_PASSWORD as string) || '',
    },
    body: JSON.stringify({ base64, filename: file.name, mime: file.type, kind }),
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');
  return data.url;
}

// ── Custom Invoices (admin) ─────────────────────────────────────────────────
export type InvoicePartyInput = {
  name: string;
  address: string;
  state?: string;
  stateCode?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  customerType?: string;
};

export type InvoiceLineInput = {
  description: string;
  hsn?: string;
  qty: number;
  unitPrice: number;
  discount?: number;
  otherCharges?: number;
  gstRate?: number;
};

export type InvoiceInput = {
  invoiceNumber?: string;
  invoiceDate?: string;
  orderNumber?: string;
  orderDate?: string;
  natureOfSupply?: string;
  placeOfSupply?: string;
  paymentMethod?: string;
  billTo: InvoicePartyInput;
  shipTo?: InvoicePartyInput;
  lines: InvoiceLineInput[];
  shipping?: number;
  notes?: string;
};

async function invoiceReq<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`/jb-api/admin/invoices${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': (import.meta.env.VITE_ADMIN_PASSWORD as string) || '',
    },
    body: JSON.stringify(body),
  });
  const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new Error((data.error as string) || 'Request failed');
  return data as T;
}

export const invoicesApi = {
  preview: (invoice: InvoiceInput) =>
    invoiceReq<{ html: string; invoiceNumber: string }>('/preview', invoice),
  send: (params: { to: string; subject?: string; invoice: InvoiceInput }) =>
    invoiceReq<{ success: true; sentTo: string; invoiceNumber: string }>('/send', params),
};
