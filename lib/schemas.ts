import { z } from "zod";

export const CategoryBody = z.object({
  name: z.string().trim().min(1, "اكتب اسم القسم").max(60),
  note: z.string().trim().max(80).nullish(),
  sort: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const ItemBody = z.object({
  categoryId: z.number().int(),
  name: z.string().trim().min(1, "اكتب اسم الصنف").max(80),
  description: z.string().trim().max(300).nullish(),
  price: z.number().int().min(0).max(10000).nullish(),
  imageId: z.string().max(40).nullish(),
  available: z.boolean().optional(),
  featured: z.boolean().optional(),
  sort: z.number().int().optional(),
  variants: z.array(z.object({ name: z.string().trim().min(1, "اكتب اسم الخيار").max(40), price: z.number().int().min(0).max(10000) })).max(10).optional(),
});

export const CouponBody = z.object({
  code: z.string().trim().min(3, "الكود 3 أحرف على الأقل").max(30).regex(/^[A-Za-z0-9_-]+$/, "الكود حروف إنجليزي وأرقام بس").transform((s) => s.toUpperCase()),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().min(1, "القيمة لازم تكون أكبر من صفر").max(10000),
  minSubtotal: z.number().int().min(0).default(0),
  maxUses: z.number().int().min(1).nullish(),
  expiresAt: z.string().nullish().transform((s) => (s ? new Date(s) : null)),
  active: z.boolean().optional(),
});
