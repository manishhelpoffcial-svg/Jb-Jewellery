import { CartItem } from '@/context/CartContext';
import { api } from '@/lib/api';

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

export async function saveOrder(order: Order): Promise<Order> {
  try {
    const { order: saved } = await api.orders.create({
      customerName: order.customerName,
      phone: order.phone,
      email: order.email,
      items: order.items,
      address: order.address,
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      discount: order.discount,
      couponCode: order.couponCode,
      grandTotal: order.grandTotal,
    });
    const mapped: Order = {
      orderId: saved.id,
      userId: saved.user_id,
      customerName: saved.customer_name,
      phone: saved.phone,
      email: saved.email,
      items: saved.items as CartItem[],
      address: saved.address as Address,
      subtotal: saved.subtotal,
      shipping: saved.shipping,
      tax: saved.tax,
      discount: saved.discount,
      couponCode: saved.coupon_code,
      grandTotal: saved.grand_total,
      status: saved.status as Order['status'],
      statusHistory: (saved.status_history || []).map(h => ({ status: h.status, time: h.timestamp })),
      whatsappSent: saved.whatsapp_sent,
      createdAt: saved.created_at,
    };
    saveOrderLocally(mapped);
    return mapped;
  } catch {
    saveOrderLocally(order);
    return order;
  }
}

export async function getMyOrders(userId: string): Promise<Order[]> {
  try {
    const { orders } = await api.orders.my();
    return orders.map(o => ({
      orderId: o.id,
      userId: o.user_id,
      customerName: o.customer_name,
      phone: o.phone,
      email: o.email,
      items: o.items as CartItem[],
      address: o.address as Address,
      subtotal: o.subtotal,
      shipping: o.shipping,
      tax: o.tax,
      discount: o.discount,
      couponCode: o.coupon_code,
      grandTotal: o.grand_total,
      status: o.status as Order['status'],
      statusHistory: (o.status_history || []).map(h => ({ status: h.status, time: h.timestamp })),
      whatsappSent: o.whatsapp_sent,
      createdAt: o.created_at,
    }));
  } catch {
    return getLocalOrders(userId);
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const { orders } = await api.orders.all();
    return orders.map(o => ({
      orderId: o.id,
      userId: o.user_id,
      customerName: o.customer_name,
      phone: o.phone,
      email: o.email,
      items: o.items as CartItem[],
      address: o.address as Address,
      subtotal: o.subtotal,
      shipping: o.shipping,
      tax: o.tax,
      discount: o.discount,
      couponCode: o.coupon_code,
      grandTotal: o.grand_total,
      status: o.status as Order['status'],
      statusHistory: (o.status_history || []).map(h => ({ status: h.status, time: h.timestamp })),
      whatsappSent: o.whatsapp_sent,
      createdAt: o.created_at,
    }));
  } catch {
    return getAllLocalOrders();
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status'], note?: string): Promise<void> {
  try {
    await api.orders.updateStatus(orderId, status, note);
  } catch {
    updateLocalOrderStatus(orderId, status);
  }
}

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
