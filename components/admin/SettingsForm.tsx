"use client";
import { useState } from "react";
import type { Setting } from "@prisma/client";

export function SettingsForm({ initial }: { initial: Setting }) {
  const [s, setS] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const txt = (k: keyof Setting) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setS({ ...s, [k]: e.target.value });
  const num = (k: keyof Setting) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: Number(e.target.value.replace(/\D/g, "") || 0) });

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const { id: _id, ...body } = s;
    const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setMsg(r.ok ? { ok: true, text: "انحفظت الإعدادات" } : { ok: false, text: (await r.json()).error });
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold">الإعدادات</h1>
      <section className="card grid gap-4 p-6 sm:grid-cols-3">
        <h2 className="font-display text-xl sm:col-span-3">الطلبات</h2>
        <label className="flex items-center gap-3 sm:col-span-3"><input type="checkbox" checked={s.isOpen} onChange={(e) => setS({ ...s, isOpen: e.target.checked })} className="h-5 w-5 accent-brand" /><span className="font-bold">استقبال الطلبات أونلاين</span></label>
        <div><label className="label" htmlFor="df">رسوم التوصيل (₪)</label><input id="df" className="field num" inputMode="numeric" value={s.deliveryFee} onChange={num("deliveryFee")} /></div>
        <div><label className="label" htmlFor="mo">أقل طلب (₪)</label><input id="mo" className="field num" inputMode="numeric" value={s.minOrder} onChange={num("minOrder")} /></div>
        <div><label className="label" htmlFor="pm">وقت التحضير (دقيقة)</label><input id="pm" className="field num" inputMode="numeric" value={s.prepMinutes} onChange={num("prepMinutes")} /></div>
      </section>
      <section className="card space-y-4 p-6">
        <h2 className="font-display text-xl">معلومات الدفع</h2>
        <div><label className="label" htmlFor="wi">أرقام المحافظ والحساب البنكي (بتظهر للزبون عند الدفع)</label>
          <textarea id="wi" className="field min-h-32" placeholder={"PalPay: 059XXXXXXX باسم ...\nجوال باي: 059XXXXXXX\nبنك فلسطين: رقم الحساب ..."} value={s.walletInfo} onChange={txt("walletInfo")} /></div>
      </section>
      <section className="card grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="font-display text-xl sm:col-span-2">معلومات المطعم</h2>
        <div><label className="label" htmlFor="ph">أرقام التلفون</label><input id="ph" className="field num" dir="ltr" value={s.phones} onChange={txt("phones")} /></div>
        <div><label className="label" htmlFor="wa">رقم واتساب (دولي بدون +)</label><input id="wa" className="field num" dir="ltr" placeholder="970593221010" value={s.whatsapp} onChange={txt("whatsapp")} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="ad">العنوان</label><input id="ad" className="field" value={s.address} onChange={txt("address")} /></div>
        <div><label className="label" htmlFor="hr">ساعات الدوام</label><input id="hr" className="field" placeholder="يومياً من 11 الصبح لـ 12 بالليل" value={s.hours} onChange={txt("hours")} /></div>
        <div><label className="label" htmlFor="ig">رابط إنستغرام</label><input id="ig" className="field" dir="ltr" value={s.instagram} onChange={txt("instagram")} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="an">شريط إعلان أعلى الموقع (اختياري)</label><input id="an" className="field" placeholder="مثلاً: خصم 20% على كل البرجر يوم الجمعة بكود FRIDAY20" value={s.announcement} onChange={txt("announcement")} /></div>
      </section>
      {msg && <p className={`text-sm ${msg.ok ? "text-ok" : "text-brand-soft"}`} role="status">{msg.text}</p>}
      <button className="btn-red" disabled={busy}>{busy ? "عم نحفظ…" : "احفظ الإعدادات"}</button>
    </form>
  );
}
