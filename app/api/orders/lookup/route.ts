import { z } from "zod";
import { db } from "@/lib/db";
import { fail, handle, ok } from "@/lib/http";
import { normalizePhone } from "@/lib/format";
import { publicOrder } from "@/lib/orders";

const Body = z.object({ phone: z.string().max(20), number: z.coerce.number().int().positive() });

/** Customer area: phone + any one of their order numbers unlocks their order history. */
export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    const phone = normalizePhone(b.phone);
    const match = await db.order.findFirst({ where: { id: b.number, phone } });
    if (!match) return fail("ما لقينا طلب بهالرقم وهالجوال", 404);
    const orders = await db.order.findMany({ where: { phone }, orderBy: { createdAt: "desc" }, take: 30, include: { items: true } });
    return ok(orders.map(publicOrder));
  } catch (e) {
    return handle(e);
  }
}
