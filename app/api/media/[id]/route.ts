import { db } from "@/lib/db";
import { getAdmin } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await db.media.findUnique({ where: { id } });
  if (!m) return new Response("Not found", { status: 404 });
  if (m.isPrivate && !(await getAdmin())) return new Response("Forbidden", { status: 403 });
  return new Response(new Uint8Array(m.data), {
    headers: {
      "Content-Type": m.mime,
      "Cache-Control": m.isPrivate ? "private, no-store" : "public, max-age=31536000, immutable",
    },
  });
}
