import { z } from "zod";
import { priceCart } from "@/lib/pricing";
import { handle, ok } from "@/lib/http";

const Body = z.object({
  lines: z.array(z.object({ itemId: z.number().int(), variantId: z.number().int().nullish(), qty: z.number().int().min(1).max(50) })).max(60),
  type: z.enum(["DELIVERY", "PICKUP"]),
  coupon: z.string().max(40).nullish(),
});

/** Live totals for the checkout page, priced on the server. */
export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    const q = await priceCart(b.lines, { delivery: b.type === "DELIVERY", couponCode: b.coupon || null });
    return ok({ subtotal: q.subtotal, discount: q.discount, deliveryFee: q.deliveryFee, total: q.total, coupon: q.coupon?.code ?? null });
  } catch (e) {
    return handle(e);
  }
}
