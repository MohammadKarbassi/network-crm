"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionResult, formToObject, invalid } from "@/lib/action-result";
import { activitySchema, contactFields } from "@/lib/schemas";
import { ownedBy } from "@/server/auth/scope";
import { requireUser } from "@/server/auth/session";
import { fireTrigger } from "@/server/automations";
import { db } from "@/server/db";
import { resolveOwner } from "@/server/users";

const customerSchema = z.object(contactFields);

export async function saveCustomerAction(id: string | null, fd: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const parsed = customerSchema.safeParse(formToObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  const owner = await resolveOwner(me, data.ownerId);
  if (!owner) return { ok: false, error: "کارشناس انتخاب‌شده معتبر نیست." };

  if (id) {
    const existing = await db.customer.findFirst({ where: { id, ...ownedBy(me) }, select: { ownerId: true } });
    if (!existing) return { ok: false, error: "مشتری پیدا نشد." };
    await db.customer.update({ where: { id }, data: { ...data, ...owner } });
    if (existing.ownerId !== owner.ownerId) {
      await db.activity.create({ data: { type: "SYSTEM", body: "مسئول پیگیری تغییر کرد.", customerId: id, authorId: me.id } });
    }
  } else {
    const created = await db.customer.create({ data: { ...data, ...owner } });
    await db.activity.create({ data: { type: "SYSTEM", body: "مشتری ثبت شد.", customerId: created.id, authorId: me.id } });
    await fireTrigger("CUSTOMER_CREATED", { customerId: created.id });
    id = created.id;
  }
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { ok: true, id };
}

export async function deleteCustomerAction(id: string) {
  const me = await requireUser();
  const { count } = await db.customer.deleteMany({ where: { id, ...ownedBy(me) } });
  if (!count) return { ok: false, error: "مشتری پیدا نشد." } satisfies ActionResult;
  revalidatePath("/customers");
  redirect("/customers");
}


export async function addCustomerActivityAction(customerId: string, fd: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const parsed = activitySchema.safeParse(formToObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const customer = await db.customer.findFirst({ where: { id: customerId, ...ownedBy(me) }, select: { id: true } });
  if (!customer) return { ok: false, error: "مشتری پیدا نشد." };
  await db.activity.create({ data: { ...parsed.data, customerId, authorId: me.id } });
  revalidatePath(`/customers/${customerId}`);
  return { ok: true };
}
