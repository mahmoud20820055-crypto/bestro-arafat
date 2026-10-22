"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const FRAME_COUNT = 62;
const frameSrc = (i: number) => `/media/frames/f${String(i + 1).padStart(2, "0")}.webp`;
const LAYERS = ["خبز بريوش سفلي", "صوص البيت", "قطعة مشوية: تشكن أو بيف", "جبنة شيدر سايحة", "مخلل", "بصل أحمر", "بندورة", "خس فريش", "صوص البيت", "خبز بريوش بالسمسم"];

/** Scroll-scrubbed burger: scrolling down assembles it frame by frame. */
export function BurgerReel() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [placed, setPlaced] = useState(0);

  useEffect(() => {
    const cv = canvas.current!, ctx = cv.getContext("2d")!;
    const frames = Array.from({ length: FRAME_COUNT }, (_, i) => { const im = new Image(); im.decoding = "async"; im.src = frameSrc(i); return im; });
    let wanted = 0, raf = 0;
    const ready = (im?: HTMLImageElement) => !!im && im.complete && im.naturalWidth > 0;
    const draw = () => {
      let k = wanted;
      for (let d = 0; d < FRAME_COUNT; d++) { if (ready(frames[wanted - d])) { k = wanted - d; break; } if (ready(frames[wanted + d])) { k = wanted + d; break; } }
      const im = frames[k];
      if (!ready(im)) return;
      const s = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight);
      const w = im.naturalWidth * s, h = im.naturalHeight * s;
      ctx.fillStyle = "#0a0909"; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
    };
    const size = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); draw();
    };
    const update = () => {
      const r = section.current!.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -r.top / (r.height - innerHeight)));
      const t = Math.max(0, Math.min(1, (p - 0.05) / 0.85));
      wanted = Math.round(t * (FRAME_COUNT - 1));
      setPlaced(Math.min(LAYERS.length - 1, Math.floor(t * (LAYERS.length - 1) + 1e-4)));
      draw();
    };
    frames.forEach((im, i) => (im.onload = () => { if (i === wanted || i === 0) draw(); }));
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", size);
    size(); update();
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", size); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={section} className="relative h-[400vh] bg-ink" aria-label="برجر عرفات طبقة طبقة">
      <div className="sticky top-[72px] h-[calc(100svh-72px)] overflow-hidden">
        <div className="wrap grid h-full items-center gap-6 py-4 md:grid-cols-[1fr_auto_1fr] md:gap-10">
          <div className="text-center md:text-right">
            <p className="eyebrow justify-center md:justify-start">نزّل لتحت وشوفه يتركّب</p>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">برجر عرفات،<br className="hidden md:block" /> طبقة طبقة</h2>
            <p className="mt-2 font-bold text-brand-soft md:hidden" aria-live="polite">{LAYERS[placed]}</p>
            <ul className="mt-8 hidden space-y-2 md:block">
              {[...LAYERS].map((n, i) => ({ n, i })).reverse().map(({ n, i }) => (
                <li key={i} className={`flex items-center gap-3 text-sm transition ${i <= placed ? "text-cream" : "text-cream-dim"}`}>
                  <span className={`h-2 w-2 rounded-full border transition ${i <= placed ? "border-brand bg-brand" : "border-cream-dim"}`} />{n}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto h-full max-h-[78svh] min-h-0 md:max-h-none" style={{ aspectRatio: "480 / 840" }}>
            <div className="pointer-events-none absolute inset-[15%_-25%] rounded-full bg-brand/15 blur-3xl" />
            <canvas ref={canvas} className="relative h-full w-full [mask-image:radial-gradient(ellipse_72%_68%_at_50%_50%,#000_60%,transparent_100%)]" role="img" aria-label="برجر بتنزل طبقاته وحدة فوق التانية" />
          </div>
          <div className="flex items-center justify-center gap-5 md:block md:space-y-5">
            <div className="font-latin text-5xl text-brand md:text-8xl"><span className="num">{placed + 1}</span><span className="text-2xl text-cream-dim md:text-4xl">/10</span></div>
            <p className="hidden text-sm text-cream-muted md:block">طبقات بمكانها. وإنت بتختار القطعة: تشكن أو بيف.</p>
            <Link href="#cat-burger" className="btn-red btn-sm">اطلب برجر</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
