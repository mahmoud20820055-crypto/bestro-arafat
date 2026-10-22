"use client";
import { useState } from "react";

/** Quick switch to stop or resume online orders. */
export function OpenToggle({ initial }: { initial: boolean }) {
  const [open, setOpen] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isOpen: !open }) });
    if (r.ok) setOpen(!open);
    setBusy(false);
  }
  return (
    <button type="button" onClick={toggle} disabled={busy} role="switch" aria-checked={open}
      className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-bold transition ${open ? "border-ok/50 bg-ok/10 text-ok" : "border-brand/50 bg-brand/10 text-brand-soft"}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${open ? "bg-ok" : "bg-brand"}`} />
      {open ? "المطعم فاتح · الطلبات شغّالة" : "المطعم مسكّر · الطلبات موقفة"}
    </button>
  );
}
