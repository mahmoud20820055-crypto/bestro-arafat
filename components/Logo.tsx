import Link from "next/link";
import { BRAND, LOGO_SRC } from "@/lib/brand";

export function Logo({ href = "/", small = false }: { href?: string; small?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-3" aria-label={BRAND.nameAr}>
      {LOGO_SRC ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={LOGO_SRC} alt="" className={small ? "h-9 w-9" : "h-11 w-11"} />
      ) : (
        <span className={`grid place-items-center rounded-full border border-brand/60 font-latin font-bold text-brand ${small ? "h-9 w-9 text-lg" : "h-11 w-11 text-xl"}`}>B</span>
      )}
      <span className="grid leading-none">
        <span className={`font-latin font-bold tracking-[.14em] text-cream ${small ? "text-sm" : "text-base"}`} dir="ltr">{BRAND.nameEn}</span>
        <span className="mt-1 text-[11px] text-cream-muted">{BRAND.nameAr}</span>
      </span>
    </Link>
  );
}
