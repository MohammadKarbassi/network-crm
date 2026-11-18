"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { type ActionResult, formToObject, invalid } from "@/lib/action-result";
import { normalizeIranMobile } from "@/lib/phone";
import { isAdmin } from "@/lib/permissions";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";

const userSchema = z.object({
  name: z.string({ error: "نام الزامی است." }).trim().min(2, "نام حداقل ۲ حرف باشد."),
  phone: z
    .string({ error: "شماره موبایل الزامی است." })
    .transform((v, ctx) => normalizeIranMobile(v) ?? (ctx.addIssue({ code: "custom", message: "شماره موبایل معتبر نیست." }), z.NEVER)),
  email: z.email("ایمیل معتبر نیست.").optional(),
  role: z.enum(["ADMIN", "SALES_MANAGER", "SALES_REP"]),
  isActive: z.coerce.boolean().default(false),
});

export async function saveUserAction(id: string | null, fd: FormData): Promise<ActionResult> {
  const me = await requireUser(["ADMIN", "SALES_MANAGER"]);
  const parsed = userSchema.safeParse({ ...formToObject(fd), isActive: fd.get("isActive") === "on" });
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  // A sales manager may only create and edit sales reps.
  if (!isAdmin(me.role)) {
    if (data.role !== "SALES_REP") return { ok: false, error: "مدیر فروش فقط می‌تواند کارشناس فروش تعریف کند." };
    if (id) {
      const target = await db.user.findUnique({ where: { id }, select: { role: true } });
      if (target?.role !== "SALES_REP") return { ok: false, error: "دسترسی به ویرایش این کاربر ندارید." };
    }
  }
  if (id === me.id && (!data.isActive || data.role !== me.role)) {
    return { ok: false, error: "نمی‌توانید نقش یا وضعیت حساب خودتان را تغییر دهید." };
  }

  try {
    const user = id ? await db.user.update({ where: { id }, data }) : await db.user.create({ data });
    revalidatePath("/team");
    return { ok: true, id: user.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "این شماره قبلاً ثبت شده است.", fieldErrors: { phone: ["این شماره قبلاً ثبت شده است."] } };
    }
    throw e;
  }
}
