"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { LeadStatus } from "@/generated/prisma/enums";
import { type ActionResult, formToObject, invalid } from "@/lib/action-result";
import { leadStatusLabel } from "@/lib/labels";
import { activitySchema, contactFields } from "@/lib/schemas";
import { ownedBy } from "@/server/auth/scope";
import { requireUser } from "@/server/auth/session";
import { fireTrigger } from "@/server/automations";
import { db } from "@/server/db";
import { resolveOwner } from "@/server/users";

// CONVERTED is only set by convertLeadAction, never picked by hand.
const editableStatus = z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED"]);

const leadSchema = z.object({
  ...contactFields,
  status: editableStatus.default("NEW"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

const findOwnLead = (me: Awaited<ReturnType<typeof requireUser>>, id: string) =>
  db.lead.findFirst({ where: { id, ...ownedBy(me) } });

export async function saveLeadAction(id: string | null, fd: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const parsed = leadSchema.safeParse(formToObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const owner = await resolveOwner(me, parsed.data.ownerId);
  if (!owner) return { ok: false, error: "کارشناس انتخاب‌شده معتبر نیست." };
  const data = { ...parsed.data, ...owner };

  if (id) {
    const existing = await findOwnLead(me, id);
    if (!existing) return { ok: false, error: "لید پیدا نشد." };
    if (existing.status === "CONVERTED") return { ok: false, error: "این لید به مشتری تبدیل شده و قابل ویرایش نیست." };
    await db.lead.update({ where: { id }, data });
    const events = [
      existing.status !== data.status && `وضعیت از «${leadStatusLabel[existing.status]}» به «${leadStatusLabel[data.status]}» تغییر کرد.`,
      existing.ownerId !== data.ownerId && "مسئول پیگیری تغییر کرد.",
    ].filter((e): e is string => Boolean(e));
    if (events.length) {
      await db.activity.createMany({ data: events.map((body) => ({ type: "STATUS_CHANGE" as const, body, leadId: id, authorId: me.id })) });
    }
    if (existing.status !== data.status) await fireTrigger("LEAD_STATUS_CHANGED", { leadId: id }, { status: data.status });
  } else {
    const lead = await db.lead.create({ data });
    await db.activity.create({ data: { type: "SYSTEM", body: "لید ثبت شد.", leadId: lead.id, authorId: me.id } });
    await fireTrigger("LEAD_CREATED", { leadId: lead.id });
    id = lead.id;
  }
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { ok: true, id };
}

export async function setLeadStatusAction(id: string, status: LeadStatus): Promise<ActionResult> {
  const me = await requireUser();
  const parsed = editableStatus.safeParse(status);
  if (!parsed.success) return { ok: false, error: "وضعیت نامعتبر است." };
  const lead = await findOwnLead(me, id);
  if (!lead) return { ok: false, error: "لید پیدا نشد." };
  if (lead.status === "CONVERTED") return { ok: false, error: "این لید به مشتری تبدیل شده است." };
  if (lead.status === parsed.data) return { ok: true };

  await db.$transaction([
    db.lead.update({ where: { id }, data: { status: parsed.data } }),
    db.activity.create({
      data: {
        type: "STATUS_CHANGE",
        body: `وضعیت از «${leadStatusLabel[lead.status]}» به «${leadStatusLabel[parsed.data]}» تغییر کرد.`,
        leadId: id,
        authorId: me.id,
      },
    }),
  ]);
  await fireTrigger("LEAD_STATUS_CHANGED", { leadId: id }, { status: parsed.data });
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { ok: true };
}

/** Creates a customer from the lead and carries the lead's history over to it. */
export async function convertLeadAction(id: string): Promise<ActionResult> {
  const me = await requireUser();
  const lead = await findOwnLead(me, id);
  if (!lead) return { ok: false, error: "لید پیدا نشد." };
  if (lead.customerId) redirect(`/customers/${lead.customerId}`);

  const customer = await db.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        company: lead.company,
        source: lead.source,
        notes: lead.notes,
        ownerId: lead.ownerId,
      },
    });
    await tx.lead.update({ where: { id }, data: { status: "CONVERTED", customerId: customer.id } });
    // Link existing lead activities to the customer too, so its timeline starts with the full history.
    await tx.activity.updateMany({ where: { leadId: id }, data: { customerId: customer.id } });
    await tx.activity.create({
      data: { type: "STATUS_CHANGE", body: "لید به مشتری تبدیل شد.", leadId: id, customerId: customer.id, authorId: me.id },
    });
    return customer;
  });
  await fireTrigger("CUSTOMER_CREATED", { customerId: customer.id });
  revalidatePath("/leads");
  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}

export async function deleteLeadAction(id: string) {
  const me = await requireUser();
  const lead = await findOwnLead(me, id);
  if (!lead) return { ok: false, error: "لید پیدا نشد." } satisfies ActionResult;
  await db.$transaction([
    // Activities shared with a converted customer would cascade-delete with the lead; detach them first.
    db.activity.updateMany({ where: { leadId: id, customerId: { not: null } }, data: { leadId: null } }),
    db.lead.delete({ where: { id } }),
  ]);
  revalidatePath("/leads");
  redirect("/leads");
}

export async function addLeadActivityAction(leadId: string, fd: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const parsed = activitySchema.safeParse(formToObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const lead = await findOwnLead(me, leadId);
  if (!lead) return { ok: false, error: "لید پیدا نشد." };
  await db.activity.create({ data: { ...parsed.data, leadId, customerId: lead.customerId, authorId: me.id } });
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}
