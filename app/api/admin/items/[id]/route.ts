import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/http";
import { ItemBody } from "@/lib/schemas";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  try {
    const id = Number((await params).id);
    const { variants, ...b } = ItemBody.partial().parse(await req.json());
    const item = await db.$transaction(async (tx) => {
      if (variants) {
        await tx.variant.deleteMany({ where: { itemId: id } });
        if (variants.length) await tx.variant.createMany({ data: variants.map((v, sort) => ({ ...v, sort, itemId: id })) });
      }
      return tx.item.update({ where: { id }, data: b, include: { variants: { orderBy: { sort: "asc" } } } });
    });
    return ok(item);
  } catch (e) {
    return handle(e);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  await db.item.delete({ where: { id: Number((await params).id) } });
  return ok({ ok: true });
}
