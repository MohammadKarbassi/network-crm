"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { DealStage } from "@/generated/prisma/enums";
import { type ActionResult, formToObject, invalid } from "@/lib/action-result";
import { dealStages, isoDay, tomanAmount } from "@/lib/schemas";
import { ownedBy } from "@/server/auth/scope";
import { requireUser } from "@/server/auth/session";
import { fireTrigger } from "@/server/automations";
import { db } from "@/server/db";
import { afterStageChange, isClosed } from "@/server/deals";
import { resolveOwner } from "@/server/users";

const dealSchema = z.object({
  title: z.string({ error: "عنوان الزامی است." }).trim().min(2, "عنوان حداقل ۲ حرف باشد."),
  customerId: z.string({ error: "مشتری را انتخاب کنید." }),
  amount: tomanAmount,
  stage: z.enum(dealStages).default("NEW"),
  ownerId: z.string().optional().transform((v) => (v === "none" ? undefined : v)),
  expectedCloseAt: isoDay,
});

function refresh(customerId: string) {
  revalidatePath("/deals");
  revalidatePath(`/customers/${customerId}`);
}

export async function saveDealAction(id: string | null, fd: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const parsed = dealSchema.safeParse(formToObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const { ownerId, ...data } = parsed.data;

  const customer = await db.customer.findFirst({ where: { id: data.customerId, ...ownedBy(me) }, select: { id: true, ownerId: true } });
  if (!customer) return { ok: false, error: "مشتری پیدا نشد.", fieldErrors: { customerId: ["مشتری را انتخاب کنید."] } };
  // A new deal defaults to the customer's rep when no one is picked.
  const owner = await resolveOwner(me, ownerId ?? (id ? undefined : customer.ownerId ?? undefined));
  if (!owner) return { ok: false, error: "کارشناس انتخاب‌شده معتبر نیست." };

  if (id) {
    const existing = await db.deal.findFirst({ where: { id, ...ownedBy(me) } });
    if (!existing) return { ok: false, error: "معامله پیدا نشد." };
    const stageChanged = existing.stage !== data.stage;
    await db.deal.update({
      where: { id },
      data: {
        ...data,
        ...owner,
        expectedCloseAt: data.expectedCloseAt ?? null,
        ...(stageChanged && { closedAt: isClosed(data.stage) ? new Date() : null }),
      },
    });
    if (stageChanged) await afterStageChange(me.id, existing, data.stage);
  } else {
    const last = await db.deal.aggregate({ where: { stage: data.stage }, _max: { position: true } });
    const deal = await db.deal.create({
      data: { ...data, ...owner, position: (last._max.position ?? -1) + 1, closedAt: isClosed(data.stage) ? new Date() : null },
    });
    await db.activity.create({
      data: { type: "SYSTEM", body: `معامله «${deal.title}» ثبت شد.`, dealId: deal.id, customerId: deal.customerId, authorId: me.id },
    });
    // A deal created directly in a stage counts as entering it (e.g. logged straight as WON).
    await fireTrigger("DEAL_STAGE_CHANGED", { dealId: deal.id, customerId: deal.customerId }, { stage: deal.stage });
    id = deal.id;
  }
  refresh(data.customerId);
  return { ok: true, id };
}

/**
 * Drag-and-drop on the board: puts the deal in `stage` and saves the column order the user sees.
 * `orderedIds` is the target column top to bottom, including the moved deal.
 */
export async function moveDealAction(id: string, stage: DealStage, orderedIds: string[]): Promise<ActionResult> {
  const me = await requireUser();
  if (!dealStages.includes(stage)) return { ok: false, error: "مرحله نامعتبر است." };
  const deal = await db.deal.findFirst({ where: { id, ...ownedBy(me) } });
  if (!deal) return { ok: false, error: "معامله پیدا نشد." };

  // Only reorder deals this user may see; ids from the client are not trusted.
  const visible = await db.deal.findMany({ where: { id: { in: orderedIds }, ...ownedBy(me) }, select: { id: true } });
  const allowed = new Set(visible.map((d) => d.id));
  const order = orderedIds.filter((d) => allowed.has(d));

  await db.$transaction([
    db.deal.update({
      where: { id },
      data: { stage, ...(deal.stage !== stage && { closedAt: isClosed(stage) ? new Date() : null }) },
    }),
    ...order.map((dealId, position) => db.deal.update({ where: { id: dealId }, data: { position } })),
  ]);
  if (deal.stage !== stage) await afterStageChange(me.id, deal, stage);
  refresh(deal.customerId);
  return { ok: true };
}

export async function deleteDealAction(id: string): Promise<ActionResult> {
  const me = await requireUser();
  const deal = await db.deal.findFirst({ where: { id, ...ownedBy(me) }, select: { customerId: true, title: true } });
  if (!deal) return { ok: false, error: "معامله پیدا نشد." };
  await db.$transaction([
    // Keep the customer's record of this deal; deal-only activities cascade away with it.
    db.activity.updateMany({ where: { dealId: id, customerId: { not: null } }, data: { dealId: null } }),
    db.deal.delete({ where: { id } }),
    db.activity.create({ data: { type: "SYSTEM", body: `معامله «${deal.title}» حذف شد.`, customerId: deal.customerId, authorId: me.id } }),
  ]);
  refresh(deal.customerId);
  return { ok: true };
}
