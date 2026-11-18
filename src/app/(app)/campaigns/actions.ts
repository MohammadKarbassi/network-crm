"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Channel } from "@/generated/prisma/enums";
import { type ActionResult, formToObject, invalid } from "@/lib/action-result";
import { type Audience, audienceSchema } from "@/lib/schemas";
import { requireUser } from "@/server/auth/session";
import { resolveAudience } from "@/server/campaigns";
import { db } from "@/server/db";
import { channelStatus } from "@/server/messaging";
import { enqueueCampaign } from "@/server/queue/messages";

const MANAGERS = ["ADMIN", "SALES_MANAGER"] as const;
const all = (v: unknown) => (v === "all" ? undefined : v);

/** Reads the audience fields of the campaign form ("all" = no filter). */
const audienceFrom = (o: Record<string, unknown>) =>
  audienceSchema.safeParse({ target: o.target, source: all(o.source), status: o.target === "leads" ? all(o.status) : undefined, ownerId: all(o.ownerId) });

/** Live recipient count for the form, so the manager sees the reach before sending. */
export async function previewAudienceAction(audience: Audience, channel: Channel) {
  await requireUser([...MANAGERS]);
  const parsed = audienceSchema.safeParse(audience);
  if (!parsed.success) return { count: 0, sample: [] as string[] };
  const recipients = await resolveAudience(parsed.data, channel);
  return { count: recipients.length, sample: recipients.slice(0, 3).map((r) => r.name) };
}

const campaignSchema = z
  .object({
    name: z.string({ error: "نام کمپین الزامی است." }).trim().min(2, "نام کمپین حداقل ۲ حرف باشد."),
    channel: z.enum(["SMS", "EMAIL"]),
    subject: z.string().trim().optional(),
    body: z.string({ error: "متن پیام خالی است." }).trim().min(1, "متن پیام خالی است.").max(1000, "متن پیام حداکثر ۱۰۰۰ حرف باشد."),
  })
  .refine((c) => c.channel === "SMS" || c.subject, { message: "موضوع ایمیل الزامی است.", path: ["subject"] });

export async function createCampaignAction(fd: FormData): Promise<ActionResult> {
  const me = await requireUser([...MANAGERS]);
  const raw = formToObject(fd);
  const parsed = campaignSchema.safeParse(raw);
  if (!parsed.success) return invalid(parsed.error);
  const audience = audienceFrom(raw);
  if (!audience.success) return { ok: false, error: "مخاطبان کمپین معتبر نیستند." };
  if (!channelStatus()[parsed.data.channel]) return { ok: false, error: "این کانال ارسال پیکربندی نشده است." };

  const count = (await resolveAudience(audience.data, parsed.data.channel)).length;
  if (!count) return { ok: false, error: "هیچ گیرنده‌ای با این فیلترها پیدا نشد." };

  const campaign = await db.campaign.create({
    data: { ...parsed.data, audience: audience.data, status: "QUEUED", createdById: me.id },
  });
  await enqueueCampaign(campaign.id);
  revalidatePath("/campaigns");
  return { ok: true, id: campaign.id };
}
