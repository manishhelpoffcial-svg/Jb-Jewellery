import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/data/products';

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  savedItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  saveForLater: (productId: string) => void;
  moveToCart: (productId: string) => void;
  removeSaved: (productId: string) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  cartCount: number;
  cartTotal: number;
  savedCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('jb-cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [savedItems, setSavedItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('jb-saved-for-later');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('jb-cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('jb-saved-for-later', JSON.stringify(savedItems));
  }, [savedItems]);

  const addToCart = (product: Product) => {
    setItems(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems(current => current.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('jb-cart');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId);
    setItems(current =>
      current.map(item => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const saveForLater = (productId: string) => {
    setItems(current => {
      const item = current.find(i => i.id === productId);
      if (!item) return current;
      setSavedItems(saved => {
        if (saved.some(s => s.id === productId)) return saved;
        return [{ ...item, quantity: item.quantity }, ...saved];
      });
      return current.filter(i => i.id !== productId);
    });
  };

  const moveToCart = (productId: string) => {
    setSavedItems(saved => {
      const item = saved.find(i => i.id === productId);
      if (!item) return saved;
      setItems(current => {
        const exists = current.find(c => c.id === productId);
        if (exists) {
          return current.map(c => (c.id === productId ? { ...c, quantity: c.quantity + item.quantity } : c));
        }
        return [...current, item];
      });
      return saved.filter(i => i.id !== productId);
    });
  };

  const removeSaved = (productId: string) => {
    setSavedItems(saved => saved.filter(i => i.id !== productId));
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const savedCount = savedItems.length;

  return (
    <CartContext.Provider value={{
      items, savedItems, addToCart, removeFromCart, updateQuantity, clearCart,
      saveForLater, moveToCart, removeSaved,
      isCartOpen, setIsCartOpen, cartCount, cartTotal, savedCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
