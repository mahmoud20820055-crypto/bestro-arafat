import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { OrderError, priceCart } from "@/lib/pricing";
import { handle, ok, readImage } from "@/lib/http";
import { isValidPhone, normalizePhone } from "@/lib/format";

const Body = z.object({
  customerName: z.string().trim().min(2, "اكتب اسمك").max(60),
  phone: z.string().trim().transform(normalizePhone).refine(isValidPhone, "رقم الجوال لازم يكون متل 059XXXXXXX"),
  type: z.enum(["DELIVERY", "PICKUP"]),
  area: z.string().trim().max(80).optional(),
  address: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(300).optional(),
  payment: z.enum(["WALLET", "AT_PICKUP"]),
  coupon: z.string().trim().max(40).optional(),
  lines: z.array(z.object({ itemId: z.number().int(), variantId: z.number().int().nullish(), qty: z.number().int().min(1).max(50) })).min(1).max(60),
});

/** Guest checkout: no account needed, the order is reachable through its secret token. */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const b = Body.parse(JSON.parse(String(form.get("order") || "{}")));
    if (b.type === "DELIVERY" && (!b.area || !b.address)) throw new OrderError("اكتب المنطقة والعنوان للتوصيل");
    if (b.type === "DELIVERY" && b.payment !== "WALLET") throw new OrderError("طلبات التوصيل بتندفع بتحويل محفظة أو بنك");
    const receipt = await readImage(form.get("receipt"), 4);
    if (b.payment === "WALLET" && !receipt) throw new OrderError("ارفع صورة إيصال التحويل");

    const recent = await db.order.count({ where: { phone: b.phone, status: "NEW", createdAt: { gt: new Date(Date.now() - 3600_000) } } });
    if (recent >= 3) throw new OrderError("عندك طلبات لسا ما انقبلت، استنى شوي أو اتصل فينا");

    const q = await priceCart(b.lines, { delivery: b.type === "DELIVERY", couponCode: b.coupon || null });
    if (!q.settings.isOpen) throw new OrderError("المطعم مسكّر هلّق، جرّب بوقت الدوام");

    const order = await db.$transaction(async (tx) => {
      if (q.coupon) {
        const c = await tx.coupon.findUniqueOrThrow({ where: { id: q.coupon.id } });
        const used = await tx.coupon.updateMany({
          where: { id: c.id, ...(c.maxUses != null ? { uses: { lt: c.maxUses } } : {}) },
          data: { uses: { increment: 1 } },
        });
        if (!used.count) throw new OrderError("الكوبون خلص عدد استخداماته");
      }
      const media = receipt ? await tx.media.create({ data: { ...receipt, isPrivate: true } }) : null;
      return tx.order.create({
        data: {
          token: randomBytes(16).toString("base64url"),
          customerName: b.customerName,
          phone: b.phone,
          type: b.type,
          area: b.type === "DELIVERY" ? b.area : null,
          address: b.type === "DELIVERY" ? b.address : null,
          notes: b.notes || null,
          payment: b.payment,
          receiptId: media?.id,
          subtotal: q.subtotal,
          discount: q.discount,
          deliveryFee: q.deliveryFee,
          total: q.total,
          couponCode: q.coupon?.code ?? null,
          history: [{ status: "NEW", at: new Date().toISOString() }],
          items: { create: q.lines },
        },
      });
    });
    return ok({ token: order.token, number: order.id }, { status: 201 });
  } catch (e) {
    return handle(e);
  }
}
