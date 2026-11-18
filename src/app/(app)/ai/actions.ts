"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { activityTypeLabel, dealStageLabel, formatDate, leadStatusLabel, priorityLabel, sourceLabel } from "@/lib/labels";
import { bandLabel, scoreLead } from "@/lib/lead-score";
import { dealStages } from "@/lib/schemas";
import { AiError, generateJson } from "@/server/ai";
import { ownedBy } from "@/server/auth/scope";
import { type CurrentUser, requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { afterStageChange, isClosed } from "@/server/deals";
import { setLeadStatusAction } from "../leads/actions";

export type Target = { customerId?: string; leadId?: string };
type AiResult<T> = { ok: true; data: T } | { ok: false; error: string };

const SYSTEM = "تو دستیار فروش یک نرم‌افزار CRM ایرانی هستی. بر اساس داده‌های واقعی همین رکورد جواب بده و چیزی از خودت نساز. مبالغ به تومان است.";

const fail = (e: unknown): { ok: false; error: string } => {
  if (e instanceof AiError) return { ok: false, error: e.message };
  console.error("[ai]", e);
  return { ok: false, error: "خطای غیرمنتظره در هوش مصنوعی." };
};

/** Everything the model may read about one customer or lead, as plain Persian text. Access-checked. */
async function loadContext(me: CurrentUser, t: Target) {
  const activities = { orderBy: { createdAt: "desc" as const }, take: 30, include: { author: { select: { name: true } } } };
  const tasks = { where: { doneAt: null }, orderBy: { dueAt: "asc" as const } };
  if (t.leadId) {
    const lead = await db.lead.findFirst({ where: { id: t.leadId, ...ownedBy(me) }, include: { activities, tasks } });
    if (!lead) return null;
    const human = lead.activities.filter((a) => a.type !== "SYSTEM" && a.type !== "STATUS_CHANGE");
    const score = scoreLead({ ...lead, interactions: human.length, lastInteractionAt: human[0]?.createdAt ?? null });
    const text = [
      today(),
      `نوع: لید (مشتری بالقوه)`,
      `نام: ${lead.name}${lead.company ? ` از ${lead.company}` : ""}`,
      `منبع: ${sourceLabel[lead.source]} · وضعیت: ${leadStatusLabel[lead.status]} · اولویت: ${priorityLabel[lead.priority]} · ثبت: ${formatDate(lead.createdAt)}`,
      `امتیاز قاعده‌محور: ${score.score} از ۱۰۰ (${bandLabel[score.band]}) — ${score.parts.map(([k, v]) => `${k}: ${v}`).join("، ")}`,
      lead.notes && `توضیحات: ${lead.notes}`,
      section("تسک‌های باز", lead.tasks.map((x) => `${x.title} (موعد ${formatDate(x.dueAt)})`)),
      section("تاریخچه (جدیدترین اول)", lead.activities.map((a) => `[${formatDate(a.createdAt)} · ${activityTypeLabel[a.type]}] ${a.body}`)),
    ];
    return { kind: "lead" as const, name: lead.name, ownerId: lead.ownerId, score, text: text.filter(Boolean).join("\n") };
  }
  const customer = await db.customer.findFirst({
    where: { id: t.customerId, ...ownedBy(me) },
    include: { activities, tasks, deals: { orderBy: { updatedAt: "desc" } } },
  });
  if (!customer) return null;
  const text = [
    today(),
    `نوع: مشتری`,
    `نام: ${customer.name}${customer.company ? ` از ${customer.company}` : ""}`,
    `منبع: ${sourceLabel[customer.source]} · مشتری از ${formatDate(customer.createdAt)}`,
    customer.notes && `توضیحات: ${customer.notes}`,
    section("معامله‌ها", customer.deals.map((d) => `«${d.title}» · ${dealStageLabel[d.stage]} · ${Number(d.amount).toLocaleString("fa-IR")} تومان`)),
    section("تسک‌های باز", customer.tasks.map((x) => `${x.title} (موعد ${formatDate(x.dueAt)})`)),
    section("تاریخچه (جدیدترین اول)", customer.activities.map((a) => `[${formatDate(a.createdAt)} · ${activityTypeLabel[a.type]}] ${a.body}`)),
  ];
  return {
    kind: "customer" as const,
    name: customer.name,
    ownerId: customer.ownerId,
    score: null,
    hasOpenDeal: customer.deals.some((d) => !isClosed(d.stage)),
    text: text.filter(Boolean).join("\n"),
  };
}

// The model has no clock; relative dates in notes ("تا پنجشنبه") need today's Jalali date and weekday.
// Models are poor at weekday arithmetic, so spell out the next 8 days with their offsets.
const today = () => {
  const day = (offset: number) =>
    new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(Date.now() + offset * 86_400_000));
  const week = Array.from({ length: 8 }, (_, i) => `${day(i)} = ${i} روز بعد`).join("، ");
  return `امروز: ${day(0)}. روزهای پیش رو برای محاسبهٔ dueInDays: ${week}`;
};

const section = (title: string, lines: string[]) => `${title}:\n${lines.length ? lines.map((l) => `- ${l}`).join("\n") : "- (هیچ)"}`;

// ---------- 1. Summary & next step ----------

const summarySchema = z.object({
  summary: z.string().describe("خلاصهٔ ۲ تا ۴ جمله‌ای از رابطه با این شخص تا امروز"),
  risks: z.array(z.string()).describe("حداکثر ۳ ریسک یا نکتهٔ هشدار؛ اگر نیست آرایهٔ خالی"),
  nextStep: z.string().describe("یک اقدام مشخص و عملی بعدی برای کارشناس"),
});
export type AiSummary = z.infer<typeof summarySchema> & { score: { value: number; band: keyof typeof bandLabel } | null };

export async function summarizeAction(t: Target): Promise<AiResult<AiSummary>> {
  const me = await requireUser();
  try {
    const ctx = await loadContext(me, t);
    if (!ctx) return { ok: false, error: "رکورد پیدا نشد." };
    const data = await generateJson(
      summarySchema,
      `${SYSTEM} قبل از تماس بعدی، به کارشناس یک جمع‌بندی کوتاه بده.${ctx.kind === "lead" ? " امتیاز قاعده‌محور لید را در نظر بگیر و توضیح بده چرا گرم یا سرد است." : ""}`,
      ctx.text,
    );
    return { ok: true, data: { ...data, score: ctx.score && { value: ctx.score.score, band: ctx.score.band } } };
  } catch (e) {
    return fail(e);
  }
}

// ---------- 2. Smart note ----------

const noteSchema = z.object({
  summary: z.string().describe("خلاصهٔ یک‌خطی و مرتب‌شدهٔ یادداشت"),
  task: z.object({ title: z.string(), dueInDays: z.number().int().min(0).max(90) }).nullable().describe("اگر یادداشت به کار بعدی اشاره دارد"),
  deal: z
    .object({
      action: z.enum(["update", "create"]).describe("update = معامله باز فعلی، create = معاملهٔ جدید"),
      title: z.string(),
      stage: z.enum(dealStages),
      amount: z.number().int().nullable().describe("مبلغ به تومان اگر در یادداشت آمده"),
    })
    .nullable()
    .describe("فقط برای مشتری؛ برای لید null"),
  leadStatus: z.enum(["CONTACTED", "QUALIFIED", "UNQUALIFIED"]).nullable().describe("فقط برای لید؛ برای مشتری null"),
  leadPriority: z.enum(["LOW", "MEDIUM", "HIGH"]).nullable().describe("فقط برای لید؛ برای مشتری null"),
});
export type NoteSuggestion = z.infer<typeof noteSchema>;

export async function analyzeNoteAction(t: Target, note: string): Promise<AiResult<NoteSuggestion>> {
  const me = await requireUser();
  if (note.trim().length < 5) return { ok: false, error: "یادداشت برای تحلیل خیلی کوتاه است." };
  try {
    const ctx = await loadContext(me, t);
    if (!ctx) return { ok: false, error: "رکورد پیدا نشد." };
    const data = await generateJson(
      noteSchema,
      `${SYSTEM} کارشناس بعد از تماس یک یادداشت آزاد نوشته. از آن تغییرات پیشنهادی CRM را دربیاور. فقط چیزی پیشنهاد بده که در یادداشت آمده؛ بقیه null. روزهای موعد را نسبت به تاریخ امروز حساب کن. مراحل معامله: NEW جدید، CONTACTED تماس اولیه، PROPOSAL ارسال پیشنهاد/پیش‌فاکتور، NEGOTIATION مذاکره، WON موفق، LOST ناموفق.`,
      `${ctx.text}\n\nیادداشت جدید کارشناس:\n«${note.trim()}»`,
    );
    // Keep only what applies to this kind of record, and only "update" a deal that really exists.
    if (ctx.kind === "lead") return { ok: true, data: { ...data, deal: null } };
    const deal = data.deal && !ctx.hasOpenDeal ? { ...data.deal, action: "create" as const } : data.deal;
    return { ok: true, data: { ...data, deal, leadStatus: null, leadPriority: null } };
  } catch (e) {
    return fail(e);
  }
}

/** Saves the note, then applies only the suggestions the user ticked. The model never writes directly. */
export async function applyNoteAction(t: Target, note: string, picked: NoteSuggestion): Promise<{ ok: true; applied: string[] } | { ok: false; error: string }> {
  const me = await requireUser();
  const parsed = noteSchema.safeParse(picked);
  if (!parsed.success || !note.trim()) return { ok: false, error: "اطلاعات ارسالی معتبر نیست." };
  const s = parsed.data;
  const ctx = await loadContext(me, t);
  if (!ctx) return { ok: false, error: "رکورد پیدا نشد." };
  const link = t.leadId ? { leadId: t.leadId } : { customerId: t.customerId! };
  const applied: string[] = ["یادداشت"];

  await db.activity.create({ data: { type: "NOTE", body: note.trim(), authorId: me.id, ...link } });

  if (s.task) {
    await db.task.create({
      data: { title: s.task.title, dueAt: new Date(Date.now() + s.task.dueInDays * 86_400_000), assigneeId: ctx.ownerId ?? me.id, createdById: me.id, ...link },
    });
    applied.push("تسک");
  }

  if (s.deal && t.customerId) {
    const open = s.deal.action === "update" ? await db.deal.findFirst({ where: { customerId: t.customerId, stage: { notIn: ["WON", "LOST"] } }, orderBy: { updatedAt: "desc" } }) : null;
    if (open) {
      await db.deal.update({
        where: { id: open.id },
        data: {
          stage: s.deal.stage,
          ...(s.deal.amount !== null && { amount: BigInt(s.deal.amount) }),
          ...(open.stage !== s.deal.stage && { closedAt: isClosed(s.deal.stage) ? new Date() : null }),
        },
      });
      if (open.stage !== s.deal.stage) await afterStageChange(me.id, open, s.deal.stage);
    } else {
      const last = await db.deal.aggregate({ where: { stage: s.deal.stage }, _max: { position: true } });
      await db.deal.create({
        data: {
          title: s.deal.title,
          stage: s.deal.stage,
          amount: BigInt(s.deal.amount ?? 0),
          customerId: t.customerId,
          ownerId: ctx.ownerId,
          position: (last._max.position ?? -1) + 1,
          closedAt: isClosed(s.deal.stage) ? new Date() : null,
        },
      });
    }
    applied.push("معامله");
    revalidatePath("/deals");
  }

  if (t.leadId && s.leadPriority) {
    await db.lead.update({ where: { id: t.leadId }, data: { priority: s.leadPriority } });
    applied.push("اولویت");
  }
  if (t.leadId && s.leadStatus) {
    const res = await setLeadStatusAction(t.leadId, s.leadStatus); // logs + fires automations
    if (res.ok) applied.push("وضعیت");
  }

  revalidatePath(t.leadId ? `/leads/${t.leadId}` : `/customers/${t.customerId}`);
  revalidatePath("/tasks");
  return { ok: true, applied };
}

// ---------- 3. Message writer ----------

const messageSchema = z.object({
  subject: z.string().nullable().describe("موضوع ایمیل؛ برای پیامک null"),
  body: z.string(),
});

export async function writeMessageAction(goal: string, channel: "SMS" | "EMAIL"): Promise<AiResult<z.infer<typeof messageSchema>>> {
  await requireUser();
  if (goal.trim().length < 5) return { ok: false, error: "هدف پیام را کمی کامل‌تر بنویسید." };
  try {
    const data = await generateJson(
      messageSchema,
      `${SYSTEM} یک ${channel === "SMS" ? "پیامک بازاریابی کوتاه (حداکثر ۱۴۰ حرف، بدون لینک ساختگی)" : "ایمیل کوتاه و حرفه‌ای"} بنویس. برای نام گیرنده دقیقاً {{name}} و برای شرکت {{company}} بگذار. اطلاعاتی مثل درصد تخفیف یا تاریخ را فقط اگر در هدف آمده بنویس.`,
      `هدف پیام: ${goal.trim()}`,
    );
    return { ok: true, data: { subject: channel === "EMAIL" ? data.subject : null, body: data.body } };
  } catch (e) {
    return fail(e);
  }
}
