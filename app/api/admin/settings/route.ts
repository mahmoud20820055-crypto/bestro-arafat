import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/http";
import { getSettings } from "@/lib/menu";

const Body = z.object({
  isOpen: z.boolean(),
  deliveryFee: z.number().int().min(0).max(500),
  minOrder: z.number().int().min(0).max(5000),
  prepMinutes: z.number().int().min(5).max(240),
  walletInfo: z.string().max(1000),
  phones: z.string().max(120),
  whatsapp: z.string().max(20),
  address: z.string().max(200),
  hours: z.string().max(200),
  instagram: z.string().max(200),
  announcement: z.string().max(200),
}).partial();

export async function GET() {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  return ok(await getSettings());
}

export async function PUT(req: Request) {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  try {
    const b = Body.parse(await req.json());
    return ok(await db.setting.upsert({ where: { id: 1 }, update: b, create: { id: 1, ...b } }));
  } catch (e) {
    return handle(e);
  }
}
