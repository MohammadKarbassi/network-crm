import type { ActivityType, DealStage, LeadStatus, Priority, Role, Source } from "@/generated/prisma/enums";

// Persian labels for enums, shared by server and client code.
export const roleLabel: Record<Role, string> = {
  ADMIN: "ادمین",
  SALES_MANAGER: "مدیر فروش",
  SALES_REP: "کارشناس فروش",
};

export const sourceLabel: Record<Source, string> = {
  WEBSITE: "وب‌سایت",
  INSTAGRAM: "اینستاگرام",
  REFERRAL: "معرفی",
  PHONE: "تماس تلفنی",
  EXHIBITION: "نمایشگاه",
  ADVERTISING: "تبلیغات",
  OTHER: "سایر",
};

export const leadStatusLabel: Record<LeadStatus, string> = {
  NEW: "جدید",
  CONTACTED: "تماس گرفته شده",
  QUALIFIED: "واجد شرایط",
  UNQUALIFIED: "فاقد شرایط",
  CONVERTED: "تبدیل به مشتری",
};

export const priorityLabel: Record<Priority, string> = { LOW: "کم", MEDIUM: "متوسط", HIGH: "زیاد" };

export const dealStageLabel: Record<DealStage, string> = {
  NEW: "جدید",
  CONTACTED: "تماس اولیه",
  PROPOSAL: "ارسال پیشنهاد",
  NEGOTIATION: "مذاکره",
  WON: "موفق",
  LOST: "ناموفق",
};

export const activityTypeLabel: Record<ActivityType, string> = {
  NOTE: "یادداشت",
  CALL: "تماس",
  MEETING: "جلسه",
  SMS: "پیامک",
  EMAIL: "ایمیل",
  STATUS_CHANGE: "تغییر وضعیت",
  SYSTEM: "سیستم",
};

export const formatDate = (d: Date) => new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(d);
export const formatDateTime = (d: Date) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(d);

export const formatToman = (n: number) => `${n.toLocaleString("fa-IR")} تومان`;
