import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { publicOrder } from "@/lib/orders";
import { getSettings } from "@/lib/menu";
import { OrderTracker } from "@/components/OrderTracker";

export const metadata = { title: "تتبع الطلب", robots: { index: false } };

export default async function TrackPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string }> }) {
  const { token } = await params;
  const o = await db.order.findUnique({ where: { token }, include: { items: true } });
  if (!o) notFound();
  const s = await getSettings();
  return (
    <div className="wrap py-12">
      <OrderTracker initial={publicOrder(o)} isNew={(await searchParams).new === "1"} prepMinutes={s.prepMinutes} phones={s.phones} />
    </div>
  );
}
