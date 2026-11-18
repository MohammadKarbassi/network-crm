import "server-only";
import { addDays, addMonths, startOfMonth, startOfWeek } from "date-fns-jalali";
import type { DealStage, Source } from "@/generated/prisma/enums";
import type { CurrentUser } from "@/server/auth/session";
import { assignedTo, ownedBy } from "@/server/auth/scope";
import { db } from "@/server/db";

export type Period = "week" | "month";

/** Current Jalali week (Sat–Fri) or month so far, plus the same-length span before it for deltas. */
export function periodRange(period: Period, now = new Date()) {
  const start = period === "week" ? startOfWeek(now, { weekStartsOn: 6 }) : startOfMonth(now);
  const prevStart = period === "week" ? addDays(start, -7) : addMonths(start, -1);
  return { start, prevStart, end: now };
}

const between = (gte: Date, lt: Date) => ({ gte, lt });

async function periodStats(me: CurrentUser, start: Date, end: Date) {
  const own = ownedBy(me);
  const [leads, customers, won, lost] = await Promise.all([
    db.lead.count({ where: { ...own, createdAt: between(start, end) } }),
    db.customer.count({ where: { ...own, createdAt: between(start, end) } }),
    db.deal.aggregate({ where: { ...own, stage: "WON", closedAt: between(start, end) }, _count: true, _sum: { amount: true } }),
    db.deal.count({ where: { ...own, stage: "LOST", closedAt: between(start, end) } }),
  ]);
  const closed = won._count + lost;
  return {
    leads,
    customers,
    wonCount: won._count,
    revenue: Number(won._sum.amount ?? 0),
    winRate: closed ? won._count / closed : null, // null = nothing closed yet, not 0%
  };
}

export async function getStats(me: CurrentUser, period: Period) {
  const { start, prevStart, end } = periodRange(period);
  const [current, previous] = await Promise.all([periodStats(me, start, end), periodStats(me, prevStart, start)]);
  return { current, previous };
}

/** Won revenue per Jalali month, oldest first, for the last `months` months. */
export async function getMonthlyRevenue(me: CurrentUser, months = 6) {
  const first = startOfMonth(addMonths(new Date(), -(months - 1)));
  const deals = await db.deal.findMany({
    where: { ...ownedBy(me), stage: "WON", closedAt: { gte: first } },
    select: { amount: true, closedAt: true },
  });
  return Array.from({ length: months }, (_, i) => {
    const from = addMonths(first, i);
    const to = addMonths(first, i + 1);
    const inMonth = deals.filter((d) => d.closedAt! >= from && d.closedAt! < to);
    return {
      month: new Intl.DateTimeFormat("fa-IR", { month: "long" }).format(from),
      revenue: inMonth.reduce((s, d) => s + Number(d.amount), 0),
      count: inMonth.length,
    };
  });
}

const openStages: DealStage[] = ["NEW", "CONTACTED", "PROPOSAL", "NEGOTIATION"];

export async function getPipeline(me: CurrentUser) {
  const rows = await db.deal.groupBy({ by: ["stage"], where: { ...ownedBy(me), stage: { in: openStages } }, _count: true, _sum: { amount: true } });
  return openStages.map((stage) => {
    const r = rows.find((x) => x.stage === stage);
    return { stage, count: r?._count ?? 0, value: Number(r?._sum.amount ?? 0) };
  });
}

export async function getLeadSources(me: CurrentUser, period: Period) {
  const { start, end } = periodRange(period);
  const rows = await db.lead.groupBy({ by: ["source"], where: { ...ownedBy(me), createdAt: between(start, end) }, _count: true });
  return rows.map((r) => ({ source: r.source as Source, count: r._count })).sort((a, b) => b.count - a.count);
}

/** One row per active user with their numbers for the period. Managers only. */
export async function getTeamPerformance(period: Period) {
  const { start, end } = periodRange(period);
  const now = new Date();
  const [users, leads, won, open, overdue] = await Promise.all([
    db.user.findMany({ where: { isActive: true }, select: { id: true, name: true, role: true }, orderBy: { name: "asc" } }),
    db.lead.groupBy({ by: ["ownerId"], where: { createdAt: between(start, end) }, _count: true }),
    db.deal.groupBy({ by: ["ownerId"], where: { stage: "WON", closedAt: between(start, end) }, _count: true, _sum: { amount: true } }),
    db.deal.groupBy({ by: ["ownerId"], where: { stage: { in: openStages } }, _count: true, _sum: { amount: true } }),
    db.task.groupBy({ by: ["assigneeId"], where: { doneAt: null, dueAt: { lt: now } }, _count: true }),
  ]);
  return users
    .map((u) => ({
      ...u,
      leads: leads.find((r) => r.ownerId === u.id)?._count ?? 0,
      wonCount: won.find((r) => r.ownerId === u.id)?._count ?? 0,
      revenue: Number(won.find((r) => r.ownerId === u.id)?._sum.amount ?? 0),
      openCount: open.find((r) => r.ownerId === u.id)?._count ?? 0,
      openValue: Number(open.find((r) => r.ownerId === u.id)?._sum.amount ?? 0),
      overdueTasks: overdue.find((r) => r.assigneeId === u.id)?._count ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/** A rep's own day: tasks due today or overdue. */
export const getMyOpenTasks = (me: CurrentUser) =>
  db.task.findMany({
    where: { ...assignedTo(me), assigneeId: me.id, doneAt: null, dueAt: { lt: addDays(new Date(new Date().setHours(0, 0, 0, 0)), 1) } },
    orderBy: { dueAt: "asc" },
    include: { assignee: { select: { name: true } }, customer: { select: { id: true, name: true } }, lead: { select: { id: true, name: true } } },
  });
