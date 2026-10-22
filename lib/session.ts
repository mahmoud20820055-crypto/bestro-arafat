import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ba_admin";
const key = () => {
  const secret = process.env.SESSION_SECRET || "";
  if (secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(secret);
};

export type Session = { id: number; username: string; name: string };

export async function signSession(s: Session) {
  return new SignJWT(s).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key());
}

export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return { id: payload.id as number, username: payload.username as string, name: payload.name as string };
  } catch {
    return null;
  }
}
