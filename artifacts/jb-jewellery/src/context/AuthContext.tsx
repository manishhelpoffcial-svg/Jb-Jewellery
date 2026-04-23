import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, setRememberMe } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

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
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  signup: (
    name: string,
    email: string,
    phone: string,
    password: string,
    remember?: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: 'user' | 'admin' | null;
  created_at?: string | null;
}

async function loadProfile(session: Session | null): Promise<JBUser | null> {
  if (!session?.user) return null;
  const u = session.user;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role, created_at')
    .eq('id', u.id)
    .maybeSingle();

  if (error) {
    console.warn('[auth] profile load error', error.message);
  }
  const profile = data as ProfileRow | null;

  return {
    uid: u.id,
    email: u.email ?? '',
    name:
      profile?.full_name ??
      (u.user_metadata?.full_name as string | undefined) ??
      (u.email?.split('@')[0] ?? 'Customer'),
    phone:
      profile?.phone ??
      (u.user_metadata?.phone as string | undefined) ??
      '',
    role: profile?.role ?? 'user',
    createdAt: profile?.created_at ?? u.created_at,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JBUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const jb = await loadProfile(session);
      if (!mounted) return;
      setUser(jb);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const jb = await loadProfile(session);
      setUser(jb);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = (tab: 'login' | 'signup' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const login = async (email: string, password: string, remember = true) => {
    setRememberMe(remember);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signup = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    remember = true,
  ) => {
    setRememberMe(remember);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw new Error(error.message);

    if (data.user) {
      const { error: pErr } = await supabase
        .from('profiles')
        .upsert(
          {
            id: data.user.id,
            full_name: name,
            phone,
            role: 'user',
          },
          { onConflict: 'id' },
        );
      if (pErr) console.warn('[auth] profile upsert error', pErr.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) throw new Error(error.message);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        signup,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
