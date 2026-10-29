"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { DEFAULT_FILTER, findProduct, PRODUCTS, type Product, type ProductFilter } from "./products";

export interface CartLine { productId: string; qty: number }
export interface Address { fullName: string; street: string; city: string; postalCode: string; phone: string }
export type DeliveryMethod = "standard" | "express" | "collect";
export const DELIVERY: Record<DeliveryMethod, { label: string; price: number; eta: string }> = {
  standard: { label: "Standard delivery", price: 60, eta: "3–5 working days" },
  express: { label: "Express delivery", price: 130, eta: "Next working day" },
  collect: { label: "Click & collect", price: 0, eta: "Ready in 2 hours" },
};
export interface Order { id: string; lines: { product: Product; qty: number }[]; subtotal: number; shipping: number; total: number; address: Address; delivery: DeliveryMethod; cardLast4: string; placedAt: string }
export interface CheckoutState { step: "address" | "delivery" | "payment" | "done"; address: Address; delivery: DeliveryMethod }

export const DEMO_USER = { name: "Thandi Demo", email: "demo@superapp.test", password: "demo1234" };
const EMPTY_ADDRESS: Address = { fullName: DEMO_USER.name, street: "12 Vilakazi Street", city: "Johannesburg", postalCode: "2001", phone: "082 000 0000" };

interface Persisted { user: string | null; cart: CartLine[]; order: Order | null; checkout: CheckoutState }
const INITIAL: Persisted = { user: null, cart: [], order: null, checkout: { step: "address", address: EMPTY_ADDRESS, delivery: "standard" } };

type Action =
  | { t: "hydrate"; s: Persisted }
  | { t: "login"; email: string }
  | { t: "logout" }
  | { t: "add"; id: string; qty: number }
  | { t: "setQty"; id: string; qty: number }
  | { t: "remove"; id: string }
  | { t: "clear" }
  | { t: "checkout"; patch: Partial<CheckoutState> }
  | { t: "place"; order: Order };

function reducer(s: Persisted, a: Action): Persisted {
  switch (a.t) {
    case "hydrate": return a.s;
    case "login": return { ...s, user: a.email };
    case "logout": return { ...INITIAL };
    case "add": {
      const p = PRODUCTS.find((x) => x.id === a.id);
      if (!p) return s;
      const ex = s.cart.find((l) => l.productId === a.id);
      const qty = Math.min(p.stock, (ex?.qty ?? 0) + a.qty);
      return { ...s, cart: ex ? s.cart.map((l) => (l.productId === a.id ? { ...l, qty } : l)) : [...s.cart, { productId: a.id, qty }] };
    }
    case "setQty": {
      const p = PRODUCTS.find((x) => x.id === a.id);
      if (!p) return s;
      if (a.qty <= 0) return { ...s, cart: s.cart.filter((l) => l.productId !== a.id) };
      return { ...s, cart: s.cart.map((l) => (l.productId === a.id ? { ...l, qty: Math.min(p.stock, a.qty) } : l)) };
    }
    case "remove": return { ...s, cart: s.cart.filter((l) => l.productId !== a.id) };
    case "clear": return { ...s, cart: [] };
    case "checkout": return { ...s, checkout: { ...s.checkout, ...a.patch } };
    case "place": return { ...s, order: a.order, cart: [], checkout: { ...s.checkout, step: "done" } };
  }
}

export interface CartSummary { lines: { product: Product; qty: number }[]; count: number; subtotal: number; shipping: number; total: number }

interface StoreValue {
  ready: boolean;
  user: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  cart: CartLine[];
  summary: CartSummary;
  addToCart: (id: string, qty?: number) => Product | undefined;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => Product | undefined;
  clearCart: () => void;
  filter: ProductFilter;
  setFilter: (patch: Partial<ProductFilter>) => void;
  checkout: CheckoutState;
  updateCheckout: (patch: Partial<CheckoutState>) => void;
  order: Order | null;
  placeOrder: (cardLast4: string) => Order | null;
  /** read latest state synchronously (for copilot action handlers) */
  getSummary: () => CartSummary;
}

const Ctx = createContext<StoreValue | null>(null);
const KEY = "superapp-demo-v1";

function summarise(cart: CartLine[], delivery: DeliveryMethod): CartSummary {
  const lines = cart.flatMap((l) => { const product = PRODUCTS.find((p) => p.id === l.productId); return product ? [{ product, qty: l.qty }] : []; });
  const subtotal = lines.reduce((n, l) => n + l.product.price * l.qty, 0);
  const shipping = lines.length ? DELIVERY[delivery].price : 0;
  return { lines, count: lines.reduce((n, l) => n + l.qty, 0), subtotal, shipping, total: subtotal + shipping };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [ready, setReady] = useState(false);
  const [filter, setFilterState] = useState<ProductFilter>(DEFAULT_FILTER);
  const ref = useRef(state);
  useEffect(() => { ref.current = state; }, [state]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) dispatch({ t: "hydrate", s: { ...INITIAL, ...JSON.parse(raw) } });
    } catch { /* ignore corrupt storage */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client hydration from localStorage
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(state)); }, [state, ready]);

  const summary = useMemo(() => summarise(state.cart, state.checkout.delivery), [state.cart, state.checkout.delivery]);

  const login = useCallback((email: string, password: string) => {
    if (email.trim().toLowerCase() === DEMO_USER.email && password === DEMO_USER.password) { dispatch({ t: "login", email }); return true; }
    return false;
  }, []);

  const value: StoreValue = {
    ready, user: state.user, login, logout: () => dispatch({ t: "logout" }),
    cart: state.cart, summary,
    addToCart: (id, qty = 1) => { const p = PRODUCTS.find((x) => x.id === id) ?? findProduct(id); if (p) dispatch({ t: "add", id: p.id, qty }); return p; },
    setQty: (id, qty) => dispatch({ t: "setQty", id, qty }),
    removeFromCart: (id) => { const p = findProduct(id); if (p) dispatch({ t: "remove", id: p.id }); return p; },
    clearCart: () => dispatch({ t: "clear" }),
    filter, setFilter: (patch) => setFilterState((f) => ({ ...f, ...patch })),
    checkout: state.checkout, updateCheckout: (patch) => dispatch({ t: "checkout", patch }),
    order: state.order,
    placeOrder: (cardLast4) => {
      const cur = ref.current;
      const sum = summarise(cur.cart, cur.checkout.delivery);
      if (!sum.lines.length) return null;
      const order: Order = { id: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(), lines: sum.lines, subtotal: sum.subtotal, shipping: sum.shipping, total: sum.total, address: cur.checkout.address, delivery: cur.checkout.delivery, cardLast4, placedAt: new Date().toISOString() };
      dispatch({ t: "place", order });
      return order;
    },
    getSummary: () => summarise(ref.current.cart, ref.current.checkout.delivery),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside StoreProvider");
  return v;
}
