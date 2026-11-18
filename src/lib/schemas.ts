import { z } from "zod";
import { toEnglishDigits } from "@/lib/phone";

// Fields shared by customers and leads.
export const contactFields = {
  name: z.string({ error: "نام الزامی است." }).trim().min(2, "نام حداقل ۲ حرف باشد."),
  phone: z
    .string()
    .transform((v) => toEnglishDigits(v).replace(/[\s\-()]/g, ""))
    .pipe(z.string().regex(/^\+?\d{8,14}$/, "شماره تلفن معتبر نیست."))
    .optional(),
  email: z.email("ایمیل معتبر نیست.").optional(),
  company: z.string().trim().optional(),
  source: z.enum(["WEBSITE", "INSTAGRAM", "REFERRAL", "PHONE", "EXHIBITION", "ADVERTISING", "OTHER"]),
  ownerId: z.string().optional().transform((v) => (v === "none" ? undefined : v)), // "none" = unassigned (Select cannot hold "")
  notes: z.string().trim().optional(),
};

export const activitySchema = z.object({
  type: z.enum(["NOTE", "CALL", "MEETING"]),
  body: z.string({ error: "متن یادداشت خالی است." }).trim().min(1, "متن یادداشت خالی است."),
});

export const dealStages = ["NEW", "CONTACTED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;

/** Toman amount typed with Persian or English digits and optional thousands separators. */
export const tomanAmount = z
  .string()
  .default("0")
  .transform((v) => toEnglishDigits(v).replace(/[,،٬\s]/g, ""))
  .pipe(z.string().regex(/^\d{1,15}$/, "مبلغ باید عدد باشد."))
  .transform((v) => BigInt(v));

/** yyyy-mm-dd from DatePicker, read as noon Tehran time so the calendar day never shifts. */
export const isoDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((v) => new Date(`${v}T12:00:00+03:30`))
  .optional();

/** Date (yyyy-mm-dd) + time (HH:mm) in Tehran. Iran has had no DST since 2022, so +03:30 is fixed. */
export const tehranDateTime = (day: string, time: string) => new Date(`${day}T${time}:00+03:30`);

/** Who a campaign goes to. Stored as JSON on Campaign.audience. */
export const audienceSchema = z.object({
  target: z.enum(["customers", "leads"]),
  source: z.enum(["WEBSITE", "INSTAGRAM", "REFERRAL", "PHONE", "EXHIBITION", "ADVERTISING", "OTHER"]).optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED"]).optional(), // leads only
  ownerId: z.string().optional(),
});
export type Audience = z.infer<typeof audienceSchema>;
