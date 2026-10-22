import Link from "next/link";
import { BurgerReel } from "@/components/BurgerReel";
import { ItemCard, MenuBoard } from "@/components/MenuBoard";
import { getMenu, getSettings } from "@/lib/menu";

export default async function Home() {
  const [menu, s] = await Promise.all([getMenu(), getSettings()]);
  const featured = menu.flatMap((c) => c.items).filter((i) => i.featured).slice(0, 4);
  const itemCount = menu.reduce((a, c) => a + c.items.length, 0);

  return (
    <>
      {/* Hero */}
      <section className="relative -mt-[72px] overflow-hidden pt-[72px]">
        <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-brand/20 blur-[140px]" />
        <div className="wrap relative grid items-center gap-12 py-12 md:grid-cols-[1.15fr_.85fr] md:py-20">
          <div>
            <p className="eyebrow">غزة · شارع النصر</p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[1.15] sm:text-6xl lg:text-7xl">
              شاورما وبرجر،<br /><span className="text-brand">على أصولها.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-cream-muted">
              مطعم بيسترو عرفات للمأكولات الشرقية والغربية. اطلب أونلاين، توصيل أو استلام، وتابع طلبك لحظة بلحظة بدون ما تسجّل.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#menu" className="btn-red">اطلب الآن</Link>
              <Link href="/orders" className="btn-ghost">تتبع طلبي</Link>
            </div>
            <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-5 border-t border-line pt-7">
              <div><dt className="text-xs text-cream-muted">متابع على إنستغرام</dt><dd className="num mt-1 font-latin text-3xl font-bold">78K+</dd></div>
              <div><dt className="text-xs text-cream-muted">صنف بالمنيو</dt><dd className="num mt-1 font-latin text-3xl font-bold">{itemCount}</dd></div>
              <div><dt className="text-xs text-cream-muted">جاهز خلال</dt><dd className="num mt-1 font-latin text-3xl font-bold">{s.prepMinutes}<span className="mr-1 font-body text-base text-cream-muted">دقيقة</span></dd></div>
            </dl>
          </div>
          <div className="relative mx-auto w-full max-w-[380px]">
            <div className="absolute -inset-3 rounded-[2.2rem] border border-brand/30" />
            <video className="relative aspect-[9/16] w-full rounded-[2rem] object-cover shadow-[0_40px_120px_-30px_rgba(226,27,44,.45)]"
              src="/media/burger.mp4" poster="/media/burger-poster.webp" autoPlay muted loop playsInline preload="metadata" aria-label="فيديو برجر عرفات" />
          </div>
        </div>
      </section>

      {/* Signature */}
      {featured.length > 0 && (
        <section id="signature" className="wrap py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div><p className="eyebrow">الأكثر طلباً</p><h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">أطباق البيت</h2></div>
            <p className="max-w-md text-cream-muted">إذا أول مرة بتطلب منّا، ابلّش من هدول.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((i) => <ItemCard key={i.id} item={i} isOpen={s.isOpen} />)}
          </div>
        </section>
      )}

      <BurgerReel />

      {/* Menu */}
      <section id="menu" className="wrap py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow font-latin">MENU BISTRO ARAFAT</p><h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">المنيو</h2></div>
          <p className="max-w-md text-cream-muted">الأسعار بالشيكل. اضغط على السعر عشان تضيف الصنف لسلتك.</p>
        </div>
        <MenuBoard menu={menu} isOpen={s.isOpen} />
      </section>

      {/* Visit */}
      <section id="visit" className="border-t border-line bg-ink-2">
        <div className="wrap grid gap-10 py-20 md:grid-cols-3">
          <div className="md:col-span-1"><p className="eyebrow">زورونا</p><h2 className="mt-3 font-display text-4xl font-bold">أهلاً فيكم</h2></div>
          <div className="space-y-2">
            <h3 className="font-display text-xl">العنوان</h3>
            <p className="text-cream-muted">{s.address}</p>
            <a className="inline-block pt-2 text-sm font-bold text-brand-soft hover:text-brand" target="_blank" rel="noreferrer"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("بيسترو عرفات " + s.address)}`}>افتح على الخريطة ←</a>
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-xl">للطلب بالتلفون</h3>
            <p className="num select-all text-2xl" dir="ltr" style={{ textAlign: "right" }}>{s.phones}</p>
            {s.hours && <p className="text-cream-muted">{s.hours}</p>}
          </div>
        </div>
      </section>
    </>
  );
}
