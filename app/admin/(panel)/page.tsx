import Link from "next/link";
import { getStats } from "@/lib/stats";
import { getSettings } from "@/lib/menu";
import { OpenToggle } from "@/components/admin/OpenToggle";

const RANGES = [{ d: 1, label: "اليوم" }, { d: 7, label: "آخر 7 أيام" }, { d: 30, label: "آخر 30 يوم" }];

export default async function Overview({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const d = [1, 7, 30].includes(Number((await searchParams).d)) ? Number((await searchParams).d) : 1;
  const [s, settings] = await Promise.all([getStats(d), getSettings()]);
  const max = Math.max(1, ...s.series.map((x) => x.sales));
  const topMax = Math.max(1, ...s.top.map((x) => x.qty));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">الرئيسية</h1>
        <OpenToggle initial={settings.isOpen} />
      </div>

      {(s.live > 0 || s.awaitingPayment > 0) && (
        <Link href="/admin/orders" className="card flex flex-wrap items-center gap-6 border-brand/50 bg-brand/10 p-5 transition hover:bg-brand/15">
          <span className="font-bold">طلبات شغّالة الآن: <span className="num text-xl">{s.live}</span></span>
          {s.awaitingPayment > 0 && <span className="text-warn">إيصالات بانتظار التأكيد: <span className="num">{s.awaitingPayment}</span></span>}
          <span className="mr-auto text-sm font-bold">افتح لوحة الطلبات ←</span>
        </Link>
      )}

      <div className="flex gap-2">
        {RANGES.map((r) => <Link key={r.d} href={`/admin?d=${r.d}`} className={`chip ${d === r.d ? "chip-on" : ""}`}>{r.label}</Link>)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "المبيعات", value: `${s.sales.toLocaleString("en-US")} ₪` },
          { label: "عدد الطلبات", value: s.orders },
          { label: "متوسط الطلب", value: `${s.avg} ₪` },
          { label: "توصيل / استلام", value: `${s.delivery} / ${s.orders - s.delivery}`, sub: s.cancelled ? `${s.cancelled} ملغي` : undefined },
        ].map((k) => (
          <div key={k.label} className="card p-5">
            <p className="text-sm text-cream-muted">{k.label}</p>
            <p className="num mt-2 text-3xl font-bold">{k.value}</p>
            {k.sub && <p className="mt-1 text-xs text-brand-soft">{k.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-6">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-display text-xl">المبيعات اليومية</h2>
            <span className="num text-xs text-cream-muted">أعلى يوم: {max.toLocaleString("en-US")} ₪</span>
          </div>
          <div className="relative flex h-56 items-end gap-1.5 border-b border-line">
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
            {s.series.map((x) => (
              <div key={x.day} className="group relative flex h-full flex-1 items-end">
                <div className={`w-full rounded-t-md transition ${x.day === s.series.at(-1)?.day ? "bg-brand" : "bg-cream/25 group-hover:bg-cream/45"}`} style={{ height: `${(x.sales / max) * 100}%`, minHeight: x.sales ? 3 : 0 }} />
                <div className="pointer-events-none absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-cream px-2.5 py-1.5 text-xs font-bold text-ink group-hover:block">
                  <span className="num">{x.sales} ₪</span> · {x.orders} طلب
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            {s.series.map((x, i) => (
              <span key={x.day} className="num flex-1 text-center text-[10px] text-cream-dim">{i % 2 === s.series.length % 2 ? "" : Number(x.day.slice(8))}</span>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-5 font-display text-xl">الأكثر طلباً</h2>
          {s.top.length === 0 ? <p className="text-sm text-cream-muted">ما في طلبات بهالفترة.</p> : (
            <ul className="space-y-3">
              {s.top.map((t) => (
                <li key={t.name}>
                  <div className="mb-1 flex justify-between text-sm"><span>{t.name}</span><span className="num text-cream-muted">{t.qty} · {t.revenue} ₪</span></div>
                  <div className="h-1.5 rounded-full bg-ink-4"><div className="h-full rounded-full bg-brand" style={{ width: `${(t.qty / topMax) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
