import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, ok, readImage } from "@/lib/http";

/** Menu photo upload; returns the media id to attach to an item. */
export async function POST(req: Request) {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  try {
    const img = await readImage((await req.formData()).get("file"), 4);
    if (!img) return fail("اختار صورة");
    const m = await db.media.create({ data: img });
    return ok({ id: m.id });
  } catch (e) {
    return handle(e);
  }
}
