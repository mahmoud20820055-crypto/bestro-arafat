import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/http";
import { CouponBody } from "@/lib/schemas";


export async function GET() {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  return ok(await db.coupon.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function POST(req: Request) {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  try {
    const b = CouponBody.parse(await req.json());
    if (b.type === "PERCENT" && b.value > 100) return fail("النسبة ما بتزيد عن 100%");
    if (await db.coupon.findUnique({ where: { code: b.code } })) return fail("الكود مستخدم قبل");
    return ok(await db.coupon.create({ data: b }), { status: 201 });
  } catch (e) {
    return handle(e);
  }
}
