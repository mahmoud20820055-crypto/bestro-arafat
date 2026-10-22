import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "./session";

export async function getAdmin() {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Returns a 401 response when the caller isn't a signed-in admin. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) return { admin: null, deny: NextResponse.json({ error: "سجّل دخول أول" }, { status: 401 }) };
  return { admin, deny: null };
}
