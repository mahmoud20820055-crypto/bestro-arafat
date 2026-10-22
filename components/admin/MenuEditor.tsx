"use client";
import { useCallback, useEffect, useState } from "react";
import { compressImage } from "@/lib/compress";

type V = { name: string; price: number };
type Item = { id: number; categoryId: number; name: string; description: string | null; price: number | null; imageId: string | null; available: boolean; featured: boolean; sort: number; variants: (V & { id: number })[] };
type Cat = { id: number; name: string; note: string | null; active: boolean; sort: number; items: Item[] };
type Draft = { id?: number; categoryId: number; name: string; description: string; mode: "single" | "variants" | "daily"; price: string; variants: { name: string; price: string }[]; imageId: string | null; available: boolean; featured: boolean };

const api = async (url: string, method: string, body?: unknown) => {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "صار خطأ");
  return d;
};

function ItemDialog({ draft, cats, onClose, onSaved }: { draft: Draft; cats: Cat[]; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(draft);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function upload(f: File) {
    setUploading(true); setErr(null);
    const fd = new FormData(); fd.set("file", await compressImage(f, 1400));
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = await r.json();
    if (r.ok) setD((x) => ({ ...x, imageId: j.id })); else setErr(j.error);
    setUploading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const body = {
      categoryId: d.categoryId, name: d.name, description: d.description || null, imageId: d.imageId,
      available: d.available, featured: d.featured,
      price: d.mode === "single" ? Number(d.price) : null,
      variants: d.mode === "variants" ? d.variants.filter((v) => v.name.trim()).map((v) => ({ name: v.name, price: Number(v.price) })) : [],
    };
    try {
      if (d.mode === "single" && (d.price === "" || isNaN(Number(d.price)))) throw new Error("اكتب السعر");
      if (d.mode === "variants" && body.variants.length < 2) throw new Error("ضيف خيارين على الأقل، أو اختار سعر واحد");
      await api(d.id ? `/api/admin/items/${d.id}` : "/api/admin/items", d.id ? "PATCH" : "POST", body);
      onSaved();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={save} className="card w-full max-w-xl space-y-4 bg-ink-2 p-6" role="dialog" aria-modal="true" aria-label={d.id ? "تعديل صنف" : "صنف جديد"}>
        <div className="flex items-center justify-between"><h2 className="font-display text-xl">{d.id ? "تعديل صنف" : "صنف جديد"}</h2><button type="button" onClick={onClose} className="text-cream-muted" aria-label="سكّر">✕</button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="iname">الاسم</label><input id="iname" className="field" required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></div>
          <div><label className="label" htmlFor="icat">القسم</label>
            <select id="icat" className="field" value={d.categoryId} onChange={(e) => setD({ ...d, categoryId: Number(e.target.value) })}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
        </div>
        <div><label className="label" htmlFor="idesc">الوصف (اختياري)</label><textarea id="idesc" className="field min-h-20" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></div>

        <div>
          <span className="label">التسعير</span>
          <div className="flex flex-wrap gap-2">
            {([["single", "سعر واحد"], ["variants", "خيارات بأسعار"], ["daily", "حسب اليوم"]] as const).map(([m, l]) => (
              <button key={m} type="button" onClick={() => setD({ ...d, mode: m })} className={`chip ${d.mode === m ? "chip-on" : ""}`}>{l}</button>
            ))}
          </div>
          {d.mode === "single" && <input className="field num mt-3 max-w-40" inputMode="numeric" placeholder="السعر ₪" aria-label="السعر" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value.replace(/\D/g, "") })} />}
          {d.mode === "variants" && (
            <div className="mt-3 space-y-2">
              {d.variants.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <input className="field py-2" placeholder="مثلاً: تشكن" aria-label="اسم الخيار" value={v.name} onChange={(e) => setD({ ...d, variants: d.variants.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} />
                  <input className="field num w-28 py-2" inputMode="numeric" placeholder="₪" aria-label="سعر الخيار" value={v.price} onChange={(e) => setD({ ...d, variants: d.variants.map((x, k) => (k === i ? { ...x, price: e.target.value.replace(/\D/g, "") } : x)) })} />
                  <button type="button" className="px-2 text-cream-muted" aria-label="احذف الخيار" onClick={() => setD({ ...d, variants: d.variants.filter((_, k) => k !== i) })}>✕</button>
                </div>
              ))}
              <button type="button" className="text-sm font-bold text-brand-soft" onClick={() => setD({ ...d, variants: [...d.variants, { name: "", price: "" }] })}>+ ضيف خيار</button>
            </div>
          )}
          {d.mode === "daily" && <p className="mt-3 text-sm text-cream-muted">بيبيّن بالمنيو «السعر حسب اليوم» وما بينطلب أونلاين.</p>}
        </div>

        <div>
          <span className="label">الصورة</span>
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {d.imageId ? <img src={`/api/media/${d.imageId}`} alt="" className="h-20 w-28 rounded-lg object-cover" /> : <div className="grid h-20 w-28 place-items-center rounded-lg border border-dashed border-line text-xs text-cream-dim">بدون صورة</div>}
            <div className="space-y-2">
              <input type="file" accept="image/*" aria-label="ارفع صورة" disabled={uploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="text-sm text-cream-muted file:ml-3 file:rounded-full file:border-0 file:bg-cream file:px-4 file:py-2 file:font-bold file:text-ink" />
              {uploading && <p className="text-xs text-cream-muted">عم نرفع الصورة…</p>}
              {d.imageId && <button type="button" className="text-xs text-brand-soft" onClick={() => setD({ ...d, imageId: null })}>شيل الصورة</button>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={d.available} onChange={(e) => setD({ ...d, available: e.target.checked })} className="accent-brand" />متوفر</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={d.featured} onChange={(e) => setD({ ...d, featured: e.target.checked })} className="accent-brand" />يظهر بـ«الأكثر طلباً»</label>
        </div>
        {err && <p className="text-sm text-brand-soft" role="alert">{err}</p>}
        <div className="flex gap-3"><button className="btn-red flex-1" disabled={busy || uploading}>{busy ? "عم نحفظ…" : "احفظ"}</button><button type="button" onClick={onClose} className="btn-ghost">إلغاء</button></div>
      </form>
    </div>
  );
}

export function MenuEditor() {
  const [cats, setCats] = useState<Cat[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [newCat, setNewCat] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => setCats(await api("/api/admin/categories", "GET")), []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<unknown>) => { setErr(null); try { await fn(); await load(); } catch (e) { setErr((e as Error).message); } };
  const edit = (i: Item) => setDraft({
    id: i.id, categoryId: i.categoryId, name: i.name, description: i.description ?? "", imageId: i.imageId, available: i.available, featured: i.featured,
    mode: i.variants.length ? "variants" : i.price == null ? "daily" : "single", price: i.price?.toString() ?? "",
    variants: i.variants.length ? i.variants.map((v) => ({ name: v.name, price: String(v.price) })) : [{ name: "", price: "" }, { name: "", price: "" }],
  });
  const create = (categoryId: number) => setDraft({ categoryId, name: "", description: "", mode: "single", price: "", variants: [{ name: "", price: "" }, { name: "", price: "" }], imageId: null, available: true, featured: false });
  const ask = (key: string, fn: () => Promise<unknown>) => (confirm === key ? (setConfirm(null), act(fn)) : setConfirm(key));

  if (!cats) return <p className="text-cream-muted">عم نحمّل المنيو…</p>;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">المنيو</h1>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (newCat.trim()) act(() => api("/api/admin/categories", "POST", { name: newCat })).then(() => setNewCat("")); }}>
          <input className="field py-2" placeholder="اسم قسم جديد" aria-label="اسم قسم جديد" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <button className="btn-red btn-sm shrink-0">ضيف قسم</button>
        </form>
      </div>
      {err && <p className="text-sm text-brand-soft" role="alert">{err}</p>}

      {cats.map((c) => (
        <section key={c.id} className={`card overflow-hidden ${c.active ? "" : "opacity-60"}`}>
          <header className="flex flex-wrap items-center gap-3 border-b border-line bg-ink-3 px-5 py-3">
            <input className="min-w-0 flex-1 bg-transparent font-display text-xl focus:outline-none" defaultValue={c.name} aria-label="اسم القسم"
              onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && act(() => api(`/api/admin/categories/${c.id}`, "PATCH", { name: e.target.value }))} />
            <span className="text-xs text-cream-muted">{c.items.length} صنف</span>
            <button className="chip py-1 text-xs" onClick={() => act(() => api(`/api/admin/categories/${c.id}`, "PATCH", { active: !c.active }))}>{c.active ? "ظاهر" : "مخفي"}</button>
            <button className="btn-red btn-sm py-1.5" onClick={() => create(c.id)}>+ صنف</button>
            <button className={`text-xs ${confirm === `c${c.id}` ? "font-bold text-brand-soft" : "text-cream-dim"}`} onClick={() => ask(`c${c.id}`, () => api(`/api/admin/categories/${c.id}`, "DELETE"))}>
              {confirm === `c${c.id}` ? "متأكد؟ رح ينحذف مع أصنافه" : "احذف"}
            </button>
          </header>
          <ul className="divide-y divide-line">
            {c.items.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {i.imageId ? <img src={`/api/media/${i.imageId}`} alt="" className="h-11 w-14 rounded-md object-cover" /> : <div className="h-11 w-14 rounded-md border border-dashed border-line" />}
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{i.name}{i.featured && <span className="mr-2 text-xs text-brand-soft">★ مميز</span>}</p>
                  <p className="num text-sm text-cream-muted">{i.variants.length ? i.variants.map((v) => `${v.name} ${v.price}₪`).join(" · ") : i.price == null ? "حسب اليوم" : `${i.price} ₪`}</p>
                </div>
                <button onClick={() => act(() => api(`/api/admin/items/${i.id}`, "PATCH", { available: !i.available }))} role="switch" aria-checked={i.available}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${i.available ? "bg-ok/15 text-ok" : "bg-ink-4 text-cream-muted"}`}>{i.available ? "متوفر" : "خلصان"}</button>
                <button onClick={() => edit(i)} className="text-sm font-bold text-cream hover:text-brand-soft">تعديل</button>
                <button className={`text-xs ${confirm === `i${i.id}` ? "font-bold text-brand-soft" : "text-cream-dim"}`} onClick={() => ask(`i${i.id}`, () => api(`/api/admin/items/${i.id}`, "DELETE"))}>
                  {confirm === `i${i.id}` ? "متأكد؟" : "احذف"}
                </button>
              </li>
            ))}
            {c.items.length === 0 && <li className="px-5 py-6 text-center text-sm text-cream-dim">ما في أصناف بهالقسم</li>}
          </ul>
        </section>
      ))}
      {draft && <ItemDialog draft={draft} cats={cats} onClose={() => setDraft(null)} onSaved={() => { setDraft(null); load(); }} />}
    </div>
  );
}
