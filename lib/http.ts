import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { OrderError } from "./pricing";

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** Turns thrown validation/business errors into readable Arabic responses. */
export function handle(e: unknown) {
  if (e instanceof OrderError) return fail(e.message);
  if (e instanceof ZodError) return fail(e.issues[0]?.message || "في معلومات ناقصة");
  console.error(e);
  return fail("صار خطأ، جرّب كمان مرة", 500);
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export async function readImage(file: FormDataEntryValue | null, maxMb = 5) {
  if (!file || typeof file === "string") return null;
  if (!IMAGE_TYPES.includes(file.type)) throw new OrderError("الملف لازم يكون صورة (JPG أو PNG أو WEBP)");
  if (file.size > maxMb * 1024 * 1024) throw new OrderError(`حجم الصورة أكبر من ${maxMb} ميغا`);
  return { mime: file.type, data: Buffer.from(await file.arrayBuffer()) };
}
