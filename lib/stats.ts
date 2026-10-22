import { Prisma } from "@prisma/client";
import { db } from "./db";

const TZ = "Asia/Gaza";
// createdAt is stored as UTC without a zone; this converts it to Gaza local time
const LOCAL = Prisma.sql`(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ})`;
const LOCAL_NOW = Prisma.sql`(now() AT TIME ZONE ${TZ})`;

export async function getStats(days: number) {
  const since = Prisma.sql`date_trunc('day', ${LOCAL_NOW}) - make_interval(days => ${days - 1}::int)`;

  const [summary] = await db.$queryRaw<{ sales: bigint | null; orders: bigint; cancelled: bigint; delivery: bigint }[]>`
    SELECT COALESCE(SUM(total) FILTER (WHERE status <> 'CANCELLED'), 0) AS sales,
           COUNT(*) FILTER (WHERE status <> 'CANCELLED') AS orders,
           COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled,
           COUNT(*) FILTER (WHERE status <> 'CANCELLED' AND type = 'DELIVERY') AS delivery
    FROM "Order" WHERE ${LOCAL} >= ${since}`;

  const chartDays = Math.max(days, 14);
  const series = await db.$queryRaw<{ day: Date; sales: bigint; orders: bigint }[]>`
    SELECT d::date AS day, COALESCE(SUM(o.total), 0) AS sales, COUNT(o.id) AS orders
    FROM generate_series(date_trunc('day', ${LOCAL_NOW}) - make_interval(days => ${chartDays - 1}::int), date_trunc('day', ${LOCAL_NOW}), interval '1 day') d
    LEFT JOIN "Order" o ON date_trunc('day', ((o."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ})) = d AND o.status <> 'CANCELLED'
    GROUP BY d ORDER BY d`;

  const top = await db.$queryRaw<{ name: string; qty: bigint; revenue: bigint }[]>`
    SELECT i.name, SUM(i.qty) AS qty, SUM(i.qty * i."unitPrice") AS revenue
    FROM "OrderItem" i JOIN "Order" o ON o.id = i."orderId"
    WHERE o.status <> 'CANCELLED' AND ((o."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ}) >= ${since}
    GROUP BY i.name ORDER BY qty DESC LIMIT 8`;

  const [live, awaitingPayment] = await Promise.all([
    db.order.count({ where: { status: { in: ["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] } } }),
    db.order.count({ where: { payment: "WALLET", paymentStatus: "PENDING", status: { not: "CANCELLED" } } }),
  ]);

  const sales = Number(summary.sales ?? 0), orders = Number(summary.orders);
  return {
    sales, orders, avg: orders ? Math.round(sales / orders) : 0,
    cancelled: Number(summary.cancelled), delivery: Number(summary.delivery),
    live, awaitingPayment,
    series: series.map((r) => ({ day: r.day.toISOString().slice(0, 10), sales: Number(r.sales), orders: Number(r.orders) })),
    top: top.map((r) => ({ name: r.name, qty: Number(r.qty), revenue: Number(r.revenue) })),
  };
}
