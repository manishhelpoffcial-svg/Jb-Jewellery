import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/firebase/config';

export interface JBUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
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

const LOCAL_USER_KEY = 'jb-user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JBUser | null>(() => {
    const saved = localStorage.getItem(LOCAL_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && db) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            const data = snap.data() as JBUser;
            setUser(data);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(data));
          }
        } catch {
          // offline mode
        }
      } else if (!firebaseUser) {
        setUser(null);
        localStorage.removeItem(LOCAL_USER_KEY);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const openAuthModal = (tab: 'login' | 'signup' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      const mockUser: JBUser = {
        uid: 'demo-user',
        name: email.split('@')[0],
        email,
        phone: '',
        role: email.includes('admin') ? 'admin' : 'user',
      };
      setUser(mockUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      return;
    }
    const cred = await signInWithEmailAndPassword(auth!, email, password);
    if (db) {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (snap.exists()) {
        const data = snap.data() as JBUser;
        setUser(data);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(data));
      }
    }
  };

  const signup = async (name: string, email: string, phone: string, password: string) => {
    if (!isFirebaseConfigured) {
      const mockUser: JBUser = { uid: `local-${Date.now()}`, name, email, phone, role: 'user' };
      setUser(mockUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth!, email, password);
    const newUser: JBUser = { uid: cred.user.uid, name, email, phone, role: 'user' };
    if (db) await setDoc(doc(db, 'users', cred.user.uid), { ...newUser, createdAt: serverTimestamp() });
    setUser(newUser);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) await signOut(auth);
    setUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured || !auth) return;
    await sendPasswordResetEmail(auth, email);
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
