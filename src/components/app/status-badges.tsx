import type { LeadStatus, Priority } from "@/generated/prisma/enums";
import { leadStatusLabel, priorityLabel } from "@/lib/labels";
import { bandLabel } from "@/lib/lead-score";
import { cn } from "@/lib/utils";

const leadStatusStyle: Record<LeadStatus, string> = {
  NEW: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  CONTACTED: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  QUALIFIED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  UNQUALIFIED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  CONVERTED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

const priorityStyle: Record<Priority, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-amber-700 dark:text-amber-400",
  HIGH: "text-red-700 dark:text-red-400",
};

const pill = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export const LeadStatusBadge = ({ status }: { status: LeadStatus }) => (
  <span className={cn(pill, leadStatusStyle[status])}>{leadStatusLabel[status]}</span>
);

export const PriorityBadge = ({ priority }: { priority: Priority }) => (
  <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", priorityStyle[priority])}>
    <span className="size-2 rounded-full bg-current" aria-hidden />
    {priorityLabel[priority]}
  </span>
);

const bandStyle = {
  hot: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  warm: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  cold: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
};

/** Rule-based lead score: number plus a hot/warm/cold label, so it never relies on color alone. */
export const ScoreBadge = ({ score, band }: { score: number; band: keyof typeof bandLabel }) => (
  <span className={cn(pill, "gap-1 tabular-nums", bandStyle[band])} title="امتیاز قاعده‌محور از ۱۰۰">
    {score.toLocaleString("fa-IR")} · {bandLabel[band]}
  </span>
);
