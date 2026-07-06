'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  availableQuantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  /** Retorna false (sem alterar o carrinho) quando a quantidade solicitada excede o estoque disponível. */
  addItem: (product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
    availableQuantity: number;
  }) => boolean;
  /** Retorna false (sem alterar o carrinho) quando a quantidade solicitada excede o estoque disponível. */
  updateQuantity: (productId: string, quantity: number) => boolean;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CART_STORAGE_KEY = 'storefront.cart';

const CartContext = createContext<CartContextValue | null>(null);

function loadInitialItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    // Carrinhos salvos antes do controle de estoque não têm availableQuantity;
    // trava o incremento até o item ser adicionado novamente (o que atualiza o valor).
    return parsed.map((item) => ({
      ...item,
      availableQuantity: typeof item.availableQuantity === 'number' ? item.availableQuantity : item.quantity,
    }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadInitialItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback(
    (product: {
      id: string;
      name: string;
      price: number;
      image: string | null;
      availableQuantity: number;
    }) => {
      const existing = items.find((item) => item.productId === product.id);
      const nextQuantity = (existing?.quantity ?? 0) + 1;
      if (nextQuantity > product.availableQuantity) {
        return false;
      }

      setItems((current) => {
        const currentExisting = current.find((item) => item.productId === product.id);
        if (currentExisting) {
          return current.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1, availableQuantity: product.availableQuantity }
              : item,
          );
        }
        return [
          ...current,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image,
            availableQuantity: product.availableQuantity,
          },
        ];
      });
      return true;
    },
    [items],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((current) => current.filter((item) => item.productId !== productId));
        return true;
      }

      const existing = items.find((item) => item.productId === productId);
      if (existing && quantity > existing.availableQuantity) {
        return false;
      }

      setItems((current) =>
        current.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
      );
      return true;
    },
    [items],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items],
  );

  const value = useMemo(
    () => ({ items, totalItems, totalPrice, addItem, updateQuantity, removeItem, clear }),
    [items, totalItems, totalPrice, addItem, updateQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de <CartProvider>.');
  }
  return context;
}
