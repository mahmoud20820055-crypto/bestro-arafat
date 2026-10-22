"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { key: string; itemId: number; variantId: number | null; name: string; variant: string | null; price: number; qty: number };
type Cart = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (l: Omit<CartLine, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  toast: string | null;
};

const Ctx = createContext<Cart | null>(null);
const KEY = "ba-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try { setLines(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
  }, []);
  const save = (next: CartLine[]) => {
    setLines(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const add = useCallback<Cart["add"]>((l, qty = 1) => {
    setLines((prev) => {
      const key = `${l.itemId}:${l.variantId ?? 0}`;
      const ex = prev.find((p) => p.key === key);
      const next = ex ? prev.map((p) => (p.key === key ? { ...p, qty: Math.min(50, p.qty + qty) } : p)) : [...prev, { ...l, key, qty }];
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setToast(`انضاف ${l.name}${l.variant ? ` (${l.variant})` : ""} للسلة`);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const value = useMemo<Cart>(() => ({
    lines,
    count: lines.reduce((a, l) => a + l.qty, 0),
    subtotal: lines.reduce((a, l) => a + l.qty * l.price, 0),
    add,
    setQty: (key, qty) => save(qty <= 0 ? lines.filter((l) => l.key !== key) : lines.map((l) => (l.key === key ? { ...l, qty: Math.min(50, qty) } : l))),
    clear: () => save([]),
    toast,
  }), [lines, add, toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div role="status" aria-live="polite"
        className={`fixed bottom-[calc(20px+env(safe-area-inset-bottom))] left-1/2 z-[70] -translate-x-1/2 rounded-full bg-cream px-5 py-3 text-sm font-bold text-ink shadow-2xl transition-all duration-300 ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}>
        {toast}
      </div>
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

/** Orders placed from this device, so "طلباتي" works without an account. */
export function rememberOrder(token: string, number: number) {
  try {
    const list = JSON.parse(localStorage.getItem("ba-orders") || "[]") as { token: string; number: number }[];
    localStorage.setItem("ba-orders", JSON.stringify([{ token, number }, ...list.filter((o) => o.token !== token)].slice(0, 30)));
  } catch {}
}
export function rememberedOrders(): { token: string; number: number }[] {
  try { return JSON.parse(localStorage.getItem("ba-orders") || "[]"); } catch { return []; }
}
