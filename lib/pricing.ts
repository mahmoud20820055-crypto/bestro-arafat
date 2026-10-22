import { db } from "./db";

export type CartLine = { itemId: number; variantId?: number | null; qty: number };

export class OrderError extends Error {}

/** Recomputes every price from the database; the client's numbers are never trusted. */
export async function priceCart(lines: CartLine[], opts: { delivery: boolean; couponCode?: string | null }) {
  if (!lines.length) throw new OrderError("السلة فاضية");
  const settings = await db.setting.findUniqueOrThrow({ where: { id: 1 } });
  const items = await db.item.findMany({
    where: { id: { in: lines.map((l) => l.itemId) } },
    include: { variants: true, category: true },
  });

  const priced = lines.map((l) => {
    const item = items.find((i) => i.id === l.itemId);
    if (!item || !item.available || !item.category.active) throw new OrderError("في صنف بالسلة مش متوفر هلّق، شيله وكمّل");
    const qty = Math.max(1, Math.min(50, Math.floor(l.qty)));
    if (item.variants.length) {
      const v = item.variants.find((v) => v.id === l.variantId);
      if (!v) throw new OrderError(`اختار نوع ${item.name}`);
      return { itemId: item.id, variantId: v.id, name: item.name, variant: v.name, unitPrice: v.price, qty };
    }
    if (item.price == null) throw new OrderError(`${item.name} سعره حسب اليوم، اطلبه بالتلفون`);
    return { itemId: item.id, variantId: null, name: item.name, variant: null, unitPrice: item.price, qty };
  });

  const subtotal = priced.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  if (subtotal < settings.minOrder) throw new OrderError(`أقل طلب ${settings.minOrder} ₪`);

  let discount = 0;
  let coupon = null;
  if (opts.couponCode) {
    coupon = await checkCoupon(opts.couponCode, subtotal);
    discount = coupon.discount;
  }
  const deliveryFee = opts.delivery ? settings.deliveryFee : 0;
  return { lines: priced, subtotal, discount, deliveryFee, total: Math.max(0, subtotal - discount) + deliveryFee, coupon, settings };
}

export async function checkCoupon(code: string, subtotal: number) {
  const c = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!c || !c.active) throw new OrderError("الكوبون غير صحيح");
  if (c.expiresAt && c.expiresAt < new Date()) throw new OrderError("الكوبون منتهي");
  if (c.maxUses != null && c.uses >= c.maxUses) throw new OrderError("الكوبون خلص عدد استخداماته");
  if (subtotal < c.minSubtotal) throw new OrderError(`الكوبون بيشتغل على طلب فوق ${c.minSubtotal} ₪`);
  const discount = c.type === "PERCENT" ? Math.round((subtotal * Math.min(c.value, 100)) / 100) : Math.min(c.value, subtotal);
  return { id: c.id, code: c.code, discount };
}
