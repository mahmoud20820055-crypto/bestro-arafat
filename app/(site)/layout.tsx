import Link from "next/link";
import { CartProvider } from "@/components/cart";
import { SiteHeader } from "@/components/SiteHeader";
import { Logo } from "@/components/Logo";
import { getSettings } from "@/lib/menu";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <CartProvider>
      {!s.isOpen && (
        <div className="bg-brand-deep px-4 py-2 text-center text-sm font-bold text-white">المطعم مسكّر هلّق. بتقدر تتصفح المنيو، والطلبات بترجع مع بداية الدوام.</div>
      )}
      {s.isOpen && s.announcement && <div className="bg-brand px-4 py-2 text-center text-sm font-bold text-white">{s.announcement}</div>}
      <SiteHeader />
      <main>{children}</main>
      <footer className="border-t border-line">
        <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-sm text-sm leading-7 text-cream-muted">مطعم بيسترو عرفات للمأكولات الشرقية والغربية. شاورما، برجر، فرشوحة، ووجبات شرقية بتنعمل طازة.</p>
          </div>
          <div className="space-y-3 text-sm">
            <h3 className="font-display text-lg text-cream">زورونا</h3>
            <p className="text-cream-muted">{s.address}</p>
            {s.hours && <p className="text-cream-muted">{s.hours}</p>}
          </div>
          <div className="space-y-3 text-sm">
            <h3 className="font-display text-lg text-cream">للطلب والاستفسار</h3>
            <p className="num select-all text-cream" dir="ltr" style={{ textAlign: "right" }}>{s.phones}</p>
            <div className="flex gap-4 text-cream-muted">
              <a href={s.instagram} target="_blank" rel="noreferrer" className="hover:text-cream">Instagram</a>
              <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-cream">WhatsApp</a>
              <Link href="/orders" className="hover:text-cream">تتبع طلبي</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-line py-5 text-center text-xs text-cream-dim">© {new Date().getFullYear()} بيسترو عرفات · Bistro Arafat</div>
      </footer>
    </CartProvider>
  );
}
