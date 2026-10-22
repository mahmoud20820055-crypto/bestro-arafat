"use client";
import { useState } from "react";

export function CopyText({ text, label = "انسخ" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="rounded-lg border border-line px-2.5 py-1 text-xs font-bold text-cream-muted hover:text-cream"
      onClick={() => navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }, () => {})}>
      {done ? "انتسخ ✓" : label}
    </button>
  );
}
