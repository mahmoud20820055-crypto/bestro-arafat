"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PublicOrder } from "@/lib/orders";
import { FLOW_DELIVERY, FLOW_PICKUP } from "@/lib/orders";
import { PAYMENT_LABEL, PAYMENT_STATUS_LABEL, STATUS_LABEL } from "@/lib/format";
import { useCart } from "./cart";
import { compressImage } from "@/lib/compress";

const time = (iso: string) => new Date(iso).toLocaleTimeString("ar", { hour: "numeric", minute: "2-digit" });

export function OrderTracker({ initial, isNew, prepMinutes, phones }: { initial: PublicOrder; isNew: boolean; prepMinutes: number; phones: string }) {
  const [o, setO] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const { add } = useCart();

  const refresh = useCallback(async () => {
    const r = await fetch(`/api/orders/${o.token}`, { cache: "no-store" });
    if (r.ok) setO(await r.json());
  }, [o.token]);
  useEffect(() => {
    if (["DELIVERED", "CANCELLED"].includes(o.status)) return;
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, [o.status, refresh]);

  const flow: readonly string[] = o.type === "DELIVERY" ? FLOW_DELIVERY : FLOW_PICKUP;
  const step = flow.indexOf(o.status);
  const at = (s: string) => o.history.find((h) => h.status === s)?.at;
  const eta = new Date(new Date(o.createdAt).getTime() + prepMinutes * 60000);

  async function uploadReceipt() {
    if (!file) return;
    const fd = new FormData(); fd.set("receipt", await compressImage(file));
    const r = await fetch(`/api/orders/${o.token}/receipt`, { method: "POST", body: fd });
    const d = await r.json();
    setMsg(r.ok ? "وصل الإيصال الجديد، رح نراجعه هلّق" : d.error);
    if (r.ok) { setFile(null); refresh(); }
  }

  function reorder() {
    o.items.forEach((i) => i.itemId && add({ itemId: i.itemId, variantId: i.variantId, name: i.name, variant: i.variant, price: i.unitPrice }, i.qty));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {isNew && (
        <div className="card border-ok/40 bg-ok/10 p-5">
          <p className="font-bold text-ok">وصل طلبك! رقمه #{o.number}</p>
          <p className="mt-1 text-sm text-cream-muted">احفظ هالصفحة. بتلاقيها كمان بـ «طلباتي» على هالجهاز، أو برقم جوالك ورقم الطلب.</p>
        </div>
      )}

      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-cream-muted">طلب رقم</p>
            <p className="num font-latin text-4xl font-bold">#{o.number}</p>
          </div>
          <div className="text-left">
            <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold ${o.status === "CANCELLED" ? "bg-brand/20 text-brand-soft" : o.status === "DELIVERED" ? "bg-ok/15 text-ok" : "bg-cream text-ink"}`}>{STATUS_LABEL[o.status]}</span>
            {!["DELIVERED", "CANCELLED"].includes(o.status) && <p className="mt-2 text-xs text-cream-muted">متوقع حوالي {time(eta.toISOString())}</p>}
          </div>
        </div>

        {o.status === "CANCELLED" ? (
          <p className="mt-6 rounded-xl bg-brand/10 p-4 text-sm">انلغى الطلب{o.cancelReason ? `: ${o.cancelReason}` : ""}. للاستفسار اتصل على <span className="num" dir="ltr">{phones}</span></p>
        ) : (
          <ol className="mt-8 grid gap-0 sm:grid-cols-5">
            {flow.map((s, i) => (
              <li key={s} className="relative flex gap-3 pb-6 sm:block sm:pb-0 sm:text-center">
                <div className={`absolute right-[11px] top-6 h-full w-px sm:right-auto sm:left-0 sm:top-[11px] sm:h-px sm:w-1/2 ${i === 0 ? "sm:hidden" : ""} ${i <= step ? "bg-brand" : "bg-ink-4"}`} />
                <div className={`absolute hidden h-px w-1/2 sm:right-0 sm:top-[11px] sm:block ${i === flow.length - 1 ? "sm:hidden" : ""} ${i < step ? "bg-brand" : "bg-ink-4"}`} />
                <span className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[10px] sm:mx-auto ${i <= step ? "border-brand bg-brand text-white" : "border-ink-4 bg-ink-2"} ${i === step ? "ring-4 ring-brand/25" : ""}`}>{i < step ? "✓" : ""}</span>
                <div className="sm:mt-3">
                  <p className={`text-sm font-bold ${i <= step ? "text-cream" : "text-cream-dim"}`}>{STATUS_LABEL[s]}</p>
                  {at(s) && <p className="num text-xs text-cream-muted">{time(at(s)!)}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {o.payment === "WALLET" && (
        <div className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg">الدفع</h2>
            <span className={`text-sm font-bold ${o.paymentStatus === "VERIFIED" ? "text-ok" : o.paymentStatus === "REJECTED" ? "text-brand-soft" : "text-warn"}`}>{PAYMENT_STATUS_LABEL[o.paymentStatus]}</span>
          </div>
          {o.paymentStatus === "REJECTED" && !["DELIVERED", "CANCELLED"].includes(o.status) && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-cream-muted">ما قدرنا نأكد الإيصال. ارفع صورة أوضح أو اتصل فينا.</p>
              <div className="flex flex-wrap items-center gap-3">
                <input type="file" accept="image/*" aria-label="صورة الإيصال الجديدة" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm text-cream-muted file:ml-3 file:rounded-full file:border-0 file:bg-cream file:px-4 file:py-2 file:font-bold file:text-ink" />
                <button type="button" className="btn-red btn-sm" disabled={!file} onClick={uploadReceipt}>ارفع الإيصال</button>
              </div>
            </div>
          )}
          {msg && <p className="mt-3 text-sm">{msg}</p>}
        </div>
      )}

      <div className="card p-6">
        <h2 className="mb-3 font-display text-lg">تفاصيل الطلب</h2>
        <ul className="divide-y divide-line text-sm">
          {o.items.map((i, k) => (
            <li key={k} className="flex justify-between gap-4 py-2.5">
              <span><span className="num text-cream-muted">{i.qty}×</span> {i.name}{i.variant && <span className="text-cream-muted"> · {i.variant}</span>}</span>
              <span className="num">{i.unitPrice * i.qty} ₪</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
          {!!o.discount && <div className="flex justify-between text-ok"><dt>خصم {o.couponCode}</dt><dd className="num">−{o.discount} ₪</dd></div>}
          {!!o.deliveryFee && <div className="flex justify-between text-cream-muted"><dt>التوصيل</dt><dd className="num">{o.deliveryFee} ₪</dd></div>}
          <div className="flex justify-between text-base font-bold"><dt>الإجمالي</dt><dd className="num">{o.total} ₪</dd></div>
        </dl>
        <div className="mt-5 grid gap-1 text-sm text-cream-muted">
          <p>{o.type === "DELIVERY" ? `توصيل إلى: ${o.area} - ${o.address}` : "استلام من المحل"}</p>
          <p>الدفع: {PAYMENT_LABEL[o.payment]}</p>
          {o.notes && <p>ملاحظات: {o.notes}</p>}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/checkout" onClick={reorder} className="btn-ghost btn-sm">اطلب نفس الطلب</Link>
          <Link href="/orders" className="btn-ghost btn-sm">كل طلباتي</Link>
        </div>
      </div>
    </div>
  );
}
