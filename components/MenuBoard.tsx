"use client";
import { useEffect, useRef, useState } from "react";
import type { MenuCategory, MenuItem } from "@/lib/menu";
import { useCart } from "./cart";

export function ItemCard({ item, isOpen }: { item: MenuItem; isOpen: boolean }) {
  const { add } = useCart();
  const disabled = !item.available || !isOpen;
  const img = item.imageId ? `/api/media/${item.imageId}` : null;
  return (
    <article className={`card group flex flex-col overflow-hidden transition hover:border-brand/40 ${!item.available ? "opacity-55" : ""}`}>
      {img && (
        <div className="relative aspect-[4/3] overflow-hidden bg-ink-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold leading-snug">{item.name}</h3>
          {!item.available && <span className="shrink-0 rounded-full bg-ink-4 px-2.5 py-1 text-xs text-cream-muted">خلصان اليوم</span>}
        </div>
        {item.description && <p className="text-sm leading-6 text-cream-muted">{item.description}</p>}
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {item.variants.length ? (
            item.variants.map((v) => (
              <button key={v.id} type="button" disabled={disabled}
                onClick={() => add({ itemId: item.id, variantId: v.id, name: item.name, variant: v.name, price: v.price })}
                className="flex items-baseline gap-2 rounded-xl border border-line px-3 py-2 text-sm transition hover:border-brand hover:bg-brand hover:text-white disabled:pointer-events-none"
                aria-label={`أضف ${item.name} ${v.name} بـ ${v.price} شيكل`}>
                {v.name}<span className="num text-base font-bold">{v.price}₪</span><span aria-hidden>+</span>
              </button>
            ))
          ) : item.price == null ? (
            <span className="text-sm text-cream-muted">السعر حسب اليوم · اطلبه بالتلفون</span>
          ) : (
            <div className="flex w-full items-center justify-between">
              <span className="num text-2xl font-bold text-cream">{item.price}<span className="mr-1 text-base text-cream-muted">₪</span></span>
              <button type="button" disabled={disabled}
                onClick={() => add({ itemId: item.id, variantId: null, name: item.name, variant: null, price: item.price! })}
                className="grid h-10 w-10 place-items-center rounded-full bg-cream text-xl font-bold text-ink transition hover:bg-brand hover:text-white disabled:pointer-events-none"
                aria-label={`أضف ${item.name}`}>+</button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

const slug = (c: MenuCategory) => (c.name.includes("برجر") ? "burger" : String(c.id));

export function MenuBoard({ menu, isOpen }: { menu: MenuCategory[]; isOpen: boolean }) {
  const [active, setActive] = useState(menu[0]?.id);
  const chips = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.id))), { rootMargin: "-35% 0px -60% 0px" });
    document.querySelectorAll("[data-cat]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    // Scroll only the chip row sideways; scrollIntoView would also move the page
    const row = chips.current, chip = row?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (row && chip) row.scrollTo({ left: chip.offsetLeft - row.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  return (
    <div>
      <nav ref={chips} aria-label="أقسام المنيو"
        className="sticky top-[72px] z-30 -mx-4 mb-10 flex gap-2 overflow-x-auto border-b border-line bg-ink/90 px-4 py-3 backdrop-blur-xl [scrollbar-width:none] sm:-mx-6 sm:px-6">
        {menu.map((c) => (
          <a key={c.id} data-chip={c.id} href={`#cat-${slug(c)}`} className={`chip shrink-0 ${active === c.id ? "chip-on" : ""}`}>{c.name}</a>
        ))}
      </nav>
      <div className="space-y-16">
        {menu.map((c) => (
          <section key={c.id} id={`cat-${slug(c)}`} data-cat data-id={c.id}>
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-line pb-4">
              <h3 className="font-display text-3xl font-bold">{c.name}</h3>
              {c.note && <span className="text-sm text-cream-muted">{c.note}</span>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {c.items.map((i) => <ItemCard key={i.id} item={i} isOpen={isOpen} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
