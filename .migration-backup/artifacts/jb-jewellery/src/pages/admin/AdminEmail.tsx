import { useEffect, useMemo, useState } from 'react';
import {
  Mail, Send, Loader2, Eye, RefreshCcw, CheckCircle2, AlertTriangle,
  Users, ShieldCheck, Megaphone,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { emailTemplatesApi, type EmailTemplateMeta } from '@/lib/adminApi';

type Toast = { text: string; ok: boolean } | null;

const CATEGORY_META: Record<string, { color: string; bg: string; icon: typeof Users }> = {
  Customer: { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: Users },
  Admin: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: ShieldCheck },
  Marketing: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Megaphone },
};

export default function AdminEmail() {
  const [templates, setTemplates] = useState<EmailTemplateMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // Load template list on mount
  useEffect(() => {
    setLoading(true);
    emailTemplatesApi
      .list()
      .then(({ templates: t }) => {
        setTemplates(t);
        if (t.length > 0) setSelected(t[0].key);
      })
      .catch((err) => showToast(err.message || 'Failed to load templates', false))
      .finally(() => setLoading(false));
  }, []);

  const selectedMeta = useMemo(
    () => templates.find((t) => t.key === selected) || null,
    [templates, selected],
  );

  // Load preview whenever selection changes
  useEffect(() => {
    if (!selected) {
      setPreviewHtml('');
      return;
    }
    setPreviewLoading(true);
    emailTemplatesApi
      .preview(selected)
      .then(({ html, template }) => {
        setPreviewHtml(html);
        setSubject(template.defaultSubject);
      })
      .catch((err) => {
        setPreviewHtml(
          `<div style="padding:32px;font-family:sans-serif;color:#900;">Failed to load preview: ${(err as Error).message || 'unknown error'}</div>`,
        );
        showToast((err as Error).message || 'Preview failed', false);
      })
      .finally(() => setPreviewLoading(false));
  }, [selected]);

  const send = async () => {
    if (!selected || !toEmail) return;
    if (!/.+@.+\..+/.test(toEmail)) {
      showToast('Enter a valid email address', false);
      return;
    }
    setSending(true);
    try {
      await emailTemplatesApi.send(selected, { email: toEmail, subject: subject || undefined });
      showToast(`Email sent to ${toEmail}`);
      setToEmail('');
    } catch (err) {
      showToast((err as Error).message || 'Failed to send', false);
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-black" />
              </span>
              Email Templates
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Preview every email your store sends, and send a test or one-off email to any address.
            </p>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${
              toast.ok
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Template list */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Templates
                </p>
                <span className="text-[10px] font-bold text-gray-400">{templates.length}</span>
              </div>
              <div className="divide-y">
                {loading && (
                  <div className="px-4 py-10 flex justify-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
                {!loading &&
                  templates.map((t) => {
                    const cat = CATEGORY_META[t.category] || CATEGORY_META.Customer;
                    const Icon = cat.icon;
                    const active = selected === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setSelected(t.key)}
                        className={`w-full text-left px-4 py-3 transition-all ${
                          active ? 'bg-yellow-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center border ${cat.bg}`}
                          >
                            <Icon className={`w-4 h-4 ${cat.color}`} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-bold ${
                                active ? 'text-black' : 'text-gray-900'
                              } truncate`}
                            >
                              {t.name}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                              {t.audience}
                            </p>
                          </div>
                          {active && (
                            <span className="w-2 h-2 rounded-full bg-yellow-500 mt-1" />
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Preview + send */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* Meta */}
            {selectedMeta && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
                <div className="flex flex-wrap items-start gap-4 mb-4">
                  <div className="flex-1 min-w-[240px]">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                      {selectedMeta.category} email
                    </p>
                    <h2 className="text-xl font-black text-gray-900">{selectedMeta.name}</h2>
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                      {selectedMeta.description}
                    </p>
                  </div>
                  <button
                    onClick={() => selected && setSelected(selected)}
                    disabled={previewLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    <RefreshCcw className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
                    Refresh Preview
                  </button>
                </div>

                {/* Send form */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                    <Send className="w-3.5 h-3.5" />
                    Send this template
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Recipient email
                      </label>
                      <input
                        type="email"
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        placeholder="customer@example.com"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder={selectedMeta.defaultSubject}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-end">
                      <button
                        onClick={send}
                        disabled={sending || !toEmail}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-yellow-400 rounded-lg text-sm font-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Send
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
                    The template will be rendered with sample data and delivered immediately.
                    Order-based emails use sample order <code className="font-mono">#11111111</code>.
                  </p>
                </div>
              </div>
            )}

            {/* Preview iframe */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Preview
                </p>
                <span className="ml-auto text-[11px] text-gray-400">
                  Rendered with sample data
                </span>
              </div>
              <div className="relative bg-[#F5F5F0]" style={{ minHeight: 600 }}>
                {previewLoading && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-10 bg-white/60">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
                {previewHtml ? (
                  <iframe
                    title="email-preview"
                    srcDoc={previewHtml}
                    className="w-full block border-0"
                    style={{ minHeight: 800, height: 800 }}
                    sandbox="allow-same-origin"
                  />
                ) : (
                  !previewLoading && (
                    <div className="p-10 text-center text-gray-400 text-sm">
                      Select a template to preview.
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
