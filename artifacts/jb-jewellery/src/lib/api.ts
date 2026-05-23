const BASE = (import.meta.env.VITE_API_URL as string) || '/jb-api';

function getToken(): string | null {
  return localStorage.getItem('jb-token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  auth: {
    register: (body: { name: string; email: string; phone: string; password: string }) =>
      request<{ token: string; user: ApiUser }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<{ token: string; user: ApiUser }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request<{ user: ApiUser }>('/auth/me'),
    updateProfile: (body: { name: string; phone: string }) =>
      request<{ user: ApiUser }>('/auth/profile', { method: 'PATCH', body: JSON.stringify(body) }),
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      request<{ success: boolean }>('/auth/password', { method: 'PATCH', body: JSON.stringify(body) }),
  },
  orders: {
    create: (body: Record<string, unknown>) =>
      request<{ order: ApiOrder }>('/orders', { method: 'POST', body: JSON.stringify(body) }),
    my: () => request<{ orders: ApiOrder[] }>('/orders/my'),
    all: () => request<{ orders: ApiOrder[] }>('/orders/all'),
    updateStatus: (id: string, status: string, note?: string) =>
      request<{ order: ApiOrder }>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
    customers: () => request<{ customers: ApiCustomer[] }>('/orders/customers'),
  },
  addresses: {
    list: () => request<{ addresses: ApiAddress[] }>('/addresses'),
    create: (body: Omit<ApiAddressInput, 'id'>) =>
      request<{ address: ApiAddress }>('/addresses', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: ApiAddressInput) =>
      request<{ address: ApiAddress }>(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<{ success: boolean }>(`/addresses/${id}`, { method: 'DELETE' }),
    setDefault: (id: string) => request<{ success: boolean }>(`/addresses/${id}/default`, { method: 'PATCH' }),
  },
  reviews: {
    my: () => request<{ reviews: ApiReview[] }>('/reviews/my'),
    create: (body: { productId: string; productName: string; rating: number; reviewText: string }) =>
      request<{ review: ApiReview }>('/reviews', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { rating: number; reviewText: string }) =>
      request<{ review: ApiReview }>(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<{ success: boolean }>(`/reviews/${id}`, { method: 'DELETE' }),
    forProduct: (productId: string) => request<{ reviews: ApiReview[] }>(`/reviews/product/${productId}`),
  },
  subscribers: {
    subscribe: (email: string, name?: string) =>
      request<{ success: boolean; message: string }>('/subscribers', { method: 'POST', body: JSON.stringify({ email, name }) }),
    list: () => request<{ subscribers: ApiSubscriber[] }>('/subscribers'),
  },
  notify: {
    newArrival: (product: { name: string; category: string; price: number; originalPrice: number; discount: number }) =>
      request<{ success: boolean; notified: number }>('/notify/new-arrival', { method: 'POST', body: JSON.stringify(product) }),
    restock: (product: { name: string; category: string; price: number }) =>
      request<{ success: boolean; notified: number }>('/notify/restock', { method: 'POST', body: JSON.stringify(product) }),
  },
  adminCustomers: {
    list: () => request<{ customers: ApiAdminCustomer[] }>('/admin/customers'),
    detail: (id: string) => request<{ customer: ApiAdminCustomer; orders: ApiOrder[]; reviews: ApiReview[]; addresses: ApiAddress[] }>(`/admin/customers/${id}`),
    setStatus: (id: string, isActive: boolean) =>
      request<{ success: boolean }>(`/admin/customers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    sendEmail: (id: string, subject: string, message: string) =>
      request<{ success: boolean }>(`/admin/customers/${id}/email`, { method: 'POST', body: JSON.stringify({ subject, message }) }),
    exportCsv: () => `${BASE}/admin/customers/export/csv`,
  },
};

export interface ApiUser { id: string; name: string; email: string; phone: string; role: string; createdAt?: string; }
export interface ApiOrder {
  id: string; user_id: string; customer_name: string; phone: string; email: string;
  items: unknown[]; address: unknown; subtotal: number; shipping: number; tax: number;
  discount: number; coupon_code: string; grand_total: number; status: string;
  status_history: { status: string; timestamp: string; note: string }[];
  whatsapp_sent: boolean; created_at: string;
}
export interface ApiCustomer { id: string; name: string; email: string; phone: string; role: string; created_at: string; order_count: string; total_spent: string; }
export interface ApiAdminCustomer {
  id: string; name: string; email: string; phone: string; is_active: boolean;
  created_at: string; order_count: string; total_spent: string; last_order_date: string;
}
export interface ApiAddress {
  id: string; user_id: string; label: string; full_name: string; phone: string;
  line1: string; line2: string; city: string; state: string; pincode: string;
  is_default: boolean; created_at: string;
}
export interface ApiAddressInput {
  label: string; fullName: string; phone: string; line1: string; line2?: string;
  city: string; state: string; pincode: string; isDefault?: boolean;
}
export interface ApiReview {
  id: string; user_id: string; product_id: string; product_name: string;
  rating: number; review_text: string; created_at: string; updated_at: string;
  reviewer_name?: string;
}
export interface ApiSubscriber { id: string; email: string; name: string; subscribed_at: string; active: boolean; }
