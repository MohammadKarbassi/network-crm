import "server-only";
import type { DealStage } from "@/generated/prisma/enums";
import { dealStageLabel } from "@/lib/labels";
import { fireTrigger } from "@/server/automations";
import { db } from "@/server/db";

export const isClosed = (stage: DealStage) => stage === "WON" || stage === "LOST";

/** After a deal's stage is saved: timeline entry on deal + customer, then automations. One path for form, board and AI. */
export async function afterStageChange(authorId: string, deal: { id: string; title: string; stage: DealStage; customerId: string }, to: DealStage) {
  await db.activity.create({
    data: {
      type: "STATUS_CHANGE",
      body: `معامله «${deal.title}» از «${dealStageLabel[deal.stage]}» به «${dealStageLabel[to]}» رفت.`,
      dealId: deal.id,
      customerId: deal.customerId,
      authorId,
    },
  });
  await fireTrigger("DEAL_STAGE_CHANGED", { dealId: deal.id, customerId: deal.customerId }, { stage: to });
}
