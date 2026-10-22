"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { rememberOrder, useCart } from "./cart";
import { CopyText } from "./CopyText";
import { compressImage } from "@/lib/compress";

type Settings = { isOpen: boolean; deliveryFee: number; minOrder: number; walletInfo: string; phones: string };
type Quote = { subtotal: number; discount: number; deliveryFee: number; total: number; coupon: string | null };

export function Checkout({ settings }: { settings: Settings }) {
  const { lines, setQty, clear, subtotal } = useCart();
  const router = useRouter();
  const [type, setType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [payment, setPayment] = useState<"WALLET" | "AT_PICKUP">("WALLET");
  const [form, setForm] = useState({ customerName: "", phone: "", area: "", address: "", notes: "" });
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [couponErr, setCouponErr] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Remember name and phone for next time (this device only)
  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem("ba-customer") || "{}"); setForm((f) => ({ ...f, ...s })); } catch {}
  }, []);
  useEffect(() => { if (type === "DELIVERY") setPayment("WALLET"); }, [type]);

  const payload = useMemo(() => lines.map((l) => ({ itemId: l.itemId, variantId: l.variantId, qty: l.qty })), [lines]);
  useEffect(() => {
    if (!payload.length) { setQuote(null); return; }
    const ctl = new AbortController();
    fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: payload, type, coupon: applied }), signal: ctl.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          if (applied) { setCouponErr(d.error); setApplied(null); } else setQuoteErr(d.error);
          return;
        }
        setQuoteErr(null); setQuote(d);
      }).catch(() => {});
    return () => ctl.abort();
  }, [payload, type, applied]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (payment === "WALLET" && !receipt) { setError("ارفع صورة إيصال التحويل"); return; }
    setBusy(true);
    const fd = new FormData();
    fd.set("order", JSON.stringify({ ...form, type, payment, coupon: applied || undefined, lines: payload }));
    if (receipt) fd.set("receipt", await compressImage(receipt));
    try {
      const r = await fetch("/api/orders", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) { setError(d.error); setBusy(false); return; }
      try { localStorage.setItem("ba-customer", JSON.stringify({ customerName: form.customerName, phone: form.phone, area: form.area, address: form.address })); } catch {}
      rememberOrder(d.token, d.number);
      clear();
      router.push(`/track/${d.token}?new=1`);
    } catch {
      setError("ما قدرنا نبعت الطلب، تأكد من النت وجرّب كمان مرة");
      setBusy(false);
    }
  }

  if (!lines.length) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <h2 className="font-display text-2xl">سلتك فاضية</h2>
        <p className="mt-2 text-cream-muted">اختار من المنيو وارجع هون تكمّل طلبك.</p>
        <Link href="/#menu" className="btn-red mt-6">روح للمنيو</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid items-start gap-8 lg:grid-cols-[1.25fr_.75fr]">
      <div className="space-y-8">
        <fieldset className="card p-6">
          <legend className="sr-only">طريقة الاستلام</legend>
          <h2 className="mb-4 font-display text-xl">كيف بدك تستلم؟</h2>
          <div className="grid grid-cols-2 gap-3">
            {([["DELIVERY", "توصيل", `رسوم التوصيل ${settings.deliveryFee} ₪`], ["PICKUP", "استلام من المحل", "بدون رسوم"]] as const).map(([v, t, d]) => (
              <label key={v} className={`cursor-pointer rounded-xl border p-4 transition ${type === v ? "border-brand bg-brand/10" : "border-line hover:border-cream/30"}`}>
                <input type="radio" name="type" value={v} checked={type === v} onChange={() => setType(v)} className="sr-only" />
                <span className="block font-bold">{t}</span><span className="text-xs text-cream-muted">{d}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="card grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="font-display text-xl sm:col-span-2">معلوماتك</h2>
          <div><label className="label" htmlFor="customerName">الاسم</label><input id="customerName" className="field" required value={form.customerName} onChange={set("customerName")} autoComplete="name" /></div>
          <div><label className="label" htmlFor="phone">رقم الجوال</label><input id="phone" className="field num" required inputMode="tel" dir="ltr" placeholder="059XXXXXXX" value={form.phone} onChange={set("phone")} autoComplete="tel" /></div>
          {type === "DELIVERY" && (
            <>
              <div><label className="label" htmlFor="area">المنطقة</label><input id="area" className="field" required placeholder="مثلاً: الرمال، النصر، تل الهوا" value={form.area} onChange={set("area")} /></div>
              <div><label className="label" htmlFor="address">العنوان بالتفصيل</label><input id="address" className="field" required placeholder="الشارع، أقرب معلم، رقم العمارة" value={form.address} onChange={set("address")} /></div>
            </>
          )}
          <div className="sm:col-span-2"><label className="label" htmlFor="notes">ملاحظات (اختياري)</label><textarea id="notes" className="field min-h-20" placeholder="بدون بصل، صوص زيادة..." value={form.notes} onChange={set("notes")} /></div>
        </fieldset>

        <fieldset className="card space-y-4 p-6">
          <h2 className="font-display text-xl">الدفع</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`cursor-pointer rounded-xl border p-4 transition ${payment === "WALLET" ? "border-brand bg-brand/10" : "border-line hover:border-cream/30"}`}>
              <input type="radio" name="payment" checked={payment === "WALLET"} onChange={() => setPayment("WALLET")} className="sr-only" />
              <span className="block font-bold">تحويل محفظة أو بنك</span><span className="text-xs text-cream-muted">بتحوّل وبترفع صورة الإيصال</span>
            </label>
            <label className={`rounded-xl border p-4 transition ${type === "DELIVERY" ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${payment === "AT_PICKUP" ? "border-brand bg-brand/10" : "border-line hover:border-cream/30"}`}>
              <input type="radio" name="payment" disabled={type === "DELIVERY"} checked={payment === "AT_PICKUP"} onChange={() => setPayment("AT_PICKUP")} className="sr-only" />
              <span className="block font-bold">الدفع بالمحل</span><span className="text-xs text-cream-muted">{type === "DELIVERY" ? "متاح للاستلام من المحل بس" : "بتدفع وإنت بتستلم"}</span>
            </label>
          </div>
          {payment === "WALLET" && (
            <div className="space-y-4 rounded-xl border border-line bg-ink-3 p-4">
              <div>
                <div className="mb-2 flex items-center justify-between"><span className="text-sm font-bold">حوّل المبلغ على:</span>{settings.walletInfo && <CopyText text={settings.walletInfo} />}</div>
                <p className="whitespace-pre-line text-sm leading-7 text-cream-muted">{settings.walletInfo || `تواصل معنا لمعرفة رقم المحفظة: ${settings.phones}`}</p>
              </div>
              <div>
                <label className="label" htmlFor="receipt">صورة إيصال التحويل</label>
                <input id="receipt" type="file" accept="image/*" className="block w-full text-sm text-cream-muted file:ml-3 file:rounded-full file:border-0 file:bg-cream file:px-4 file:py-2 file:font-bold file:text-ink"
                  onChange={(e) => { const f = e.target.files?.[0] || null; setReceipt(f); setPreview(f ? URL.createObjectURL(f) : null); }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {preview && <img src={preview} alt="معاينة الإيصال" className="mt-3 max-h-48 rounded-lg border border-line" />}
              </div>
            </div>
          )}
        </fieldset>
      </div>

      <aside className="card sticky top-[92px] space-y-5 p-6">
        <h2 className="font-display text-xl">طلبك</h2>
        <ul className="divide-y divide-line">
          {lines.map((l) => (
            <li key={l.key} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1"><p className="font-bold">{l.name}</p>{l.variant && <p className="text-xs text-cream-muted">{l.variant}</p>}</div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQty(l.key, l.qty - 1)} className="h-7 w-7 rounded-full border border-line" aria-label="نقّص">−</button>
                <span className="num w-5 text-center">{l.qty}</span>
                <button type="button" onClick={() => setQty(l.key, l.qty + 1)} className="h-7 w-7 rounded-full border border-line" aria-label="زيد">+</button>
              </div>
              <span className="num w-14 text-left font-bold">{l.price * l.qty}₪</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input className="field py-2 font-latin uppercase" placeholder="كوبون خصم" value={coupon} onChange={(e) => setCoupon(e.target.value)} aria-label="كود الكوبون" />
          <button type="button" className="btn-ghost btn-sm shrink-0" onClick={() => { setCouponErr(null); setApplied(coupon.trim() || null); }}>طبّق</button>
        </div>
        {couponErr && <p className="text-sm text-brand-soft">{couponErr}</p>}
        {quoteErr && <p className="text-sm text-brand-soft">{quoteErr}</p>}
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-cream-muted">المجموع</dt><dd className="num">{quote?.subtotal ?? subtotal} ₪</dd></div>
          {!!quote?.discount && <div className="flex justify-between text-ok"><dt>خصم ({quote.coupon})</dt><dd className="num">−{quote.discount} ₪</dd></div>}
          {type === "DELIVERY" && <div className="flex justify-between"><dt className="text-cream-muted">التوصيل</dt><dd className="num">{quote?.deliveryFee ?? settings.deliveryFee} ₪</dd></div>}
          <div className="flex justify-between border-t border-line pt-3 text-lg font-bold"><dt>الإجمالي</dt><dd className="num text-2xl font-bold">{quote?.total ?? "…"} ₪</dd></div>
        </dl>
        {error && <p className="rounded-lg bg-brand/15 p-3 text-sm text-brand-soft" role="alert">{error}</p>}
        <button className="btn-red w-full" disabled={busy || !settings.isOpen || !quote || !!quoteErr}>
          {!settings.isOpen ? "المطعم مسكّر هلّق" : busy ? "عم نبعت طلبك…" : "أكّد الطلب"}
        </button>
        <p className="text-center text-xs text-cream-dim">بدون تسجيل. بعد التأكيد بتاخد رابط تتبع للطلب.</p>
      </aside>
    </form>
  );
}
