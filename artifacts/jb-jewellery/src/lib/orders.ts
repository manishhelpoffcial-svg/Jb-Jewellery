import { CartItem } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { adminApi } from '@/lib/adminApi';

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  orderId: string;
  userId: string;
  customerName: string;
  phone: string;
  email: string;
  items: CartItem[];
  address: Address;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  couponCode: string;
  grandTotal: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  statusHistory: { status: string; time: string }[];
  whatsappSent: boolean;
  invoiceUrl?: string | null;
  createdAt: string;
}

export function generateOrderId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `JB${year}-${rand}`;
}

export function buildWhatsAppMessage(order: Order): string {
  const itemNums = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
  const date = new Date(order.createdAt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const itemLines = order.items.map((item, i) =>
    `${itemNums[i] || `${i+1}.`} ${item.name}\n   Qty: ${item.quantity} | ₹${item.price} each\n   Subtotal: ₹${item.price * item.quantity}`
  ).join('\n\n');

  const msg = `🛍️ *JB JEWELLERY COLLECTION — NEW ORDER*
━━━━━━━━━━━━━━━━━━━━━━━━━━

🔖 *Order ID:* #${order.orderId}
🕐 *Date:* ${date}

━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *CUSTOMER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:    ${order.customerName}
Phone:   +91 ${order.phone}
Email:   ${order.email}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 *ORDER ITEMS*
━━━━━━━━━━━━━━━━━━━━━━━━━━
${itemLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *PRICE BREAKDOWN*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal:      ₹${order.subtotal}
Shipping:        ₹${order.shipping}
Tax (5%):        ₹${order.tax}${order.discount > 0 ? `\nDiscount${order.couponCode ? ` (${order.couponCode})` : ''}:    -₹${order.discount}` : ''}
──────────────────────────
*💛 GRAND TOTAL: ₹${order.grandTotal}*

━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *DELIVERY ADDRESS*
━━━━━━━━━━━━━━━━━━━━━━━━━━
${order.address.fullName}
${order.address.line1}${order.address.line2 ? ', ' + order.address.line2 : ''}
${order.address.city}, ${order.address.state} - ${order.address.pincode}
📞 +91 ${order.address.phone}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💛 JB Jewellery Collection
━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  return msg;
}

const WA_NUMBER = '917432920601';

export function openWhatsApp(message: string) {
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}

// ── Mapping helpers ────────────────────────────────────────────────────────
interface SbOrderRow {
  id: string;
  user_id: string | null;
  customer_name: string;
  phone: string;
  email: string;
  items: CartItem[] | unknown;
  address: Address | unknown;
  subtotal: number | string;
  shipping: number | string;
  tax: number | string;
  discount: number | string;
  coupon_code: string | null;
  grand_total: number | string;
  status: string;
  status_history: { status: string; timestamp: string; note?: string }[] | null;
  whatsapp_sent: boolean | null;
  invoice_url: string | null;
  created_at: string;
}

function mapRow(r: SbOrderRow): Order {
  return {
    orderId: r.id,
    userId: r.user_id || '',
    customerName: r.customer_name,
    phone: r.phone,
    email: r.email,
    items: (r.items as CartItem[]) || [],
    address: (r.address as Address) || ({} as Address),
    subtotal: Number(r.subtotal),
    shipping: Number(r.shipping),
    tax: Number(r.tax),
    discount: Number(r.discount),
    couponCode: r.coupon_code || '',
    grandTotal: Number(r.grand_total),
    status: (r.status as Order['status']) || 'pending',
    statusHistory: (r.status_history || []).map((h) => ({
      status: h.status,
      time: h.timestamp,
    })),
    whatsappSent: !!r.whatsapp_sent,
    invoiceUrl: r.invoice_url,
    createdAt: r.created_at,
  };
}

// ── Persistence ───────────────────────────────────────────────────────────
export async function saveOrder(order: Order): Promise<Order> {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess?.session?.user?.id || order.userId;
    const now = new Date().toISOString();
    const statusHistory = [{ status: 'pending', timestamp: now, note: 'Order placed' }];

    const insertRow = {
      id: order.orderId,
      user_id: uid || null,
      customer_name: order.customerName,
      phone: order.phone,
      email: order.email,
      items: order.items,
      address: order.address,
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      discount: order.discount,
      coupon_code: order.couponCode || null,
      grand_total: order.grandTotal,
      status: 'pending',
      status_history: statusHistory,
      whatsapp_sent: false,
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(insertRow)
      .select()
      .single();
    if (error) throw error;

    const saved = mapRow(data as SbOrderRow);
    saveOrderLocally(saved);
    return saved;
  } catch (err) {
    console.warn('[orders] Supabase insert failed, using local fallback', err);
    saveOrderLocally(order);
    return order;
  }
}

export async function getMyOrders(userId: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data || []) as SbOrderRow[]).map(mapRow);
  } catch {
    return getLocalOrders(userId);
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const { orders } = await adminApi.listOrders();
    return orders.map((o) =>
      mapRow({
        ...o,
        items: o.items,
        address: o.address,
      } as unknown as SbOrderRow),
    );
  } catch (err) {
    console.warn('[orders] admin list failed', err);
    return getAllLocalOrders();
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  note?: string,
): Promise<void> {
  try {
    await adminApi.updateOrderStatus(orderId, status, note);
  } catch {
    updateLocalOrderStatus(orderId, status);
  }
}

// ── Local fallback (used only when Supabase is unreachable) ───────────────
export function saveOrderLocally(order: Order) {
  const existing = JSON.parse(localStorage.getItem('jb-orders') || '[]') as Order[];
  const filtered = existing.filter(o => o.orderId !== order.orderId);
  filtered.unshift(order);
  localStorage.setItem('jb-orders', JSON.stringify(filtered));
}

export function getLocalOrders(userId: string): Order[] {
  const all = JSON.parse(localStorage.getItem('jb-orders') || '[]') as Order[];
  return all.filter(o => o.userId === userId);
}

export function getAllLocalOrders(): Order[] {
  return JSON.parse(localStorage.getItem('jb-orders') || '[]') as Order[];
}

export function updateLocalOrderStatus(orderId: string, status: Order['status']) {
  const all = JSON.parse(localStorage.getItem('jb-orders') || '[]') as Order[];
  const updated = all.map(o =>
    o.orderId === orderId
      ? { ...o, status, statusHistory: [...o.statusHistory, { status, time: new Date().toISOString() }] }
      : o
  );
  localStorage.setItem('jb-orders', JSON.stringify(updated));
}
