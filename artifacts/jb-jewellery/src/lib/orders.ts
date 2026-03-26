import { CartItem } from '@/context/CartContext';

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

const WA_NUMBER = '919999999999';

export function openWhatsApp(message: string) {
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}

export function saveOrderLocally(order: Order) {
  const existing = JSON.parse(localStorage.getItem('jb-orders') || '[]') as Order[];
  existing.unshift(order);
  localStorage.setItem('jb-orders', JSON.stringify(existing));
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
