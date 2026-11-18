"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, formToObject, invalid } from "@/lib/action-result";
import { ownedBy } from "@/server/auth/scope";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { channelStatus } from "@/server/messaging";
import { enqueueMessage } from "@/server/queue/messages";

const messageSchema = z
  .object({
    channel: z.enum(["SMS", "EMAIL"]),
    subject: z.string().trim().optional(),
    body: z.string({ error: "متن پیام خالی است." }).trim().min(1, "متن پیام خالی است.").max(1000, "متن پیام حداکثر ۱۰۰۰ حرف باشد."),
  })
  .refine((m) => m.channel === "SMS" || m.subject, { message: "موضوع ایمیل الزامی است.", path: ["subject"] });

/** Sends one SMS/email to a customer or lead through the queue. */
export async function sendMessageAction(target: { customerId?: string; leadId?: string }, fd: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const parsed = messageSchema.safeParse(formToObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const { channel, subject, body } = parsed.data;
  if (!channelStatus()[channel]) return { ok: false, error: channel === "SMS" ? "سرویس پیامک پیکربندی نشده است." : "سرویس ایمیل پیکربندی نشده است." };

  const where = { ...ownedBy(me) };
  const record = target.customerId
    ? await db.customer.findFirst({ where: { id: target.customerId, ...where }, select: { phone: true, email: true } })
    : await db.lead.findFirst({ where: { id: target.leadId, ...where }, select: { phone: true, email: true } });
  if (!record) return { ok: false, error: "رکورد پیدا نشد." };
  const to = channel === "SMS" ? record.phone : record.email;
  if (!to) return { ok: false, error: channel === "SMS" ? "شماره تلفن ثبت نشده است." : "ایمیل ثبت نشده است." };

  await enqueueMessage({ channel, to, subject, body, ...target });
  revalidatePath(target.customerId ? `/customers/${target.customerId}` : `/leads/${target.leadId}`);
  return { ok: true };
}
