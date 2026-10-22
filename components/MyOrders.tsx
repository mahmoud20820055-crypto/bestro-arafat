"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicOrder } from "@/lib/orders";
import { STATUS_LABEL } from "@/lib/format";
import { rememberOrder, rememberedOrders } from "./cart";

function OrderRow({ o }: { o: PublicOrder }) {
  const live = !["DELIVERED", "CANCELLED"].includes(o.status);
  return (
    <Link href={`/track/${o.token}`} className="card flex items-center gap-4 p-4 transition hover:border-brand/40">
      <span className="num font-latin text-xl font-bold">#{o.number}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{o.items.map((i) => `${i.qty}× ${i.name}`).join("، ")}</p>
        <p className="text-xs text-cream-muted">{new Date(o.createdAt).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" })}</p>
      </div>
      <span className="num hidden font-bold sm:block">{o.total} ₪</span>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${live ? "bg-brand text-white" : "bg-ink-4 text-cream-muted"}`}>{STATUS_LABEL[o.status]}</span>
    </Link>
  );
}

export function MyOrders() {
  const [local, setLocal] = useState<PublicOrder[] | null>(null);
  const [found, setFound] = useState<PublicOrder[] | null>(null);
  const [phone, setPhone] = useState("");
  const [number, setNumber] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = rememberedOrders();
    Promise.all(saved.map((s) => fetch(`/api/orders/${s.token}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)))
      .then((list) => setLocal(list.filter(Boolean)));
  }, []);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const r = await fetch("/api/orders/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, number }) });
    const d = await r.json();
    if (!r.ok) { setErr(d.error); setFound(null); return; }
    d.forEach((o: PublicOrder) => rememberOrder(o.token, o.number));
    setFound(d);
  }

  const list = found ?? local;
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_.7fr]">
      <section className="space-y-3">
        <h2 className="font-display text-2xl">{found ? `طلبات ${phone}` : "طلبات هالجهاز"}</h2>
        {list === null ? <p className="text-cream-muted">عم نجيب طلباتك…</p>
          : list.length === 0 ? <div className="card p-8 text-center text-cream-muted">ما في طلبات محفوظة على هالجهاز. دوّر برقم جوالك ورقم أي طلب سابق.</div>
          : list.map((o) => <OrderRow key={o.token} o={o} />)}
      </section>
      <form onSubmit={lookup} className="card space-y-4 p-6">
        <h2 className="font-display text-xl">لاقي طلباتك</h2>
        <p className="text-sm text-cream-muted">اكتب رقم جوالك ورقم أي طلب سابق، وبتطلعلك كل طلباتك.</p>
        <div><label className="label" htmlFor="lp">رقم الجوال</label><input id="lp" className="field num" dir="ltr" inputMode="tel" required placeholder="059XXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div><label className="label" htmlFor="ln">رقم الطلب</label><input id="ln" className="field num" dir="ltr" inputMode="numeric" required placeholder="مثلاً 1024" value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))} /></div>
        {err && <p className="text-sm text-brand-soft" role="alert">{err}</p>}
        <button className="btn-red w-full">اعرض طلباتي</button>
      </form>
    </div>
  );
}
