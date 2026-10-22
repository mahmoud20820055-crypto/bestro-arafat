import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Orders board feed: everything still in progress plus today's finished orders. */
export async function GET() {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const orders = await db.order.findMany({
    where: { OR: [{ status: { notIn: ["DELIVERED", "CANCELLED"] } }, { updatedAt: { gte: start } }] },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 200,
  });
  return ok(orders);
}
