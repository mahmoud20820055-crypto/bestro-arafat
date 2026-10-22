import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/http";
import { CategoryBody } from "@/lib/schemas";


export async function GET() {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  const cats = await db.category.findMany({
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    include: { items: { orderBy: [{ sort: "asc" }, { id: "asc" }], include: { variants: { orderBy: { sort: "asc" } } } } },
  });
  return ok(cats);
}

export async function POST(req: Request) {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  try {
    const b = CategoryBody.parse(await req.json());
    const max = await db.category.aggregate({ _max: { sort: true } });
    return ok(await db.category.create({ data: { ...b, sort: b.sort ?? (max._max.sort ?? 0) + 1 } }), { status: 201 });
  } catch (e) {
    return handle(e);
  }
}
