import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  throw new Error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

const REMEMBER_FLAG_KEY = 'jb-auth-remember';

export function setRememberMe(remember: boolean) {
  try {
    if (remember) {
      localStorage.setItem(REMEMBER_FLAG_KEY, '1');
    } else {
      localStorage.setItem(REMEMBER_FLAG_KEY, '0');
    }
  } catch {
    /* ignore */
  }
}

function shouldRemember(): boolean {
  try {
    const v = localStorage.getItem(REMEMBER_FLAG_KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

const hybridStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key) ?? sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (shouldRemember()) {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
    } catch {
      /* ignore */
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'jb-supabase-auth',
    storage: hybridStorage,
  },
});
