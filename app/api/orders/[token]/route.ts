import { db } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { publicOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const o = await db.order.findUnique({ where: { token }, include: { items: true } });
  if (!o) return fail("الطلب مش موجود", 404);
  return ok(publicOrder(o));
}
