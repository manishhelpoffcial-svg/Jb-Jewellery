import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { DEFAULT_SETTINGS, Review, SiteSettings } from '@/lib/siteSettings';
import { uploadBrandAsset } from '@/lib/adminApi';
import {
  Search, Layout, Share2, Star as StarIcon, Save, RotateCcw, Plus, Trash2, CheckCircle, Instagram, Facebook, MessageCircle, Twitter, MapPin, Receipt, Upload, X
} from 'lucide-react';

type TabKey = 'seo' | 'footer' | 'social' | 'reviews' | 'invoice';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'seo', label: 'SEO', icon: Search },
  { key: 'footer', label: 'Footer Info', icon: Layout },
  { key: 'social', label: 'Social Links', icon: Share2 },
  { key: 'reviews', label: 'Customer Reviews', icon: StarIcon },
  { key: 'invoice', label: 'Invoice & GST', icon: Receipt },
];

export default function AdminSettings() {
  const { settings, setSettings, loading } = useSiteSettings();
  const [draft, setDraft] = useState<SiteSettings>(() => JSON.parse(JSON.stringify(settings)));
  const [tab, setTab] = useState<TabKey>('seo');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Re-sync the draft whenever the canonical settings change (e.g. after async load)
  React.useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(settings)));
  }, [settings]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const save = async () => {
    setSaving(true);
    setErrMsg(null);
    try {
      await setSettings(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm('Reset all settings to defaults? This will discard your changes.')) return;
    const fresh = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    setDraft(fresh);
    setSaving(true);
    try { await setSettings(fresh); } finally { setSaving(false); }
  };

  const update = <K extends keyof SiteSettings>(section: K, value: SiteSettings[K]) => {
    setDraft({ ...draft, [section]: value });
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Site Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage SEO, footer information, social links and customer reviews.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset to Defaults
            </button>
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-black hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {loading && !dirty && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold">
            Loading saved settings…
          </div>
        )}
        {saved && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Settings saved to database.
          </div>
        )}
        {errMsg && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
            {errMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-6 bg-white p-1.5 rounded-xl border border-gray-100">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-1 justify-center ${
                tab === t.key ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
          {tab === 'seo' && (
            <SeoTab seo={draft.seo} onChange={v => update('seo', v)} />
          )}
          {tab === 'footer' && (
            <FooterTab footer={draft.footer} onChange={v => update('footer', v)} />
          )}
          {tab === 'social' && (
            <SocialTab social={draft.social} onChange={v => update('social', v)} />
          )}
          {tab === 'reviews' && (
            <ReviewsTab reviews={draft.reviews} onChange={v => update('reviews', v)} />
          )}
          {tab === 'invoice' && (
            <InvoiceTab business={draft.business} onChange={v => update('business', v)} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── SEO TAB ─────────────────────────────────────────────────────────────
function SeoTab({ seo, onChange }: { seo: SiteSettings['seo']; onChange: (v: SiteSettings['seo']) => void }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Search} title="Search Engine Optimization" subtitle="How your website appears on Google and social previews." />

      <Field label="Page Title" hint="Shown in browser tabs and Google search results. Keep under 60 characters.">
        <input
          value={seo.title}
          onChange={e => onChange({ ...seo, title: e.target.value })}
          maxLength={70}
          className="input"
          placeholder="JB Jewellery Collection — Premium Fashion Jewellery"
        />
        <div className="text-[11px] text-gray-400 mt-1">{seo.title.length}/70</div>
      </Field>

      <Field label="Meta Description" hint="The short summary Google shows under your title. Keep under 160 characters.">
        <textarea
          value={seo.description}
          onChange={e => onChange({ ...seo, description: e.target.value })}
          maxLength={180}
          rows={3}
          className="input resize-none"
        />
        <div className="text-[11px] text-gray-400 mt-1">{seo.description.length}/180</div>
      </Field>

      <Field label="Keywords" hint="Comma-separated keywords related to your store.">
        <input
          value={seo.keywords}
          onChange={e => onChange({ ...seo, keywords: e.target.value })}
          className="input"
          placeholder="jewellery, earrings, necklaces"
        />
      </Field>

      <Field label="Open Graph Image URL" hint="Image used when sharing on Facebook, WhatsApp, etc. (1200×630 recommended).">
        <input
          value={seo.ogImage}
          onChange={e => onChange({ ...seo, ogImage: e.target.value })}
          className="input"
          placeholder="https://yoursite.com/og-image.jpg"
        />
        {seo.ogImage && (
          <img src={seo.ogImage} alt="OG preview" className="mt-3 rounded-xl border border-gray-100 max-h-48 object-cover" />
        )}
      </Field>

      {/* Live preview */}
      <div className="border-t pt-5 mt-2">
        <p className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-3">Google Preview</p>
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
          <p className="text-blue-700 text-base font-medium hover:underline cursor-pointer">{seo.title}</p>
          <p className="text-green-700 text-xs">jbjewellery.com</p>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{seo.description}</p>
        </div>
      </div>
    </div>
  );
}

// ─── FOOTER TAB ──────────────────────────────────────────────────────────
function FooterTab({ footer, onChange }: { footer: SiteSettings['footer']; onChange: (v: SiteSettings['footer']) => void }) {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Layout} title="Footer Information" subtitle="Contact details shown at the bottom of every page." />

      <Field label="About Text" hint="Short paragraph shown under the 'About JB' heading.">
        <textarea
          value={footer.aboutText}
          onChange={e => onChange({ ...footer, aboutText: e.target.value })}
          rows={3}
          className="input resize-none"
        />
      </Field>

      <Field label="Shop Address">
        <textarea
          value={footer.address}
          onChange={e => onChange({ ...footer, address: e.target.value })}
          rows={2}
          className="input resize-none"
        />
      </Field>

      <Field label="Shop Location Link" hint="Google Maps link — customers click 'View on Google Maps' to navigate.">
        <div className="relative">
          <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={footer.locationUrl}
            onChange={e => onChange({ ...footer, locationUrl: e.target.value })}
            className="input pl-9"
            placeholder="https://maps.google.com/?q=..."
          />
        </div>
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Phone Number">
          <input
            value={footer.phone}
            onChange={e => onChange({ ...footer, phone: e.target.value })}
            className="input"
            placeholder="+91 99999 99999"
          />
        </Field>

        <Field label="Email Address">
          <input
            type="email"
            value={footer.email}
            onChange={e => onChange({ ...footer, email: e.target.value })}
            className="input"
            placeholder="hello@yourstore.com"
          />
        </Field>
      </div>

      <Field label="Copyright Text">
        <input
          value={footer.copyrightText}
          onChange={e => onChange({ ...footer, copyrightText: e.target.value })}
          className="input"
        />
      </Field>
    </div>
  );
}

// ─── SOCIAL TAB ──────────────────────────────────────────────────────────
function SocialTab({ social, onChange }: { social: SiteSettings['social']; onChange: (v: SiteSettings['social']) => void }) {
  const items = [
    { key: 'instagram' as const, label: 'Instagram', icon: Instagram, color: 'from-pink-500 to-yellow-500', placeholder: 'https://instagram.com/yourbrand' },
    { key: 'facebook' as const, label: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-500', placeholder: 'https://facebook.com/yourbrand' },
    { key: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle, color: 'from-green-500 to-green-400', placeholder: 'https://wa.me/919999999999' },
    { key: 'twitter' as const, label: 'Twitter / X', icon: Twitter, color: 'from-gray-700 to-gray-900', placeholder: 'https://twitter.com/yourbrand' },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader icon={Share2} title="Social Media Links" subtitle="These show as clickable icons in the footer. Leave empty to hide." />

      {items.map(({ key, label, icon: Icon, color, placeholder }) => (
        <Field key={key} label={label}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <input
              value={social[key]}
              onChange={e => onChange({ ...social, [key]: e.target.value })}
              className="input"
              placeholder={placeholder}
            />
          </div>
        </Field>
      ))}
    </div>
  );
}

// ─── REVIEWS TAB ─────────────────────────────────────────────────────────
function ReviewsTab({ reviews, onChange }: { reviews: SiteSettings['reviews']; onChange: (v: SiteSettings['reviews']) => void }) {
  const addReview = () => {
    const id = String(Date.now());
    onChange({
      ...reviews,
      items: [...reviews.items, { id, name: '', initial: '', rating: 5, text: '' }],
    });
  };

  const updateReview = (id: string, patch: Partial<Review>) => {
    onChange({
      ...reviews,
      items: reviews.items.map(r => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const removeReview = (id: string) => {
    if (!confirm('Delete this review?')) return;
    onChange({ ...reviews, items: reviews.items.filter(r => r.id !== id) });
  };

  return (
    <div className="space-y-5">
      <SectionHeader icon={StarIcon} title="Customer Reviews" subtitle="Add or remove reviews shown on the homepage." />

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Average Rating (out of 5)">
          <input
            type="number"
            step="0.1"
            min={0}
            max={5}
            value={reviews.averageRating}
            onChange={e => onChange({ ...reviews, averageRating: Number(e.target.value) || 0 })}
            className="input"
          />
        </Field>

        <Field label="Total Customers Text">
          <input
            value={reviews.totalCustomers}
            onChange={e => onChange({ ...reviews, totalCustomers: e.target.value })}
            placeholder="10,000+"
            className="input"
          />
        </Field>
      </div>

      <div className="border-t pt-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-gray-900">Reviews ({reviews.items.length})</p>
          <button onClick={addReview} className="px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Review
          </button>
        </div>

        <div className="space-y-4">
          {reviews.items.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
              No reviews yet. Click "Add Review" to add one.
            </div>
          )}
          {reviews.items.map((rev, idx) => (
            <div key={rev.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Review #{idx + 1}</p>
                <button onClick={() => removeReview(rev.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <input
                  value={rev.name}
                  onChange={e => {
                    const name = e.target.value;
                    updateReview(rev.id, { name, initial: name ? name.charAt(0).toUpperCase() : '' });
                  }}
                  placeholder="Customer name (e.g. Riya S.)"
                  className="input sm:col-span-2"
                />
                <select
                  value={rev.rating}
                  onChange={e => updateReview(rev.id, { rating: Number(e.target.value) })}
                  className="input"
                >
                  {[5, 4, 3, 2, 1].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Star' : 'Stars'}</option>
                  ))}
                </select>
              </div>

              <textarea
                value={rev.text}
                onChange={e => updateReview(rev.id, { text: e.target.value })}
                rows={2}
                placeholder="What the customer said about your products..."
                className="input resize-none w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── INVOICE & GST TAB ───────────────────────────────────────────────────
function InvoiceTab({ business, onChange }: { business: SiteSettings['business']; onChange: (v: SiteSettings['business']) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const set = <K extends keyof SiteSettings['business']>(key: K, value: SiteSettings['business'][K]) =>
    onChange({ ...business, [key]: value });

  const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadBrandAsset(file, 'logo');
      set('logoUrl', url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={Receipt} title="Brand & Tax Invoice" subtitle="Used on the customer-facing tax invoice (orders + custom invoices)." />

      {/* Brand logo */}
      <Field label="Brand Logo" hint="Replaces the default 'JB' badge on tax invoices and customer emails. PNG with transparent background works best.">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt="Brand logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-xs text-gray-400">No logo</span>
            )}
          </div>
          <div className="flex-1">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 cursor-pointer">
              <Upload className="w-4 h-4" /> {uploading ? 'Uploading…' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={onPickLogo} disabled={uploading} />
            </label>
            {business.logoUrl && (
              <button
                onClick={() => set('logoUrl', '')}
                className="ml-3 inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100"
              >
                <X className="w-4 h-4" /> Remove
              </button>
            )}
            {uploadError && <p className="text-xs text-red-600 mt-2">{uploadError}</p>}
          </div>
        </div>
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Brand Name (display)">
          <input className="input" value={business.brandName} onChange={e => set('brandName', e.target.value)} placeholder="JB Jewellery Collection" />
        </Field>
        <Field label="Legal Entity Name" hint="Shown as 'For [Legal Name]' near signatory.">
          <input className="input" value={business.legalName} onChange={e => set('legalName', e.target.value)} />
        </Field>
      </div>

      <SectionHeader icon={Receipt} title="GST & Tax Details" subtitle="Configure GSTIN, default tax rate, HSN code and rounding behaviour." />

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="GSTIN" hint="15-character GSTIN. Leave blank to hide GST sections.">
          <input className="input" value={business.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} />
        </Field>
        <Field label="PAN">
          <input className="input" value={business.pan} onChange={e => set('pan', e.target.value.toUpperCase())} placeholder="AAAAA0000A" maxLength={10} />
        </Field>
        <Field label="CIN (optional)">
          <input className="input" value={business.cin} onChange={e => set('cin', e.target.value)} placeholder="U12345AB2024PTC123456" />
        </Field>
        <Field label="Invoice Number Prefix">
          <input className="input" value={business.invoicePrefix} onChange={e => set('invoicePrefix', e.target.value.replace(/\s+/g, '').toUpperCase().slice(0, 6))} placeholder="JB" />
        </Field>
        <Field label="Default GST Rate (%)" hint="e.g. 3 for jewellery, 5 / 12 / 18 / 28 for other categories.">
          <input type="number" min={0} max={28} step="0.01" className="input" value={business.defaultGstRate} onChange={e => set('defaultGstRate', Number(e.target.value) || 0)} />
        </Field>
        <Field label="Default HSN Code" hint='Common: "7117" (imitation jewellery), "7113" (gold/silver jewellery).'>
          <input className="input" value={business.defaultHsn} onChange={e => set('defaultHsn', e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="7117" />
        </Field>
      </div>

      <Field label="Tax Treatment">
        <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
          <input type="checkbox" className="w-4 h-4" checked={business.taxInclusive} onChange={e => set('taxInclusive', e.target.checked)} />
          <div>
            <div className="text-sm font-semibold text-gray-900">Prices are inclusive of GST</div>
            <div className="text-xs text-gray-500">When ON: the displayed price already includes GST and is split out on the invoice. When OFF: GST is added on top of the line total.</div>
          </div>
        </label>
        <label className="flex items-center gap-3 p-3 mt-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
          <input type="checkbox" className="w-4 h-4" checked={business.enableGst} onChange={e => set('enableGst', e.target.checked)} />
          <div>
            <div className="text-sm font-semibold text-gray-900">Show GST columns on invoices</div>
            <div className="text-xs text-gray-500">Disable to hide CGST/SGST/IGST columns (for businesses without GSTIN).</div>
          </div>
        </label>
      </Field>

      <SectionHeader icon={MapPin} title="Bill From / Ship From" subtitle="Used to compute Inter-State vs Intra-State (CGST+SGST vs IGST)." />

      <Field label="Bill From Address">
        <textarea rows={3} className="input resize-none" value={business.billFromAddress} onChange={e => set('billFromAddress', e.target.value)} placeholder="Building, street, city, pincode" />
      </Field>

      <Field label="Ship From Address" hint="Leave blank to use Bill From address.">
        <textarea rows={3} className="input resize-none" value={business.shipFromAddress} onChange={e => set('shipFromAddress', e.target.value)} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="State">
          <input className="input" value={business.billFromState} onChange={e => set('billFromState', e.target.value)} placeholder="Maharashtra" />
        </Field>
        <Field label="State Code (2-digit)" hint="e.g. 27 = Maharashtra, 07 = Delhi, 09 = Uttar Pradesh.">
          <input className="input" value={business.billFromStateCode} onChange={e => set('billFromStateCode', e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="27" maxLength={2} />
        </Field>
      </div>

      <SectionHeader icon={Receipt} title="Signatory & Support" subtitle="Shown in the invoice signature block and footer." />

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Authorized Signatory">
          <input className="input" value={business.signatoryName} onChange={e => set('signatoryName', e.target.value)} placeholder="Authorized Signatory" />
        </Field>
        <Field label="Customer Care Phone">
          <input className="input" value={business.supportPhone} onChange={e => set('supportPhone', e.target.value)} placeholder="+91 99999 99999" />
        </Field>
        <Field label="Customer Care Email">
          <input className="input" value={business.supportEmail} onChange={e => set('supportEmail', e.target.value)} />
        </Field>
        <Field label="Contact Us URL">
          <input className="input" value={business.contactUsUrl} onChange={e => set('contactUsUrl', e.target.value)} placeholder="https://yourshop.com/contact" />
        </Field>
      </div>

      <Field label="Declaration / Footer Note">
        <textarea rows={3} className="input resize-none" value={business.declaration} onChange={e => set('declaration', e.target.value)} />
      </Field>
    </div>
  );
}

// ─── REUSABLE FIELD COMPONENTS ────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-4 pb-4 border-b border-gray-100 mb-2">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
