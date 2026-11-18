import "server-only";
import { Queue } from "bullmq";
import type { Channel } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { createQueueConnection } from "./connection";

export const MESSAGES_QUEUE = "messages";

export type MessageJob =
  | { kind: "otp"; phone: string; code: string }
  | { kind: "send"; messageId: string }
  | { kind: "campaign"; campaignId: string };

const globalForQueue = globalThis as unknown as { messagesQueue?: Queue<MessageJob> };
export const messagesQueue =
  globalForQueue.messagesQueue ?? new Queue<MessageJob>(MESSAGES_QUEUE, { connection: createQueueConnection() });
if (process.env.NODE_ENV !== "production") globalForQueue.messagesQueue = messagesQueue;

const retry = { attempts: 3, backoff: { type: "exponential", delay: 5_000 } } as const;

export async function enqueueOtp(phone: string, code: string) {
  // OTP job data contains the code, so remove it from Redis as soon as it finishes.
  await messagesQueue.add("otp", { kind: "otp", phone, code }, { ...retry, removeOnComplete: true, removeOnFail: true });
}

type NewMessage = {
  channel: Channel;
  to: string;
  subject?: string;
  body: string;
  customerId?: string;
  leadId?: string;
  campaignId?: string;
  automationRunId?: string;
};

const sendOpts = { ...retry, removeOnComplete: 1000, removeOnFail: 5000 };

/** Logs the message as QUEUED and hands it to the worker. */
export async function enqueueMessage(data: NewMessage) {
  const message = await db.message.create({ data });
  await messagesQueue.add("send", { kind: "send", messageId: message.id }, sendOpts);
  return message;
}

/** Bulk version for campaigns: one insert, one queue round-trip. */
export async function enqueueMessages(data: NewMessage[]) {
  if (!data.length) return;
  const messages = await db.message.createManyAndReturn({ data, select: { id: true } });
  await messagesQueue.addBulk(messages.map((m) => ({ name: "send", data: { kind: "send" as const, messageId: m.id }, opts: sendOpts })));
}

export async function enqueueCampaign(campaignId: string) {
  await messagesQueue.add("campaign", { kind: "campaign", campaignId }, { attempts: 1, removeOnComplete: 100, removeOnFail: 100 });
}
