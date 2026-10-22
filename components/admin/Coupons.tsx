"use client";
import { useCallback, useEffect, useState } from "react";

type C = { id: number; code: string; type: "PERCENT" | "FIXED"; value: number; minSubtotal: number; maxUses: number | null; uses: number; expiresAt: string | null; active: boolean };
const empty = { code: "", type: "PERCENT" as "PERCENT" | "FIXED", value: "", minSubtotal: "", maxUses: "", expiresAt: "" };

export function Coupons() {
  const [list, setList] = useState<C[] | null>(null);
  const [f, setF] = useState(empty);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const load = useCallback(async () => setList(await (await fetch("/api/admin/coupons")).json()), []);
  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    const r = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      code: f.code, type: f.type, value: Number(f.value), minSubtotal: Number(f.minSubtotal || 0),
      maxUses: f.maxUses ? Number(f.maxUses) : null, expiresAt: f.expiresAt ? new Date(f.expiresAt + "T23:59:59").toISOString() : null,
    }) });
    if (!r.ok) { setErr((await r.json()).error); return; }
    setF(empty); load();
  }
  const patch = async (id: number, body: object) => { await fetch(`/api/admin/coupons/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); load(); };
  const del = async (id: number) => { await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" }); setConfirm(null); load(); };
  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value.replace(/\D/g, "") });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">العروض والكوبونات</h1>
      <form onSubmit={create} className="card grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <div><label className="label" htmlFor="cc">الكود</label><input id="cc" className="field font-latin uppercase" dir="ltr" required placeholder="RAMADAN20" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></div>
        <div><span className="label">نوع الخصم</span>
          <div className="flex gap-2">{([["PERCENT", "نسبة %"], ["FIXED", "مبلغ ₪"]] as const).map(([t, l]) => <button key={t} type="button" className={`chip flex-1 ${f.type === t ? "chip-on" : ""}`} onClick={() => setF({ ...f, type: t })}>{l}</button>)}</div></div>
        <div><label className="label" htmlFor="cv">القيمة {f.type === "PERCENT" ? "(%)" : "(₪)"}</label><input id="cv" className="field num" inputMode="numeric" required value={f.value} onChange={num("value")} /></div>
        <div><label className="label" htmlFor="cm">أقل مبلغ للطلب (₪)</label><input id="cm" className="field num" inputMode="numeric" placeholder="0" value={f.minSubtotal} onChange={num("minSubtotal")} /></div>
        <div><label className="label" htmlFor="cu">أقصى عدد استخدامات</label><input id="cu" className="field num" inputMode="numeric" placeholder="بدون حد" value={f.maxUses} onChange={num("maxUses")} /></div>
        <div><label className="label" htmlFor="ce">ينتهي بتاريخ</label><input id="ce" type="date" className="field" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></div>
        {err && <p className="text-sm text-brand-soft sm:col-span-2 lg:col-span-3" role="alert">{err}</p>}
        <div className="sm:col-span-2 lg:col-span-3"><button className="btn-red">أنشئ الكوبون</button></div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-ink-3 text-right text-cream-muted"><tr>{["الكود", "الخصم", "أقل طلب", "الاستخدام", "ينتهي", "الحالة", ""].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {list?.map((c) => {
              const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
              return (
                <tr key={c.id} className={c.active && !expired ? "" : "opacity-55"}>
                  <td className="px-4 py-3 font-latin font-bold" dir="ltr" style={{ textAlign: "right" }}>{c.code}</td>
                  <td className="num px-4 py-3">{c.type === "PERCENT" ? `${c.value}%` : `${c.value} ₪`}</td>
                  <td className="num px-4 py-3">{c.minSubtotal ? `${c.minSubtotal} ₪` : "—"}</td>
                  <td className="num px-4 py-3">{c.uses}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                  <td className="px-4 py-3">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("ar") : "—"}{expired && <span className="mr-1 text-brand-soft">(منتهي)</span>}</td>
                  <td className="px-4 py-3"><button onClick={() => patch(c.id, { active: !c.active })} className={`rounded-full px-3 py-1 text-xs font-bold ${c.active ? "bg-ok/15 text-ok" : "bg-ink-4 text-cream-muted"}`}>{c.active ? "فعّال" : "موقوف"}</button></td>
                  <td className="px-4 py-3"><button className={`text-xs ${confirm === c.id ? "font-bold text-brand-soft" : "text-cream-dim"}`} onClick={() => (confirm === c.id ? del(c.id) : setConfirm(c.id))}>{confirm === c.id ? "متأكد؟" : "احذف"}</button></td>
                </tr>
              );
            })}
            {list?.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-cream-dim">ما في كوبونات لسا. أنشئ أول واحد من فوق.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
