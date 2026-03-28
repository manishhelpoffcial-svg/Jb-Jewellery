import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type ApiUser } from '@/lib/api';

export interface JBUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

interface AuthContextType {
  user: JBUser | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'signup';
  openAuthModal: (tab?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toJBUser(u: ApiUser & { createdAt?: string }): JBUser {
  return { uid: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role as 'user' | 'admin', createdAt: u.createdAt };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JBUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const token = localStorage.getItem('jb-token');
    if (!token) { setLoading(false); return; }
    api.auth.me()
      .then(({ user: u }) => setUser(toJBUser(u)))
      .catch(() => localStorage.removeItem('jb-token'))
      .finally(() => setLoading(false));
  }, []);

  const openAuthModal = (tab: 'login' | 'signup' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const login = async (email: string, password: string) => {
    const { token, user: u } = await api.auth.login({ email, password });
    localStorage.setItem('jb-token', token);
    setUser(toJBUser(u));
  };

  const signup = async (name: string, email: string, phone: string, password: string) => {
    const { token, user: u } = await api.auth.register({ name, email, phone, password });
    localStorage.setItem('jb-token', token);
    setUser(toJBUser(u));
  };

  const logout = async () => {
    localStorage.removeItem('jb-token');
    setUser(null);
  };

  const resetPassword = async (_email: string) => {
    throw new Error('Password reset not supported yet. Please contact support via WhatsApp.');
  };

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthModalOpen, authModalTab,
      openAuthModal, closeAuthModal,
      login, signup, logout, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
