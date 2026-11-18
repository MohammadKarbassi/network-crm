import type { LeadStatus, Priority, Source } from "@/generated/prisma/enums";

// Rule-based, so the number is explainable and testable; AI only narrates it.
const statusPts: Record<LeadStatus, number> = { NEW: 10, CONTACTED: 20, QUALIFIED: 35, UNQUALIFIED: 0, CONVERTED: 35 };
const priorityPts: Record<Priority, number> = { LOW: 0, MEDIUM: 8, HIGH: 15 };
const sourcePts: Record<Source, number> = { REFERRAL: 15, EXHIBITION: 10, WEBSITE: 8, PHONE: 8, INSTAGRAM: 6, ADVERTISING: 5, OTHER: 3 };
const DAY = 86_400_000;

export type ScoreInput = {
  status: LeadStatus;
  priority: Priority;
  source: Source;
  phone: string | null;
  email: string | null;
  interactions: number; // notes, calls, meetings, messages (not system events)
  lastInteractionAt: Date | null;
};

export function scoreLead(l: ScoreInput, now = new Date()) {
  const parts: [string, number][] = [
    [`وضعیت`, statusPts[l.status]],
    [`اولویت`, priorityPts[l.priority]],
    [`منبع`, sourcePts[l.source]],
    [`راه ارتباطی`, (l.phone ? 5 : 0) + (l.email ? 5 : 0)],
    [`تعامل`, Math.min(l.interactions * 4, 15)],
    [`تازگی`, !l.lastInteractionAt ? 0 : now.getTime() - l.lastInteractionAt.getTime() <= 7 * DAY ? 10 : now.getTime() - l.lastInteractionAt.getTime() <= 30 * DAY ? 5 : 0],
  ];
  const total = parts.reduce((s, [, p]) => s + p, 0);
  // An unqualified lead stays cold whatever else is true.
  const score = l.status === "UNQUALIFIED" ? Math.min(total, 10) : Math.min(total, 100);
  return { score, parts, band: score >= 60 ? ("hot" as const) : score >= 35 ? ("warm" as const) : ("cold" as const) };
}

export const bandLabel = { hot: "داغ", warm: "گرم", cold: "سرد" } as const;
