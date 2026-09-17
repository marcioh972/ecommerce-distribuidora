import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem, ClientePerfil } from "./types";
import { api } from "./api";

type Auth = {
  user: ClientePerfil | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  reload: () => void;
};
const AuthContext = createContext<Auth | null>(null);
export const useAuth = () => useContext(AuthContext)!;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientePerfil | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const token = localStorage.getItem("access");
    if (!token) { setLoading(false); return; }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("auth-change", onChange);
    return () => window.removeEventListener("auth-change", onChange);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    const me = await api.me();
    setUser(me);
    window.dispatchEvent(new Event("auth-change"));
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
    window.dispatchEvent(new Event("auth-change"));
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, reload: load }}>{children}</AuthContext.Provider>;
}

type Cart = {
  items: CartItem[];
  add: (item: CartItem) => void;
  updateQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  total: number;
  count: number;
};
const CartContext = createContext<Cart | null>(null);
export const useCart = () => useContext(CartContext)!;

function loadCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; }
}
function saveCart(items: CartItem[]) { localStorage.setItem("cart", JSON.stringify(items)); }

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => { saveCart(items); }, [items]);

  const add = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === item.slug);
      if (existing) return prev.map((i) => i.slug === item.slug ? { ...i, quantidade: i.quantidade + item.quantidade } : i);
      return [...prev, item];
    });
  };

  const updateQty = (slug: string, qty: number) => {
    if (qty <= 0) setItems((prev) => prev.filter((i) => i.slug !== slug));
    else setItems((prev) => prev.map((i) => i.slug === slug ? { ...i, quantidade: qty } : i));
  };

  const remove = (slug: string) => setItems((prev) => prev.filter((i) => i.slug !== slug));
  const clear = () => setItems([]);

  const total = useMemo(() => items.reduce((sum, i) => {
    const preco = i.preco_promocional ? parseFloat(i.preco_promocional) : parseFloat(i.preco_unidade);
    return sum + preco * i.quantidade;
  }, 0), [items]);

  const count = useMemo(() => items.reduce((s, i) => s + i.quantidade, 0), [items]);

  return <CartContext.Provider value={{ items, add, updateQty, remove, clear, total, count }}>{children}</CartContext.Provider>;
}
