import type { z } from "zod";

// Uniform return shape for server actions so forms can show a toast or per-field errors.
export type ActionResult = { ok: true; id?: string } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export const invalid = (error: z.ZodError): ActionResult => ({
  ok: false,
  error: "لطفاً خطاهای فرم را برطرف کنید.",
  fieldErrors: error.flatten().fieldErrors as Record<string, string[] | undefined>,
});

/** Turns "" from empty form inputs into undefined, so optional fields stay optional. */
export const formToObject = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? undefined : v]));
