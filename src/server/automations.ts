import "server-only";
import type { AutomationTrigger } from "@/generated/prisma/enums";
import { matchesTrigger, triggerConfigSchema } from "@/lib/automation";
import { db } from "@/server/db";
import { type RunContext, enqueueAutomationRun } from "@/server/queue/automations";

/**
 * Starts every active automation listening for this event. Called from server actions after the change is saved.
 * Failures are logged, never thrown: a broken automation must not block saving a lead or deal.
 */
export async function fireTrigger(trigger: AutomationTrigger, context: RunContext, event: { status?: string; stage?: string } = {}) {
  try {
    const automations = await db.automation.findMany({ where: { trigger, isActive: true }, select: { id: true, triggerConfig: true } });
    const matching = automations.filter((a) => matchesTrigger(triggerConfigSchema.parse(a.triggerConfig), event));
    await Promise.all(matching.map((a) => enqueueAutomationRun(a.id, context)));
  } catch (e) {
    console.error(`[automations] could not fire ${trigger}:`, e);
  }
}
