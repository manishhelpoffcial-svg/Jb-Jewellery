import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, Star, X, Save, Phone } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { api, type ApiAddress, type ApiAddressInput } from '@/lib/api';

const LABELS = ['Home', 'Office', 'Other'];
const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry'];

const emptyForm: ApiAddressInput = {
  label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: 'Maharashtra', pincode: '', isDefault: false,
};

export default function ProfileAddresses() {
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<(ApiAddressInput & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = () => {
    api.addresses.list()
      .then(({ addresses: a }) => setAddresses(a))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const openAdd = () => { setEditing({ ...emptyForm }); setShowForm(true); };
  const openEdit = (a: ApiAddress) => {
    setEditing({ id: a.id, label: a.label, fullName: a.full_name, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode, isDefault: a.is_default });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.fullName || !editing.phone || !editing.line1 || !editing.city || !editing.pincode) {
      showMsg('Please fill all required fields.', false); return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        await api.addresses.update(editing.id, editing);
        showMsg('Address updated!');
      } else {
        await api.addresses.create(editing);
        showMsg('Address added!');
      }
      load();
      setShowForm(false);
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to save', false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.addresses.delete(id).catch(() => {});
    load();
    setDeleteId(null);
  };

  const handleSetDefault = async (id: string) => {
    await api.addresses.setDefault(id).catch(() => {});
    load();
  };

  return (
    <ProfileLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900">My Addresses</h1>
          {addresses.length < 5 && (
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all text-sm">
              <Plus className="w-4 h-4" /> Add Address
            </button>
          )}
        </div>

        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>
        )}

        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <MapPin className="w-14 h-14 mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-600">No addresses saved</p>
            <p className="text-gray-400 text-sm mt-1">Add your delivery addresses for faster checkout.</p>
            <button onClick={openAdd} className="mt-5 px-6 py-2.5 bg-primary text-black font-bold rounded-xl text-sm hover:bg-yellow-400 transition-all">Add Address</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map(a => (
              <div key={a.id} className={`bg-white rounded-2xl shadow-sm border p-5 relative ${a.is_default ? 'border-primary' : 'border-gray-100'}`}>
                {a.is_default && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold bg-primary text-black px-2 py-0.5 rounded-full">DEFAULT</span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{a.label}</span>
                </div>
                <p className="font-semibold text-gray-800 text-sm">{a.full_name}</p>
                <p className="text-gray-500 text-sm mt-0.5">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                <p className="text-gray-500 text-sm">{a.city}, {a.state} – {a.pincode}</p>
                <p className="text-gray-400 text-xs mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {a.phone}</p>
                <div className="flex items-center gap-2 mt-4">
                  <button onClick={() => openEdit(a)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(a.id)} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-all">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  {!a.is_default && (
                    <button onClick={() => handleSetDefault(a.id)} className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-yellow-700 rounded-xl text-xs font-semibold transition-all ml-auto">
                      <Star className="w-3.5 h-3.5" /> Set Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {addresses.length >= 5 && <p className="text-xs text-center text-gray-400">Maximum 5 addresses allowed.</p>}
      </div>

      {/* Add/Edit Form */}
      {showForm && editing && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-black text-lg">{editing.id ? 'Edit Address' : 'Add New Address'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Label</label>
                <div className="flex gap-2">{LABELS.map(l => (
                  <button key={l} onClick={() => setEditing(p => p ? { ...p, label: l } : p)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${editing.label === l ? 'bg-primary border-primary text-black' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{l}</button>
                ))}</div>
              </div>
              {[
                { key: 'fullName', label: 'Full Name *', placeholder: 'Priya Sharma' },
                { key: 'phone', label: 'Phone Number *', placeholder: '9876543210' },
                { key: 'line1', label: 'Address Line 1 *', placeholder: '123 MG Road, Flat 4B' },
                { key: 'line2', label: 'Address Line 2', placeholder: 'Landmark (optional)' },
                { key: 'city', label: 'City *', placeholder: 'Mumbai' },
                { key: 'pincode', label: 'Pincode *', placeholder: '400001' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label}</label>
                  <input value={(editing as Record<string, unknown>)[key] as string} onChange={e => setEditing(p => p ? { ...p, [key]: e.target.value } : p)}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">State *</label>
                <select value={editing.state} onChange={e => setEditing(p => p ? { ...p, state: e.target.value } : p)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary">
                  {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!editing.isDefault} onChange={e => setEditing(p => p ? { ...p, isDefault: e.target.checked } : p)} className="w-4 h-4 accent-yellow-400" />
                <span className="text-sm font-semibold">Set as default address</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 flex items-center justify-center gap-2 disabled:opacity-70">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setDeleteId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Delete Address?</h3>
            <p className="text-gray-500 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 border rounded-xl font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600">Delete</button>
            </div>
          </div>
        </>
      )}
    </ProfileLayout>
  );
}
