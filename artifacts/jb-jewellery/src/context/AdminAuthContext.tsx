import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';

const STORAGE_KEY = 'jb-admin-session';
const _API_ROOT = (import.meta.env.VITE_API_URL as string) || '/jb-api';

interface AdminSession {
  name: string;
  email: string;
  token: string;
}

interface AdminUser {
  name: string;
  email: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

function readSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed.email || !parsed.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getAdminToken(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as AdminSession;
    return parsed.token || '';
  } catch {
    return '';
  }
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = readSession();
    setAdmin(s ? { name: s.name, email: s.email } : null);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, remember: boolean) => {
    const res = await fetch(`${_API_ROOT}/sb-admin/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error((data.error as string) || 'Login failed.');
    }
    const session: AdminSession = {
      name: (data.name as string) || 'Admin',
      email: (data.email as string) || email.trim().toLowerCase(),
      token: data.token as string,
    };
    const payload = JSON.stringify(session);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (remember) {
      localStorage.setItem(STORAGE_KEY, payload);
    } else {
      sessionStorage.setItem(STORAGE_KEY, payload);
    }
    setAdmin({ name: session.name, email: session.email });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !admin) {
      navigate('/admin/login', { replace: true });
    }
  }, [admin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!admin) return null;
  return <>{children}</>;
}
