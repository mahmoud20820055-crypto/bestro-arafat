"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Order, OrderItem } from "@prisma/client";
import { PAYMENT_LABEL, PAYMENT_STATUS_LABEL, STATUS_LABEL } from "@/lib/format";

type O = Omit<Order, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string; items: OrderItem[] };

const COLUMNS = [
  { key: "new", title: "جديد", match: (o: O) => o.status === "NEW" },
  { key: "kitchen", title: "بالمطبخ", match: (o: O) => o.status === "ACCEPTED" || o.status === "PREPARING" },
  { key: "out", title: "جاهز / بالطريق", match: (o: O) => o.status === "READY" || o.status === "OUT_FOR_DELIVERY" },
  { key: "done", title: "خلص اليوم", match: (o: O) => o.status === "DELIVERED" || o.status === "CANCELLED" },
];

function nextStep(o: O): { status: string; label: string } | null {
  switch (o.status) {
    case "NEW": return { status: "ACCEPTED", label: "اقبل الطلب" };
    case "ACCEPTED": return { status: "PREPARING", label: "بلّش التحضير" };
    case "PREPARING": return o.type === "DELIVERY" ? { status: "OUT_FOR_DELIVERY", label: "طلع مع الديليفري" } : { status: "READY", label: "جاهز للاستلام" };
    case "READY": case "OUT_FOR_DELIVERY": return { status: "DELIVERED", label: "تم التسليم" };
    default: return null;
  }
}

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? "هلّق" : m < 60 ? `من ${m} د` : `من ${Math.floor(m / 60)} س ${m % 60} د`;
};

function beep(ctx: AudioContext) {
  [0, 0.25].forEach((t) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2);
    o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.22);
  });
}

function Card({ o, onPatch }: { o: O; onPatch: (id: number, body: object) => Promise<void> }) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const step = nextStep(o);
  const run = async (body: object) => { setBusy(true); await onPatch(o.id, body); setBusy(false); };
  const paymentBlocked = o.payment === "WALLET" && o.paymentStatus !== "VERIFIED" && o.status === "NEW";

  return (
    <article className={`card space-y-3 p-4 ${o.status === "NEW" ? "border-brand/60 shadow-[0_0_0_1px_rgba(226,27,44,.3)]" : ""} ${o.status === "CANCELLED" ? "opacity-50" : ""}`}>
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="num font-latin text-xl font-bold">#{o.id}</p>
          <p className="text-xs text-cream-muted">{ago(o.createdAt)} · {new Date(o.createdAt).toLocaleTimeString("ar", { hour: "numeric", minute: "2-digit" })}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${o.type === "DELIVERY" ? "bg-cream text-ink" : "bg-ink-4 text-cream"}`}>{o.type === "DELIVERY" ? "توصيل" : "استلام"}</span>
      </header>
      <div className="text-sm">
        <p className="font-bold">{o.customerName}</p>
        <a href={`tel:${o.phone}`} className="num text-cream-muted hover:text-cream" dir="ltr">{o.phone}</a>
        {o.type === "DELIVERY" && <p className="mt-1 text-cream-muted">{o.area} - {o.address}</p>}
      </div>
      <ul className="space-y-1 border-y border-line py-2 text-sm">
        {o.items.map((i) => <li key={i.id}><span className="num font-bold">{i.qty}×</span> {i.name}{i.variant && <span className="text-cream-muted"> · {i.variant}</span>}</li>)}
      </ul>
      {o.notes && <p className="rounded-lg bg-warn/10 p-2 text-xs text-warn">ملاحظة: {o.notes}</p>}
      <div className="flex items-center justify-between text-sm">
        <span className="text-cream-muted">{PAYMENT_LABEL[o.payment]}</span>
        <span className="num text-lg font-bold">{o.total} ₪</span>
      </div>
      {o.couponCode && <p className="text-xs text-ok">كوبون {o.couponCode}: −{o.discount} ₪</p>}

      {o.payment === "WALLET" && o.status !== "CANCELLED" && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-ink-3 p-2.5 text-xs">
          <span className={`font-bold ${o.paymentStatus === "VERIFIED" ? "text-ok" : o.paymentStatus === "REJECTED" ? "text-brand-soft" : "text-warn"}`}>{PAYMENT_STATUS_LABEL[o.paymentStatus]}</span>
          {o.receiptId && <a href={`/api/media/${o.receiptId}`} target="_blank" rel="noreferrer" className="underline">شوف الإيصال</a>}
          {o.paymentStatus !== "VERIFIED" && <button disabled={busy} onClick={() => run({ paymentStatus: "VERIFIED" })} className="mr-auto rounded-full bg-ok px-3 py-1 font-bold text-ink">أكّد الدفع</button>}
          {o.paymentStatus === "PENDING" && <button disabled={busy} onClick={() => run({ paymentStatus: "REJECTED" })} className="rounded-full border border-line px-3 py-1">رفض</button>}
        </div>
      )}

      {o.status === "CANCELLED" && o.cancelReason && <p className="text-xs text-cream-muted">سبب الإلغاء: {o.cancelReason}</p>}

      {step && !cancelling && (
        <div className="flex gap-2">
          <button disabled={busy || paymentBlocked} onClick={() => run({ status: step.status })} className="btn-red btn-sm flex-1" title={paymentBlocked ? "أكّد الدفع أول" : undefined}>
            {paymentBlocked ? "أكّد الدفع أول" : step.label}
          </button>
          <button disabled={busy} onClick={() => setCancelling(true)} className="btn-ghost btn-sm">إلغاء</button>
        </div>
      )}
      {cancelling && (
        <div className="space-y-2">
          <input className="field py-2 text-sm" placeholder="سبب الإلغاء (بيشوفه الزبون)" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="سبب الإلغاء" />
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => run({ status: "CANCELLED", cancelReason: reason })} className="btn-red btn-sm flex-1">ألغِ الطلب</button>
            <button onClick={() => setCancelling(false)} className="btn-ghost btn-sm">رجوع</button>
          </div>
        </div>
      )}
    </article>
  );
}

export function OrdersBoard() {
  const [orders, setOrders] = useState<O[] | null>(null);
  const [error, setError] = useState(false);
  const [sound, setSound] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const seen = useRef<Set<number> | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/orders", { cache: "no-store" });
      if (r.status === 401) { location.href = "/admin/login?next=/admin/orders"; return; }
      const list: O[] = await r.json();
      const fresh = list.filter((o) => o.status === "NEW" && seen.current && !seen.current.has(o.id));
      if (fresh.length && audio.current) beep(audio.current);
      seen.current = new Set(list.map((o) => o.id));
      const n = list.filter((o) => o.status === "NEW").length;
      document.title = n ? `(${n}) طلبات جديدة` : "الطلبات";
      setOrders(list); setError(false);
    } catch { setError(true); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  async function patch(id: number, body: object) {
    const r = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) { const u = await r.json(); setOrders((l) => l?.map((o) => (o.id === id ? u : o)) ?? null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">الطلبات</h1>
        <div className="flex items-center gap-3 text-sm">
          {error && <span className="text-brand-soft">انقطع الاتصال، عم نعيد المحاولة…</span>}
          <span className="flex items-center gap-2 text-cream-muted"><span className="h-2 w-2 animate-pulse rounded-full bg-ok" />تحديث تلقائي</span>
          <button onClick={() => { audio.current ??= new AudioContext(); setSound(true); beep(audio.current); }} className={`chip ${sound ? "chip-on" : ""}`}>
            {sound ? "صوت التنبيه شغّال" : "شغّل صوت التنبيه"}
          </button>
        </div>
      </div>
      {orders === null ? <p className="text-cream-muted">عم نحمّل الطلبات…</p> : (
        <div className="grid items-start gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {COLUMNS.map((c) => {
            const list = orders.filter(c.match);
            return (
              <section key={c.key} className="space-y-3 rounded-2xl bg-ink-2/50 p-3">
                <h2 className="flex items-center justify-between px-1 font-bold">{c.title}<span className="num rounded-full bg-ink-4 px-2.5 text-sm">{list.length}</span></h2>
                {list.length === 0 ? <p className="px-1 py-6 text-center text-sm text-cream-dim">ما في طلبات</p> : list.map((o) => <Card key={o.id} o={o} onPatch={patch} />)}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
