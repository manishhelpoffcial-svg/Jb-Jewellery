// Lightweight per-user "profile extras" store backed by localStorage.
// Stores fields that are not in the Supabase profiles table:
//   - avatarDataUrl   (base64 data URL for profile picture)
//   - dob             (yyyy-mm-dd)
//   - anniversary     (yyyy-mm-dd)
// Also exposes helpers for: returns/refunds, saved payment methods,
// wallet balance, support tickets, and a notification feed.

const ns = (key: string, uid?: string | null) => `jb-${key}${uid ? `:${uid}` : ''}`;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

// ── Profile extras ───────────────────────────────────────────────────────────
export interface ProfileExtras {
  avatarDataUrl?: string;
  dob?: string;
  anniversary?: string;
}
export function getProfileExtras(uid?: string | null): ProfileExtras {
  return read<ProfileExtras>(ns('profile-extras', uid), {});
}
export function setProfileExtras(uid: string, extras: ProfileExtras) {
  write(ns('profile-extras', uid), { ...getProfileExtras(uid), ...extras });
}

// ── Returns / Refunds / Exchanges ────────────────────────────────────────────
export type ReturnKind = 'return' | 'exchange' | 'cancel';
export type ReturnStatus =
  | 'pending'
  | 'approved'
  | 'pickup_scheduled'
  | 'received'
  | 'refunded'
  | 'rejected';

export interface ReturnRequest {
  id: string;
  orderId: string;
  productName: string;
  kind: ReturnKind;
  reason: string;
  notes?: string;
  amount: number;
  status: ReturnStatus;
  createdAt: string;
  updatedAt: string;
}

const RETURNS_KEY = (uid?: string | null) => ns('returns', uid);

export function getReturns(uid?: string | null): ReturnRequest[] {
  return read<ReturnRequest[]>(RETURNS_KEY(uid), []);
}

export function addReturn(uid: string, req: Omit<ReturnRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
  const list = getReturns(uid);
  const now = new Date().toISOString();
  const entry: ReturnRequest = {
    ...req,
    id: `RR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  write(RETURNS_KEY(uid), [entry, ...list]);
  pushNotification(uid, {
    kind: 'refund',
    title: `${req.kind === 'return' ? 'Return' : req.kind === 'exchange' ? 'Exchange' : 'Cancellation'} requested`,
    message: `Request raised for order #${req.orderId.slice(0, 8).toUpperCase()}.`,
  });
  return entry;
}

export function cancelReturn(uid: string, id: string) {
  const list = getReturns(uid).filter(r => r.id !== id);
  write(RETURNS_KEY(uid), list);
}

// ── Saved payment methods ────────────────────────────────────────────────────
export type PaymentMethodKind = 'upi' | 'card' | 'cod' | 'netbanking';
export interface SavedPaymentMethod {
  id: string;
  kind: PaymentMethodKind;
  label: string;       // e.g. "ICICI Visa **** 4242"
  detail?: string;     // e.g. "Expires 04/29"
  isDefault?: boolean;
}

const PAYMETHODS_KEY = (uid?: string | null) => ns('paymethods', uid);

export function getPaymentMethods(uid?: string | null): SavedPaymentMethod[] {
  return read<SavedPaymentMethod[]>(PAYMETHODS_KEY(uid), []);
}
export function addPaymentMethod(uid: string, m: Omit<SavedPaymentMethod, 'id'>) {
  const list = getPaymentMethods(uid);
  const entry: SavedPaymentMethod = { ...m, id: `pm-${Math.random().toString(36).slice(2, 8)}` };
  if (entry.isDefault) list.forEach(x => (x.isDefault = false));
  write(PAYMETHODS_KEY(uid), [entry, ...list]);
  return entry;
}
export function deletePaymentMethod(uid: string, id: string) {
  write(PAYMETHODS_KEY(uid), getPaymentMethods(uid).filter(m => m.id !== id));
}
export function setDefaultPaymentMethod(uid: string, id: string) {
  write(
    PAYMETHODS_KEY(uid),
    getPaymentMethods(uid).map(m => ({ ...m, isDefault: m.id === id })),
  );
}

// ── Wallet ───────────────────────────────────────────────────────────────────
export interface WalletTxn {
  id: string;
  delta: number;
  reason: string;
  createdAt: string;
}
const WALLET_KEY = (uid?: string | null) => ns('wallet', uid);
export function getWallet(uid?: string | null): { balance: number; txns: WalletTxn[] } {
  return read(WALLET_KEY(uid), { balance: 0, txns: [] });
}
export function addWalletTxn(uid: string, delta: number, reason: string) {
  const w = getWallet(uid);
  const txn: WalletTxn = {
    id: `wt-${Math.random().toString(36).slice(2, 8)}`,
    delta,
    reason,
    createdAt: new Date().toISOString(),
  };
  write(WALLET_KEY(uid), { balance: w.balance + delta, txns: [txn, ...w.txns] });
}

// ── Support tickets ──────────────────────────────────────────────────────────
export interface SupportTicket {
  id: string;
  subject: string;
  category: 'order' | 'payment' | 'delivery' | 'product' | 'account' | 'other';
  message: string;
  orderId?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
}
const TICKETS_KEY = (uid?: string | null) => ns('tickets', uid);
export function getTickets(uid?: string | null) {
  return read<SupportTicket[]>(TICKETS_KEY(uid), []);
}
export function addTicket(uid: string, t: Omit<SupportTicket, 'id' | 'status' | 'createdAt'>) {
  const list = getTickets(uid);
  const entry: SupportTicket = {
    ...t,
    id: `TKT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  write(TICKETS_KEY(uid), [entry, ...list]);
  pushNotification(uid, {
    kind: 'support',
    title: 'Ticket raised',
    message: `Ticket ${entry.id} — “${entry.subject}” is being reviewed.`,
  });
  return entry;
}

// ── Notification feed ────────────────────────────────────────────────────────
export type NotifKind = 'order' | 'offer' | 'delivery' | 'refund' | 'support';
export interface Notification {
  id: string;
  kind: NotifKind;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}
const NOTIF_KEY = (uid?: string | null) => ns('notifications', uid);
export function getNotifications(uid?: string | null) {
  return read<Notification[]>(NOTIF_KEY(uid), []);
}
export function pushNotification(
  uid: string,
  n: Omit<Notification, 'id' | 'createdAt' | 'read'>,
) {
  const list = getNotifications(uid);
  const entry: Notification = {
    ...n,
    id: `nt-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  write(NOTIF_KEY(uid), [entry, ...list].slice(0, 100));
}
export function markNotificationRead(uid: string, id: string) {
  write(NOTIF_KEY(uid), getNotifications(uid).map(n => (n.id === id ? { ...n, read: true } : n)));
}
export function markAllNotificationsRead(uid: string) {
  write(NOTIF_KEY(uid), getNotifications(uid).map(n => ({ ...n, read: true })));
}
export function clearNotifications(uid: string) {
  write(NOTIF_KEY(uid), []);
}
