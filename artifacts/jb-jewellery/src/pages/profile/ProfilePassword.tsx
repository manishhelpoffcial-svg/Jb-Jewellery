import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, X } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { api } from '@/lib/api';

function PasswordRule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
      {ok ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> : <X className="w-3.5 h-3.5 flex-shrink-0" />}
      {text}
    </div>
  );
}

export default function ProfilePassword() {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const rules = [
    { ok: newPw.length >= 8, text: 'Minimum 8 characters' },
    { ok: /[A-Z]/.test(newPw), text: 'One uppercase letter' },
    { ok: /[0-9]/.test(newPw), text: 'One number' },
    { ok: /[^A-Za-z0-9]/.test(newPw), text: 'One special character' },
  ];
  const pwValid = rules.every(r => r.ok) && newPw === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwValid) return;
    setSaving(true);
    try {
      await api.auth.changePassword({ currentPassword: current, newPassword: newPw });
      setMsg({ text: 'Password changed successfully!', ok: true });
      setCurrent(''); setNewPw(''); setConfirm('');
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : 'Failed to change password', ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary pr-12";

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black text-gray-900">Change Password</h1>

        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"><Lock className="w-5 h-5 text-gray-600" /></div>
            <p className="text-sm text-gray-500">Keep your account secure with a strong password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Current Password</label>
              <div className="relative">
                <input type={show.current ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)} required className={inputClass} />
                <button type="button" onClick={() => setShow(s => ({ ...s, current: !s.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">New Password</label>
              <div className="relative">
                <input type={show.new ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} required className={inputClass} />
                <button type="button" onClick={() => setShow(s => ({ ...s, new: !s.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPw && (
                <div className="mt-2 space-y-1">
                  {rules.map((r, i) => <PasswordRule key={i} ok={r.ok} text={r.text} />)}
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Confirm New Password</label>
              <div className="relative">
                <input type={show.confirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required className={inputClass} />
                <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirm && newPw !== confirm && <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>}
            </div>

            <button type="submit" disabled={!pwValid || saving || !current}
              className="w-full py-3.5 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </ProfileLayout>
  );
}
