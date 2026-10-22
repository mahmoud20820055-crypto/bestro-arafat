export const shekel = (n: number) => `${n.toLocaleString("en-US")} ₪`;

export const STATUS_LABEL: Record<string, string> = {
  NEW: "طلب جديد",
  ACCEPTED: "تم القبول",
  PREPARING: "قيد التحضير",
  READY: "جاهز",
  OUT_FOR_DELIVERY: "بالطريق إليك",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
};

export const PAYMENT_LABEL: Record<string, string> = {
  WALLET: "تحويل محفظة / بنك",
  AT_PICKUP: "الدفع بالمحل عند الاستلام",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "بانتظار التأكيد",
  VERIFIED: "تم تأكيد الدفع",
  REJECTED: "الإيصال مرفوض",
};

/** Normalises Palestinian mobile numbers to 05XXXXXXXX. */
export function normalizePhone(raw: string) {
  let p = raw.replace(/[^\d]/g, "");
  p = p.replace(/^(00)?970/, "0").replace(/^(00)?972/, "0");
  if (/^5\d{8}$/.test(p)) p = "0" + p;
  return p;
}
export const isValidPhone = (p: string) => /^05\d{8}$/.test(p);

export const mediaUrl = (id?: string | null) => (id ? `/api/media/${id}` : null);
