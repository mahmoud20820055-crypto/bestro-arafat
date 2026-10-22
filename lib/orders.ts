import type { Order, OrderItem } from "@prisma/client";

export type HistoryEntry = { status: string; at: string; by?: string };

export function publicOrder(o: Order & { items: OrderItem[] }) {
  return {
    number: o.id,
    token: o.token,
    customerName: o.customerName,
    phone: o.phone.replace(/^(\d{3})\d{4}(\d{3})$/, "$1****$2"),
    type: o.type,
    area: o.area,
    address: o.address,
    notes: o.notes,
    payment: o.payment,
    paymentStatus: o.paymentStatus,
    status: o.status,
    cancelReason: o.cancelReason,
    subtotal: o.subtotal,
    discount: o.discount,
    deliveryFee: o.deliveryFee,
    total: o.total,
    couponCode: o.couponCode,
    history: o.history as HistoryEntry[],
    items: o.items.map((i) => ({ itemId: i.itemId, variantId: i.variantId, name: i.name, variant: i.variant, unitPrice: i.unitPrice, qty: i.qty })),
    createdAt: o.createdAt.toISOString(),
  };
}
export type PublicOrder = ReturnType<typeof publicOrder>;

export const FLOW_DELIVERY = ["NEW", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
export const FLOW_PICKUP = ["NEW", "ACCEPTED", "PREPARING", "READY", "DELIVERED"] as const;
