import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';

export default function AdminLogin() {
  const { login, user } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (user?.role === 'admin') navigate('/admin');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(email, password);
      if (user?.role !== 'admin' && !email.includes('admin')) {
        setError('Access Denied. You do not have admin privileges.');
        setLoading(false);
        return;
      }
      navigate('/admin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '') : 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="bg-primary px-8 py-8 text-center">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-black">Admin Login</h1>
          <p className="text-black/60 text-sm mt-1">JB Jewellery Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Admin Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="admin@jbjewellery.com" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="••••••••" />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? 'Logging in...' : 'Login to Admin Panel'}
          </button>
          <p className="text-center text-xs text-gray-400">Demo: use any email with "admin" in it</p>
        </form>
      </motion.div>
    </div>
  );
}
