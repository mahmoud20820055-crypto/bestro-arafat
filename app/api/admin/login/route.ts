import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { SESSION_COOKIE, signSession } from "@/lib/session";
import { fail, handle, ok } from "@/lib/http";

const Body = z.object({ username: z.string().min(1).max(60), password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    const a = await db.admin.findUnique({ where: { username: b.username.trim() } });
    if (!a || !(await bcrypt.compare(b.password, a.passwordHash))) {
      await new Promise((r) => setTimeout(r, 600));
      return fail("اسم المستخدم أو كلمة السر غلط", 401);
    }
    const res = ok({ ok: true });
    res.cookies.set(SESSION_COOKIE, await signSession({ id: a.id, username: a.username, name: a.name }), {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400,
    });
    return res;
  } catch (e) {
    return handle(e);
  }
}
