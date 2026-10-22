import { db } from "@/lib/db";
import { fail, handle, ok, readImage } from "@/lib/http";

/** Lets the customer upload a new receipt after the old one was rejected. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const o = await db.order.findUnique({ where: { token } });
    if (!o) return fail("الطلب مش موجود", 404);
    if (o.payment !== "WALLET" || ["DELIVERED", "CANCELLED"].includes(o.status)) return fail("ما بتقدر ترفع إيصال لهالطلب");
    const img = await readImage((await req.formData()).get("receipt"), 4);
    if (!img) return fail("اختار صورة الإيصال");
    const m = await db.media.create({ data: { ...img, isPrivate: true } });
    await db.order.update({ where: { id: o.id }, data: { receiptId: m.id, paymentStatus: "PENDING" } });
    return ok({ ok: true });
  } catch (e) {
    return handle(e);
  }
}
