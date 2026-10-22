import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/http";
import type { HistoryEntry } from "@/lib/orders";

const Body = z.object({
  status: z.enum(["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  cancelReason: z.string().max(200).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdmin();
  if (deny) return deny;
  try {
    const id = Number((await params).id);
    const b = Body.parse(await req.json());
    const o = await db.order.findUnique({ where: { id } });
    if (!o) return fail("الطلب مش موجود", 404);
    const history = (o.history as HistoryEntry[]) ?? [];
    if (b.status && b.status !== o.status) history.push({ status: b.status, at: new Date().toISOString(), by: admin.name });
    if (b.paymentStatus && b.paymentStatus !== o.paymentStatus) history.push({ status: `PAYMENT_${b.paymentStatus}`, at: new Date().toISOString(), by: admin.name });
    // Give the coupon use back when an order is cancelled
    if (b.status === "CANCELLED" && o.status !== "CANCELLED" && o.couponCode) {
      await db.coupon.updateMany({ where: { code: o.couponCode, uses: { gt: 0 } }, data: { uses: { decrement: 1 } } });
    }
    const updated = await db.order.update({
      where: { id },
      data: { status: b.status, paymentStatus: b.paymentStatus, cancelReason: b.status === "CANCELLED" ? b.cancelReason || null : undefined, history },
      include: { items: true },
    });
    return ok(updated);
  } catch (e) {
    return handle(e);
  }
}
