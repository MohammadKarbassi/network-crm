import { z } from "zod";
import type { AutomationTrigger } from "@/generated/prisma/enums";
import { dealStageLabel, leadStatusLabel } from "@/lib/labels";
import { dealStages } from "@/lib/schemas";

// Steps are stored as JSON on Automation.steps, so new step types need no migration.
export const stepSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SEND_SMS"), body: z.string().trim().min(1, "متن پیامک خالی است.").max(1000) }),
  z.object({ type: z.literal("SEND_EMAIL"), subject: z.string().trim().min(1, "موضوع ایمیل خالی است."), body: z.string().trim().min(1, "متن ایمیل خالی است.").max(5000) }),
  z.object({ type: z.literal("WAIT"), minutes: z.number().int().min(1, "زمان انتظار باید حداقل ۱ دقیقه باشد.").max(60 * 24 * 90) }),
  z.object({ type: z.literal("CREATE_TASK"), title: z.string().trim().min(2, "عنوان تسک خالی است."), dueInHours: z.number().int().min(0).max(24 * 90) }),
]);
export type Step = z.infer<typeof stepSchema>;
export const stepsSchema = z.array(stepSchema).min(1, "حداقل یک مرحله لازم است.").max(20);

export const triggerConfigSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED"]).optional(), // LEAD_STATUS_CHANGED
  stage: z.enum(dealStages).optional(), // DEAL_STAGE_CHANGED
});
export type TriggerConfig = z.infer<typeof triggerConfigSchema>;

export const triggerLabel: Record<AutomationTrigger, string> = {
  LEAD_CREATED: "لید جدید ثبت شد",
  LEAD_STATUS_CHANGED: "وضعیت لید تغییر کرد",
  DEAL_STAGE_CHANGED: "مرحلهٔ معامله تغییر کرد",
  CUSTOMER_CREATED: "مشتری جدید ثبت شد",
};

export const stepLabel: Record<Step["type"], string> = {
  SEND_SMS: "ارسال پیامک",
  SEND_EMAIL: "ارسال ایمیل",
  WAIT: "انتظار",
  CREATE_TASK: "ساخت تسک پیگیری",
};

/** Does an event (trigger + what changed to) match an automation's trigger config? Empty config = any value. */
export function matchesTrigger(config: TriggerConfig, event: { status?: string; stage?: string }) {
  if (config.status && config.status !== event.status) return false;
  if (config.stage && config.stage !== event.stage) return false;
  return true;
}

export function formatWait(minutes: number) {
  if (minutes % 1440 === 0) return `${(minutes / 1440).toLocaleString("fa-IR")} روز`;
  if (minutes % 60 === 0) return `${(minutes / 60).toLocaleString("fa-IR")} ساعت`;
  return `${minutes.toLocaleString("fa-IR")} دقیقه`;
}

/** Ready-made automations a manager can start from (the mentor's "آماده" automations). */
export const automationTemplates: { name: string; description: string; trigger: AutomationTrigger; triggerConfig: TriggerConfig; steps: Step[] }[] = [
  {
    name: "خوشامد لید جدید",
    description: "پیامک خوشامد فوری، و یک روز بعد تسک تماس برای کارشناس",
    trigger: "LEAD_CREATED",
    triggerConfig: {},
    steps: [
      { type: "SEND_SMS", body: "سلام {{name}} عزیز، از آشنایی با شما خوشحالیم. همکاران ما به‌زودی با شما تماس می‌گیرند." },
      { type: "WAIT", minutes: 1440 },
      { type: "CREATE_TASK", title: "تماس پیگیری با لید جدید", dueInHours: 4 },
    ],
  },
  {
    name: "پیگیری لید واجد شرایط",
    description: "وقتی لید واجد شرایط شد: ایمیل معرفی و تسک ارسال پیشنهاد",
    trigger: "LEAD_STATUS_CHANGED",
    triggerConfig: { status: "QUALIFIED" },
    steps: [
      { type: "SEND_EMAIL", subject: "معرفی خدمات ما", body: "سلام {{name}} عزیز،\nممنون از وقتی که گذاشتید. خلاصهٔ خدمات ما پیوست است و کارشناس ما برای جزئیات با شما تماس می‌گیرد." },
      { type: "CREATE_TASK", title: "ارسال پیشنهاد قیمت", dueInHours: 24 },
    ],
  },
  {
    name: "تشکر از خرید",
    description: "وقتی معامله موفق شد: پیامک تشکر و یک هفته بعد تسک پیگیری رضایت",
    trigger: "DEAL_STAGE_CHANGED",
    triggerConfig: { stage: "WON" },
    steps: [
      { type: "SEND_SMS", body: "{{name}} عزیز، از اعتماد شما سپاسگزاریم. برای هر سؤالی در کنار شما هستیم." },
      { type: "WAIT", minutes: 10080 },
      { type: "CREATE_TASK", title: "تماس پیگیری رضایت مشتری", dueInHours: 24 },
    ],
  },
];

export const stepSummary = (s: Step) => (s.type === "WAIT" ? `انتظار ${formatWait(s.minutes)}` : stepLabel[s.type]);

export function triggerSummary(trigger: AutomationTrigger, rawConfig: unknown) {
  const c = triggerConfigSchema.safeParse(rawConfig).data ?? {};
  const detail = c.status ? leadStatusLabel[c.status] : c.stage ? dealStageLabel[c.stage] : null;
  return detail ? `${triggerLabel[trigger]}: ${detail}` : triggerLabel[trigger];
}
