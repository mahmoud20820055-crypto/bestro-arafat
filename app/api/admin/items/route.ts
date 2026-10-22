import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/http";
import { ItemBody } from "@/lib/schemas";


export async function POST(req: Request) {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  try {
    const { variants, ...b } = ItemBody.parse(await req.json());
    const max = await db.item.aggregate({ where: { categoryId: b.categoryId }, _max: { sort: true } });
    const item = await db.item.create({
      data: { ...b, sort: b.sort ?? (max._max.sort ?? 0) + 1, variants: variants?.length ? { create: variants.map((v, sort) => ({ ...v, sort })) } : undefined },
      include: { variants: true },
    });
    return ok(item, { status: 201 });
  } catch (e) {
    return handle(e);
  }
}
