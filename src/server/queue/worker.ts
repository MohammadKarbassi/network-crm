import "server-only";
import { UnrecoverableError, Worker, type Job } from "bullmq";
import { audienceSchema } from "@/lib/schemas";
import { fillTemplate } from "@/lib/template";
import { resolveAudience } from "@/server/campaigns";
import { db } from "@/server/db";
import { sendEmail } from "@/server/email";
import { isAllowedRecipient } from "@/server/messaging";
import { KavenegarError, sendLookup, sendSms } from "@/server/sms/kavenegar";
import { startAutomationWorker } from "./automations";
import { createQueueConnection } from "./connection";
import { MESSAGES_QUEUE, enqueueMessages, type MessageJob } from "./messages";

// Kavenegar 409 (server busy) and 451 (rate limit) are worth retrying; other 4xx (bad number, no credit…) are not.
const permanent = (e: unknown) => (e instanceof KavenegarError && ![409, 451].includes(e.status) ? new UnrecoverableError(e.message) : e);

async function sendOne(messageId: string) {
  const message = await db.message.findUnique({ where: { id: messageId } });
  if (!message || message.status === "SENT") return;
  if (!isAllowedRecipient(message.to)) throw new UnrecoverableError("حالت آزمایشی: گیرنده در MESSAGING_ALLOWLIST نیست.");

  let providerRef: string;
  try {
    if (message.channel === "SMS") {
      const [entry] = await sendSms([message.to], message.body);
      providerRef = String(entry?.messageid ?? "");
    } else {
      providerRef = await sendEmail(message.to, message.subject ?? "", message.body);
    }
  } catch (e) {
    throw permanent(e);
  }
  await db.message.update({ where: { id: message.id }, data: { status: "SENT", sentAt: new Date(), providerRef, error: null } });
  if (message.customerId || message.leadId) {
    await db.activity.create({
      data: {
        type: message.channel,
        body: message.channel === "SMS" ? message.body : `${message.subject}\n\n${message.body}`,
        customerId: message.customerId,
        leadId: message.leadId,
      },
    });
  }
}

/** Expands a campaign into one queued message per recipient. */
async function fanOutCampaign(campaignId: string) {
  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.status !== "QUEUED") return;
  await db.campaign.update({ where: { id: campaignId }, data: { status: "SENDING", startedAt: new Date() } });
  const recipients = await resolveAudience(audienceSchema.parse(campaign.audience), campaign.channel);
  await enqueueMessages(
    recipients.map((r) => ({
      channel: campaign.channel,
      to: r.to,
      subject: campaign.subject ? fillTemplate(campaign.subject, r) : undefined,
      body: fillTemplate(campaign.body, r),
      customerId: r.customerId,
      leadId: r.leadId,
      campaignId,
    })),
  );
  await db.campaign.update({ where: { id: campaignId }, data: { status: "DONE" } });
}

async function processJob(job: Job<MessageJob>) {
  const data = job.data;
  if (data.kind === "otp") {
    const template = process.env.KAVENEGAR_OTP_TEMPLATE;
    if (!template) throw new UnrecoverableError("KAVENEGAR_OTP_TEMPLATE is not set");
    await sendLookup(data.phone, template, data.code).catch((e) => Promise.reject(permanent(e)));
  } else if (data.kind === "send") {
    await sendOne(data.messageId);
  } else {
    await fanOutCampaign(data.campaignId);
  }
}

export function startWorkers() {
  const worker = new Worker<MessageJob>(MESSAGES_QUEUE, processJob, {
    connection: createQueueConnection(),
    concurrency: 5,
    limiter: { max: 10, duration: 1_000 }, // stay under provider rate limits
  });

  worker.on("failed", async (job, err) => {
    console.error(`[queue] ${job?.name} failed (attempt ${job?.attemptsMade}):`, err.message);
    if (job?.data.kind !== "send") return;
    // Mark FAILED once there is no retry left: a permanent error, or attempts used up.
    const final = err instanceof UnrecoverableError || err.name === "UnrecoverableError" || job.attemptsMade >= (job.opts.attempts ?? 1);
    if (!final) return;
    const m = await db.message.update({ where: { id: job.data.messageId }, data: { status: "FAILED", error: err.message } });
    // Campaign failures show on the campaign page; one-off sends report on the record's timeline.
    if (!m.campaignId && (m.customerId || m.leadId)) {
      await db.activity.create({
        data: { type: "SYSTEM", body: `ارسال ${m.channel === "SMS" ? "پیامک" : "ایمیل"} به ${m.to} ناموفق بود: ${err.message}`, customerId: m.customerId, leadId: m.leadId },
      });
    }
  });

  console.log("[queue] workers started");
  return [worker, startAutomationWorker()];
}
