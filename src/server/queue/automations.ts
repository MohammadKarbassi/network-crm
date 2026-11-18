import "server-only";
import { Queue, Worker, type Job } from "bullmq";
import type { Prisma } from "@/generated/prisma/client";
import { type Step, stepsSchema } from "@/lib/automation";
import { fillTemplate } from "@/lib/template";
import { db } from "@/server/db";
import { createQueueConnection } from "./connection";
import { enqueueMessage } from "./messages";

export const AUTOMATIONS_QUEUE = "automations";

export type RunContext = { leadId?: string; customerId?: string; dealId?: string };
type AutomationJob = { kind: "start"; automationId: string; context: RunContext } | { kind: "step"; runId: string };
type LogEntry = { at: string; step: number; type: Step["type"] | "STOP"; note: string };

const globalForQueue = globalThis as unknown as { automationsQueue?: Queue<AutomationJob> };
export const automationsQueue =
  globalForQueue.automationsQueue ?? new Queue<AutomationJob>(AUTOMATIONS_QUEUE, { connection: createQueueConnection() });
if (process.env.NODE_ENV !== "production") globalForQueue.automationsQueue = automationsQueue;

const jobOpts = { attempts: 3, backoff: { type: "exponential", delay: 10_000 }, removeOnComplete: 500, removeOnFail: 1000 } as const;

export const enqueueAutomationRun = (automationId: string, context: RunContext) =>
  automationsQueue.add("start", { kind: "start", automationId, context }, jobOpts);

const nextStep = (runId: string, delayMs = 0) => automationsQueue.add("step", { kind: "step", runId }, { ...jobOpts, delay: delayMs });

/** The person a run talks to: the lead, else the customer (a deal's customer). */
async function subject(ctx: RunContext) {
  if (ctx.leadId) {
    const l = await db.lead.findUnique({ where: { id: ctx.leadId }, select: { name: true, company: true, phone: true, email: true, ownerId: true } });
    return l && { ...l, link: { leadId: ctx.leadId } };
  }
  const customerId = ctx.customerId ?? (ctx.dealId && (await db.deal.findUnique({ where: { id: ctx.dealId }, select: { customerId: true } }))?.customerId);
  if (!customerId) return null;
  const c = await db.customer.findUnique({ where: { id: customerId }, select: { name: true, company: true, phone: true, email: true, ownerId: true } });
  return c && { ...c, link: { customerId } };
}

async function start(automationId: string, context: RunContext) {
  const automation = await db.automation.findUnique({ where: { id: automationId } });
  if (!automation?.isActive) return;
  // Snapshot the steps so editing the automation does not shift a run that is already waiting.
  const steps = stepsSchema.parse(automation.steps);
  const run = await db.automationRun.create({ data: { automationId, context: { ...context, steps } as Prisma.InputJsonValue } });
  await nextStep(run.id);
}

async function runStep(runId: string) {
  const run = await db.automationRun.findUnique({ where: { id: runId }, include: { automation: { select: { isActive: true, createdById: true } } } });
  if (!run || run.status !== "RUNNING") return;
  const { steps, ...ctx } = run.context as RunContext & { steps: Step[] };
  const log = run.log as LogEntry[];
  const append = (type: LogEntry["type"], note: string) => log.push({ at: new Date().toISOString(), step: run.stepIndex, type, note });

  const finish = (status: "COMPLETED" | "FAILED", error?: string) =>
    db.automationRun.update({ where: { id: runId }, data: { status, error, finishedAt: new Date(), log: log as Prisma.InputJsonValue } });

  if (!run.automation.isActive) {
    append("STOP", "اتوماسیون غیرفعال شد؛ اجرا متوقف شد.");
    return finish("FAILED", "اتوماسیون غیرفعال شد.");
  }
  const step = steps[run.stepIndex];
  if (!step) return finish("COMPLETED");

  const who = await subject(ctx);
  if (!who) {
    append("STOP", "رکورد مرتبط حذف شده است.");
    return finish("FAILED", "رکورد مرتبط پیدا نشد.");
  }

  let delay = 0;
  switch (step.type) {
    case "SEND_SMS":
    case "SEND_EMAIL": {
      const channel = step.type === "SEND_SMS" ? "SMS" : "EMAIL";
      const to = channel === "SMS" ? who.phone : who.email;
      if (!to) {
        append(step.type, channel === "SMS" ? "شماره ثبت نشده؛ رد شد." : "ایمیل ثبت نشده؛ رد شد.");
        break;
      }
      const vars = { name: who.name, company: who.company };
      await enqueueMessage({
        channel,
        to,
        subject: step.type === "SEND_EMAIL" ? fillTemplate(step.subject, vars) : undefined,
        body: fillTemplate(step.body, vars),
        automationRunId: runId,
        ...who.link,
      });
      append(step.type, `در صف ارسال به ${to}`);
      break;
    }
    case "CREATE_TASK": {
      const assigneeId = who.ownerId ?? run.automation.createdById;
      if (!assigneeId) {
        append(step.type, "کارشناسی برای تسک پیدا نشد؛ رد شد.");
        break;
      }
      await db.task.create({ data: { title: step.title, dueAt: new Date(Date.now() + step.dueInHours * 3_600_000), assigneeId, ...who.link } });
      append(step.type, `تسک «${step.title}» ساخته شد.`);
      break;
    }
    case "WAIT":
      delay = step.minutes * 60_000;
      append(step.type, `انتظار تا ${new Date(Date.now() + delay).toLocaleString("fa-IR")}`);
      break;
  }

  const stepIndex = run.stepIndex + 1;
  const done = stepIndex >= steps.length;
  await db.automationRun.update({
    where: { id: runId },
    data: { stepIndex, log: log as Prisma.InputJsonValue, ...(done && { status: "COMPLETED", finishedAt: new Date() }) },
  });
  if (!done) await nextStep(runId, delay);
}

export function startAutomationWorker() {
  const worker = new Worker<AutomationJob>(
    AUTOMATIONS_QUEUE,
    (job: Job<AutomationJob>) => (job.data.kind === "start" ? start(job.data.automationId, job.data.context) : runStep(job.data.runId)),
    { connection: createQueueConnection(), concurrency: 5 },
  );
  worker.on("failed", async (job, err) => {
    console.error(`[automations] ${job?.name} failed (attempt ${job?.attemptsMade}):`, err.message);
    if (job?.data.kind === "step" && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await db.automationRun.update({ where: { id: job.data.runId }, data: { status: "FAILED", error: err.message, finishedAt: new Date() } });
    }
  });
  return worker;
}
