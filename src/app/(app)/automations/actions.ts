"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/action-result";
import { stepsSchema, triggerConfigSchema } from "@/lib/automation";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";

const MANAGERS = ["ADMIN", "SALES_MANAGER"] as const;

const automationSchema = z.object({
  name: z.string().trim().min(2, "نام اتوماسیون حداقل ۲ حرف باشد."),
  trigger: z.enum(["LEAD_CREATED", "LEAD_STATUS_CHANGED", "DEAL_STAGE_CHANGED", "CUSTOMER_CREATED"]),
  triggerConfig: triggerConfigSchema,
  steps: stepsSchema,
  isActive: z.boolean(),
});
export type AutomationInput = z.infer<typeof automationSchema>;

/** The builder posts its whole state as an object (steps are a list, not flat form fields). */
export async function saveAutomationAction(id: string | null, input: AutomationInput): Promise<ActionResult> {
  const me = await requireUser([...MANAGERS]);
  const parsed = automationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "اطلاعات اتوماسیون معتبر نیست." };
  // Keep only the config field that applies to the chosen trigger.
  const { triggerConfig, steps, ...rest } = parsed.data;
  const config =
    rest.trigger === "LEAD_STATUS_CHANGED" ? { status: triggerConfig.status } : rest.trigger === "DEAL_STAGE_CHANGED" ? { stage: triggerConfig.stage } : {};
  const data = { ...rest, triggerConfig: config, steps: steps as Prisma.InputJsonValue };

  const saved = id ? await db.automation.update({ where: { id }, data }) : await db.automation.create({ data: { ...data, createdById: me.id } });
  revalidatePath("/automations");
  revalidatePath(`/automations/${saved.id}`);
  return { ok: true, id: saved.id };
}

export async function toggleAutomationAction(id: string, isActive: boolean): Promise<ActionResult> {
  await requireUser([...MANAGERS]);
  await db.automation.update({ where: { id }, data: { isActive } });
  revalidatePath("/automations");
  return { ok: true };
}

export async function deleteAutomationAction(id: string): Promise<ActionResult> {
  await requireUser([...MANAGERS]);
  await db.automation.delete({ where: { id } });
  revalidatePath("/automations");
  return { ok: true };
}
