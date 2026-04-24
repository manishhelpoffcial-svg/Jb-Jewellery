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
  is_new: boolean;
  is_bestseller: boolean;
  stock: number;
  description: string | null;
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
