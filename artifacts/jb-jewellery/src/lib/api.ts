const BASE = '/jb-api';

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
  },
  orders: {
    create: (body: Record<string, unknown>) =>
      request<{ order: ApiOrder }>('/orders', { method: 'POST', body: JSON.stringify(body) }),
    my: () => request<{ orders: ApiOrder[] }>('/orders/my'),
    all: () => request<{ orders: ApiOrder[] }>('/orders/all'),
    updateStatus: (id: string, status: string, note?: string) =>
      request<{ order: ApiOrder }>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      }),
    customers: () => request<{ customers: ApiCustomer[] }>('/orders/customers'),
  },
};

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface ApiOrder {
  id: string;
  user_id: string;
  customer_name: string;
  phone: string;
  email: string;
  items: unknown[];
  address: unknown;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  coupon_code: string;
  grand_total: number;
  status: string;
  status_history: { status: string; timestamp: string; note: string }[];
  whatsapp_sent: boolean;
  created_at: string;
}

export interface ApiCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  order_count: string;
  total_spent: string;
}
