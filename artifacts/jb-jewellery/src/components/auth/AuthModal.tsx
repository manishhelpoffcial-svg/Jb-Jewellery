import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Loader2, Sparkles, KeyRound, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function AuthModal() {
  const { isAuthModalOpen, authModalTab, closeAuthModal, login, signup, resetPassword } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>(authModalTab);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginRemember, setLoginRemember] = useState(true);
  const [signupForm, setSignupForm] = useState({
    name: '', email: '', phone: '', password: '',
    line1: '', line2: '', city: '', state: '', pincode: '',
  });
  const [signupRemember, setSignupRemember] = useState(true);
  const [forgotEmail, setForgotEmail] = useState('');

  React.useEffect(() => { setTab(authModalTab); }, [authModalTab]);
  React.useEffect(() => { setError(''); setSuccess(''); }, [tab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(loginForm.email, loginForm.password, loginRemember);
      closeAuthModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.phone.length < 10) { setError('Please enter a valid 10-digit phone number.'); return; }
    setLoading(true); setError('');
    try {
      const address =
        signupForm.line1 && signupForm.city && signupForm.pincode
          ? {
              line1: signupForm.line1,
              line2: signupForm.line2,
              city: signupForm.city,
              state: signupForm.state,
              pincode: signupForm.pincode,
            }
          : undefined;
      await signup(
        signupForm.name,
        signupForm.email,
        signupForm.phone,
        signupForm.password,
        signupRemember,
        address,
      );
      setSignupForm({ name: '', email: '', phone: '', password: '', line1: '', line2: '', city: '', state: '', pincode: '' });
      closeAuthModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      if (/confirm/i.test(msg) && /email/i.test(msg)) {
        setSuccess('Account created! Please check your email to confirm your address, then log in.');
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await resetPassword(forgotEmail);
      setSuccess('Reset link sent! Check your email inbox.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-black flex items-center gap-2">
                  {tab === 'login' ? <><span>Welcome Back!</span></> : tab === 'signup' ? <><UserPlus className="w-5 h-5" /><span>Create Account</span></> : <><KeyRound className="w-5 h-5" /><span>Reset Password</span></>}
                </h2>
                <p className="text-black/70 text-xs mt-0.5 font-medium">
                  {tab === 'login' ? 'Sign in to your JB Jewellery account' : tab === 'signup' ? 'Join JB Jewellery Collection' : 'Enter your email to reset password'}
                </p>
              </div>
              <button onClick={closeAuthModal} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="p-6">
              {/* Tabs */}
              {tab !== 'forgot' && (
                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                  <button
                    onClick={() => setTab('login')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === 'login' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                  >Login</button>
                  <button
                    onClick={() => setTab('signup')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === 'signup' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                  >Sign Up</button>
                </div>
              )}

              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              {success && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{success}</div>}

              {/* Login Form */}
              {tab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email Address</label>
                    <input
                      type="email" required value={loginForm.email}
                      onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="priya@gmail.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'} required value={loginForm.password}
                        onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={loginRemember}
                        onChange={e => setLoginRemember(e.target.checked)}
                        className="w-4 h-4 accent-black rounded"
                      />
                      <span className="text-xs font-semibold text-gray-700">Remember me</span>
                    </label>
                    <button type="button" onClick={() => setTab('forgot')} className="text-xs text-primary font-semibold hover:underline">
                      Forgot Password?
                    </button>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3.5 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Signing in...' : 'Login to JB Jewellery'}
                  </button>
                </form>
              )}

              {/* Signup Form */}
              {tab === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Full Name</label>
                    <input type="text" required value={signupForm.name} onChange={e => setSignupForm(p => ({ ...p, name: e.target.value }))} placeholder="Priya Sharma"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email Address</label>
                    <input type="email" required value={signupForm.email} onChange={e => setSignupForm(p => ({ ...p, email: e.target.value }))} placeholder="priya@gmail.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Phone Number</label>
                    <input type="tel" required value={signupForm.phone} onChange={e => setSignupForm(p => ({ ...p, phone: e.target.value }))} placeholder="9876543210"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Password</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} required minLength={6} value={signupForm.password} onChange={e => setSignupForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 6 characters"
                        className="w-full px-4 py-3 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                      <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {/* Address section (optional) */}
                  <div className="pt-2 mt-2 border-t border-gray-100">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Address <span className="font-normal text-gray-400">(optional)</span></p>
                    <div className="space-y-2.5">
                      <input type="text" value={signupForm.line1}
                        onChange={e => setSignupForm(p => ({ ...p, line1: e.target.value }))}
                        placeholder="House / Flat / Street (Address line 1)"
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                      <input type="text" value={signupForm.line2}
                        onChange={e => setSignupForm(p => ({ ...p, line2: e.target.value }))}
                        placeholder="Area / Landmark (Address line 2)"
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                      <div className="grid grid-cols-2 gap-2.5">
                        <input type="text" value={signupForm.city}
                          onChange={e => setSignupForm(p => ({ ...p, city: e.target.value }))}
                          placeholder="City"
                          className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                        <input type="text" value={signupForm.state}
                          onChange={e => setSignupForm(p => ({ ...p, state: e.target.value }))}
                          placeholder="State"
                          className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                      </div>
                      <input type="text" value={signupForm.pincode}
                        onChange={e => setSignupForm(p => ({ ...p, pincode: e.target.value }))}
                        placeholder="Pincode"
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={signupRemember}
                      onChange={e => setSignupRemember(e.target.checked)}
                      className="w-4 h-4 accent-black rounded"
                    />
                    <span className="text-xs font-semibold text-gray-700">Remember me on this device</span>
                  </label>
                  <button type="submit" disabled={loading} className="w-full py-3.5 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Creating account...' : 'Create My Account'}
                  </button>
                </form>
              )}

              {/* Forgot Password */}
              {tab === 'forgot' && (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email Address</label>
                    <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="priya@gmail.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3.5 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button type="button" onClick={() => setTab('login')} className="w-full text-sm text-gray-500 hover:text-black font-medium">
                    ← Back to Login
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
