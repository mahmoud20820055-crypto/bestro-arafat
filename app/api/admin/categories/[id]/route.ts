import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/http";
import { CategoryBody } from "@/lib/schemas";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  try {
    const b = CategoryBody.partial().parse(await req.json());
    return ok(await db.category.update({ where: { id: Number((await params).id) }, data: b }));
  } catch (e) {
    return handle(e);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  await db.category.delete({ where: { id: Number((await params).id) } });
  return ok({ ok: true });
}
