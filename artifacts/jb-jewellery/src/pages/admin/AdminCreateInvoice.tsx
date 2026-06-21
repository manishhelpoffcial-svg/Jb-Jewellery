import React, { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { invoicesApi, type InvoiceInput, type InvoiceLineInput, type InvoicePartyInput } from '@/lib/adminApi';
import {
  Receipt, Eye, Send, Plus, Trash2, Copy, CheckCircle, AlertCircle, User, Building2, ShoppingCart, Truck,
} from 'lucide-react';

// India state codes for the Place of Supply dropdown
const STATES: Array<{ code: string; name: string }> = [
  { code: '01', name: 'Jammu and Kashmir' }, { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' }, { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' }, { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' }, { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' }, { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' }, { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' }, { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' }, { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' }, { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' }, { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' }, { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' }, { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' }, { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' }, { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' }, { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' }, { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' }, { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
];

const emptyParty = (): InvoicePartyInput => ({
  name: '', address: '', state: '', stateCode: '', gstin: '', phone: '', email: '', customerType: 'Unregistered',
});

const emptyLine = (defaults: { hsn?: string; gstRate?: number }): InvoiceLineInput => ({
  description: '', hsn: defaults.hsn || '', qty: 1, unitPrice: 0, discount: 0, otherCharges: 0, gstRate: defaults.gstRate ?? 3,
});

export default function AdminCreateInvoice() {
  const { settings } = useSiteSettings();
  const business = settings.business;

  const today = new Date().toISOString().slice(0, 10);

  const [billTo, setBillTo] = useState<InvoicePartyInput>(emptyParty());
  const [shipSame, setShipSame] = useState(true);
  const [shipTo, setShipTo] = useState<InvoicePartyInput>(emptyParty());
  const [lines, setLines] = useState<InvoiceLineInput[]>([emptyLine({ hsn: business.defaultHsn, gstRate: business.defaultGstRate })]);
  const [shipping, setShipping] = useState(0);
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [orderDate, setOrderDate] = useState(today);
  const [orderNumber, setOrderNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  const [busy, setBusy] = useState<'preview' | 'send' | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill recipient email from billTo if blank
  React.useEffect(() => {
    if (!recipientEmail && billTo.email) setRecipientEmail(billTo.email);
  }, [billTo.email, recipientEmail]);

  const buildInvoice = (): InvoiceInput => ({
    invoiceNumber: invoiceNumber.trim() || undefined,
    invoiceDate: new Date(invoiceDate).toISOString(),
    orderNumber: orderNumber.trim() || undefined,
    orderDate: orderDate ? new Date(orderDate).toISOString() : undefined,
    natureOfSupply: 'Goods',
    placeOfSupply: billTo.state ? `${billTo.state}${billTo.stateCode ? ' (' + billTo.stateCode + ')' : ''}` : undefined,
    paymentMethod: paymentMethod.trim() || undefined,
    billTo,
    shipTo: shipSame ? billTo : shipTo,
    lines: lines.filter(l => l.description.trim() && l.qty > 0),
    shipping: Number(shipping) || 0,
    notes: notes.trim() || undefined,
  });

  // Live totals (mirror server logic; keep in sync with mailer.ts computeInvoice)
  const totals = useMemo(() => {
    const taxInclusive = business.taxInclusive !== false;
    const inter = !!(billTo.stateCode && business.billFromStateCode && billTo.stateCode !== business.billFromStateCode);
    let gross = 0, discount = 0, other = 0, taxable = 0, cgst = 0, sgst = 0, igst = 0, total = 0;
    for (const l of lines) {
      if (!l.description.trim() || !l.qty) continue;
      const lineGross = (Number(l.qty) || 0) * (Number(l.unitPrice) || 0);
      const lineDisc = Number(l.discount) || 0;
      const lineOther = Number(l.otherCharges) || 0;
      const rate = business.enableGst === false ? 0 : Number(l.gstRate ?? business.defaultGstRate ?? 0);
      let lineTotal: number, lineTaxable: number, lineTax: number;
      if (taxInclusive) {
        lineTotal = lineGross - lineDisc + lineOther;
        lineTaxable = rate > 0 ? lineTotal / (1 + rate / 100) : lineTotal;
        lineTax = lineTotal - lineTaxable;
      } else {
        lineTaxable = lineGross - lineDisc + lineOther;
        lineTax = lineTaxable * (rate / 100);
        lineTotal = lineTaxable + lineTax;
      }
      gross += lineGross; discount += lineDisc; other += lineOther;
      taxable += lineTaxable; total += lineTotal;
      if (rate > 0) {
        if (inter) igst += lineTax;
        else { cgst += lineTax / 2; sgst += lineTax / 2; }
      }
    }
    const grand = total + (Number(shipping) || 0);
    return { gross, discount, other, taxable, cgst, sgst, igst, total, shipping: Number(shipping) || 0, grand, inter };
  }, [lines, shipping, billTo.stateCode, business]);

  const updateLine = (idx: number, patch: Partial<InvoiceLineInput>) =>
    setLines(prev => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines(prev => [...prev, emptyLine({ hsn: business.defaultHsn, gstRate: business.defaultGstRate })]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const onPreview = async () => {
    setBusy('preview'); setError(null); setSuccess(null);
    try {
      const { html, invoiceNumber: nbr } = await invoicesApi.preview(buildInvoice());
      if (!invoiceNumber) setInvoiceNumber(nbr);
      const w = window.open('', '_blank');
      if (w) { w.document.open(); w.document.write(html); w.document.close(); }
      else setError('Pop-up blocked — please allow pop-ups to preview the invoice.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally { setBusy(null); }
  };

  const onSend = async () => {
    if (!recipientEmail.trim() || !/.+@.+\..+/.test(recipientEmail)) {
      setError('Enter a valid recipient email address.'); return;
    }
    if (!confirm(`Send tax invoice to ${recipientEmail}?`)) return;
    setBusy('send'); setError(null); setSuccess(null);
    try {
      const { sentTo, invoiceNumber: nbr } = await invoicesApi.send({
        to: recipientEmail.trim(),
        subject: emailSubject.trim() || undefined,
        invoice: buildInvoice(),
      });
      if (!invoiceNumber) setInvoiceNumber(nbr);
      setSuccess(`Tax invoice ${nbr} sent to ${sentTo}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invoice');
    } finally { setBusy(null); }
  };

  const copyState = (from: 'bill') => {
    if (from === 'bill') setShipTo({ ...billTo });
  };

  const inr = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const lineCount = lines.filter(l => l.description.trim() && l.qty > 0).length;
  const canSend = lineCount > 0 && billTo.name.trim() && recipientEmail.trim();

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
              <Receipt className="w-7 h-7 text-primary" /> Create Invoice
            </h1>
            <p className="text-sm text-gray-500 mt-1">Build a custom GST tax invoice and email it directly to the customer.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPreview}
              disabled={!!busy || lineCount === 0 || !billTo.name.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            >
              <Eye className="w-4 h-4" /> {busy === 'preview' ? 'Loading…' : 'Preview'}
            </button>
            <button
              onClick={onSend}
              disabled={!!busy || !canSend}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-black hover:bg-yellow-400 flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> {busy === 'send' ? 'Sending…' : 'Send Invoice'}
            </button>
          </div>
        </div>

        {!business.gstin && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              GSTIN is not configured. The invoice will render without your seller GSTIN/PAN. Add it under <strong>Settings → Invoice & GST</strong>.
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column: form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice metadata */}
            <Card icon={Receipt} title="Invoice Details">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Invoice Number (auto if blank)">
                  <input className="input" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="JB2604000001" />
                </Field>
                <Field label="Invoice Date">
                  <input type="date" className="input" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                </Field>
                <Field label="Order Number (optional)">
                  <input className="input" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} />
                </Field>
                <Field label="Order Date (optional)">
                  <input type="date" className="input" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
                </Field>
                <Field label="Payment Method (optional)">
                  <input className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} placeholder="UPI / Bank Transfer / Cash" />
                </Field>
                <Field label="Shipping Charges">
                  <input type="number" min={0} step="0.01" className="input" value={shipping} onChange={e => setShipping(Number(e.target.value) || 0)} />
                </Field>
              </div>
            </Card>

            {/* Bill To */}
            <Card icon={User} title="Bill To (Customer)">
              <PartyForm party={billTo} onChange={setBillTo} />
            </Card>

            {/* Ship To */}
            <Card
              icon={Truck}
              title="Ship To"
              right={
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <input type="checkbox" className="w-4 h-4" checked={shipSame} onChange={e => setShipSame(e.target.checked)} />
                  Same as Bill To
                </label>
              }
            >
              {!shipSame && (
                <div className="space-y-3">
                  <button onClick={() => copyState('bill')} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                    <Copy className="w-3 h-3" /> Copy from Bill To
                  </button>
                  <PartyForm party={shipTo} onChange={setShipTo} />
                </div>
              )}
              {shipSame && <p className="text-sm text-gray-500">Shipping to the same address as the billing party.</p>}
            </Card>

            {/* Line items */}
            <Card icon={ShoppingCart} title={`Line Items (${lineCount})`} right={
              <button onClick={addLine} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            }>
              <div className="space-y-3">
                {lines.map((l, i) => (
                  <LineRow
                    key={i}
                    line={l}
                    onChange={p => updateLine(i, p)}
                    onRemove={lines.length > 1 ? () => removeLine(i) : undefined}
                  />
                ))}
              </div>
            </Card>

            <Card icon={Building2} title="Notes (optional)">
              <textarea rows={3} className="input resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any extra notes shown on the invoice…" />
            </Card>

            <Card icon={Send} title="Email">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Recipient Email">
                  <input type="email" className="input" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="customer@example.com" />
                </Field>
                <Field label="Subject (optional)">
                  <input className="input" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder={`Tax Invoice ${invoiceNumber || ''} from ${business.brandName}`} />
                </Field>
              </div>
            </Card>
          </div>

          {/* Right: live totals */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Invoice Summary</p>
                <div className="space-y-2 text-sm">
                  <Row label="Gross" value={inr(totals.gross)} />
                  {totals.discount > 0 && <Row label="Discount" value={`−${inr(totals.discount)}`} className="text-green-600" />}
                  {totals.other > 0 && <Row label="Other Charges" value={inr(totals.other)} />}
                  <Row label="Taxable" value={inr(totals.taxable)} />
                  {totals.cgst > 0 && <Row label="CGST" value={inr(totals.cgst)} />}
                  {totals.sgst > 0 && <Row label="SGST" value={inr(totals.sgst)} />}
                  {totals.igst > 0 && <Row label="IGST" value={inr(totals.igst)} />}
                  {totals.shipping > 0 && <Row label="Shipping" value={inr(totals.shipping)} />}
                </div>
                <div className="border-t border-gray-200 mt-4 pt-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">Grand Total</span>
                  <span className="text-xl font-black text-gray-900">{inr(totals.grand)}</span>
                </div>
                <p className="mt-2 text-[11px] text-gray-400">
                  {totals.inter ? 'Inter-State (IGST applies)' : 'Intra-State (CGST + SGST split)'}
                  {' · '}{business.taxInclusive ? 'Prices inclusive of GST' : 'Prices exclusive of GST'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Card({ icon: Icon, title, right, children }: { icon: React.ComponentType<{ className?: string }>; title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" /> {title}
        </h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function Row({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function PartyForm({ party, onChange }: { party: InvoicePartyInput; onChange: (p: InvoicePartyInput) => void }) {
  const set = <K extends keyof InvoicePartyInput>(k: K, v: InvoicePartyInput[K]) => onChange({ ...party, [k]: v });
  const onStateChange = (code: string) => {
    const found = STATES.find(s => s.code === code);
    onChange({ ...party, stateCode: code, state: found?.name || party.state });
  };
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Name"><input className="input" value={party.name} onChange={e => set('name', e.target.value)} /></Field>
      <Field label="Customer Type">
        <select className="input" value={party.customerType || 'Unregistered'} onChange={e => set('customerType', e.target.value)}>
          <option value="Unregistered">Unregistered</option>
          <option value="Registered">Registered (with GSTIN)</option>
        </select>
      </Field>
      <Field label="Address"><textarea rows={2} className="input resize-none" value={party.address} onChange={e => set('address', e.target.value)} placeholder="Building, street, city, pincode" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="State Code">
          <select className="input" value={party.stateCode || ''} onChange={e => onStateChange(e.target.value)}>
            <option value="">— Select —</option>
            {STATES.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
          </select>
        </Field>
        <Field label="State Name">
          <input className="input" value={party.state || ''} onChange={e => set('state', e.target.value)} />
        </Field>
      </div>
      <Field label="GSTIN (optional)"><input className="input" value={party.gstin || ''} onChange={e => set('gstin', e.target.value.toUpperCase())} maxLength={15} /></Field>
      <Field label="Phone"><input className="input" value={party.phone || ''} onChange={e => set('phone', e.target.value)} /></Field>
      <Field label="Email"><input type="email" className="input" value={party.email || ''} onChange={e => set('email', e.target.value)} /></Field>
    </div>
  );
}

function LineRow({ line, onChange, onRemove }: { line: InvoiceLineInput; onChange: (p: Partial<InvoiceLineInput>) => void; onRemove?: () => void }) {
  return (
    <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/40">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
        <div className="sm:col-span-4">
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Description</label>
          <input className="input" value={line.description} onChange={e => onChange({ description: e.target.value })} placeholder="Product name" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">HSN</label>
          <input className="input" value={line.hsn || ''} onChange={e => onChange({ hsn: e.target.value })} placeholder="7117" />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Qty</label>
          <input type="number" min={0} className="input" value={line.qty} onChange={e => onChange({ qty: Number(e.target.value) || 0 })} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Unit Price</label>
          <input type="number" min={0} step="0.01" className="input" value={line.unitPrice} onChange={e => onChange({ unitPrice: Number(e.target.value) || 0 })} />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">GST %</label>
          <input type="number" min={0} step="0.01" className="input" value={line.gstRate ?? 0} onChange={e => onChange({ gstRate: Number(e.target.value) || 0 })} />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Disc.</label>
          <input type="number" min={0} step="0.01" className="input" value={line.discount ?? 0} onChange={e => onChange({ discount: Number(e.target.value) || 0 })} />
        </div>
        <div className="sm:col-span-1 flex items-center justify-end">
          {onRemove && (
            <button onClick={onRemove} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Remove">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
