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

export const adminApi = {
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
};
