"use client";
import { useState } from "react";
import { BRAND } from "@/lib/brand";

export default function Login() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    if (r.ok) {
      const next = new URLSearchParams(location.search).get("next");
      location.href = next && next.startsWith("/admin") ? next : "/admin";
    } else { setErr((await r.json()).error); setBusy(false); }
  }
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-5 p-8">
        <div className="text-center">
          <p className="font-latin text-lg font-bold tracking-[.14em]" dir="ltr">{BRAND.nameEn}</p>
          <h1 className="mt-1 font-display text-2xl">لوحة الإدارة</h1>
        </div>
        <div><label className="label" htmlFor="u">اسم المستخدم</label><input id="u" className="field" dir="ltr" autoComplete="username" required value={username} onChange={(e) => setU(e.target.value)} /></div>
        <div><label className="label" htmlFor="p">كلمة السر</label><input id="p" type="password" className="field" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setP(e.target.value)} /></div>
        {err && <p className="text-sm text-brand-soft" role="alert">{err}</p>}
        <button className="btn-red w-full" disabled={busy}>{busy ? "لحظة…" : "دخول"}</button>
      </form>
    </main>
  );
}
