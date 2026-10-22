"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "الرئيسية" },
  { href: "/admin/orders", label: "الطلبات" },
  { href: "/admin/menu", label: "المنيو" },
  { href: "/admin/coupons", label: "العروض والكوبونات" },
  { href: "/admin/settings", label: "الإعدادات" },
];

export function AdminNav({ name, pending }: { name: string; pending: number }) {
  const path = usePathname();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    location.href = "/admin/login";
  }
  return (
    <aside className="border-b border-line bg-ink-2 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-l">
      <div className="flex items-center justify-between p-4 md:block md:p-6">
        <div>
          <p className="font-latin text-sm font-bold tracking-[.14em]" dir="ltr">BISTRO ARAFAT</p>
          <p className="text-xs text-cream-muted">أهلاً {name}</p>
        </div>
        <button onClick={logout} className="text-xs text-cream-muted hover:text-cream md:hidden">خروج</button>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:px-4" aria-label="أقسام الإدارة">
        {LINKS.map((l) => {
          const on = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href}
              className={`flex shrink-0 items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition ${on ? "bg-brand text-white" : "text-cream-muted hover:bg-ink-3 hover:text-cream"}`}>
              {l.label}
              {l.href === "/admin/orders" && pending > 0 && <span className="num rounded-full bg-white px-2 text-xs text-brand">{pending}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="hidden space-y-2 p-6 md:absolute md:bottom-0 md:block">
        <Link href="/" target="_blank" className="block text-sm text-cream-muted hover:text-cream">افتح الموقع ↗</Link>
        <button onClick={logout} className="text-sm text-cream-muted hover:text-cream">تسجيل خروج</button>
      </div>
    </aside>
  );
}
