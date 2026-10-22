import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <p className="font-latin text-6xl font-bold text-brand">404</p>
        <h1 className="mt-3 font-display text-2xl">الصفحة مش موجودة</h1>
        <Link href="/" className="btn-red mt-6">ارجع للرئيسية</Link>
      </div>
    </main>
  );
}
