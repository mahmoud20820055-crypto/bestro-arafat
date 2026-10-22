"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "./cart";

const NAV = [
  { href: "/#signature", label: "الأشهر" },
  { href: "/#menu", label: "المنيو" },
  { href: "/#visit", label: "موقعنا" },
  { href: "/orders", label: "طلباتي" },
];

export function SiteHeader() {
  const { count } = useCart();
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(scrollY > 20);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`sticky top-0 z-50 pt-[env(safe-area-inset-top)] transition-colors ${scrolled || path !== "/" ? "border-b border-line bg-ink/85 backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="wrap flex h-[72px] items-center gap-6">
        <Logo />
        <nav className="mr-auto hidden items-center gap-7 text-sm text-cream-muted md:flex" aria-label="الأقسام">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="transition hover:text-cream">{n.label}</Link>)}
        </nav>
        <Link href="/checkout" className="btn-red btn-sm mr-auto md:mr-0" aria-label={`السلة، ${count} أصناف`}>
          السلة
          <span className="num grid h-6 min-w-6 place-items-center rounded-full bg-white px-1.5 text-xs text-brand">{count}</span>
        </Link>
      </div>
    </header>
  );
}
