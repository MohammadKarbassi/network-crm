import type { Metadata } from "next";
import { endOfDay, startOfDay } from "date-fns-jalali";
import { CalendarDays, CheckCircle2, List, Plus } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { canSeeAll } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Segmented } from "@/components/app/segmented";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignedTo } from "@/server/auth/scope";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getAssignableUsers } from "@/server/users";
import { MonthCalendar, monthRange } from "./month-calendar";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskList, type TaskRow } from "./task-list";

export const metadata: Metadata = { title: "تسک‌ها و تقویم" };

const include = {
  assignee: { select: { name: true } },
  customer: { select: { id: true, name: true } },
  lead: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;

const toRow = (t: Prisma.TaskGetPayload<{ include: typeof include }>): TaskRow => ({
  id: t.id,
  title: t.title,
  description: t.description,
  dueAt: t.dueAt,
  doneAt: t.doneAt,
  assigneeId: t.assigneeId,
  assigneeName: t.assignee.name,
  customer: t.customer,
  lead: t.lead,
});

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const me = await requireUser();
  const sp = await searchParams;
  const manager = canSeeAll(me.role);
  const view = sp.view === "calendar" ? "calendar" : "list";
  // Managers default to their own tasks and can switch to anyone's or the whole team's.
  const who = manager && typeof sp.who === "string" ? sp.who : "me";
  const scope: Prisma.TaskWhereInput = manager ? (who === "all" ? {} : { assigneeId: who === "me" ? me.id : who }) : assignedTo(me);
  const assignees = manager ? await getAssignableUsers() : undefined;
  const query = { who: manager ? who : undefined };

  const now = new Date();
  let body: React.ReactNode;
  if (view === "calendar") {
    const month = typeof sp.month === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.month) ? new Date(`${sp.month}T12:00:00`) : now;
    const { start, end } = monthRange(month);
    const tasks = await db.task.findMany({ where: { ...scope, dueAt: { gte: start, lt: end } }, orderBy: { dueAt: "asc" }, include });
    body = <MonthCalendar anchor={month} tasks={tasks.map(toRow)} query={query} />;
  } else {
    const [open, done] = await Promise.all([
      db.task.findMany({ where: { ...scope, doneAt: null }, orderBy: { dueAt: "asc" }, include }),
      db.task.findMany({ where: { ...scope, doneAt: { not: null } }, orderBy: { doneAt: "desc" }, take: 10, include }),
    ]);
    const rows = open.map(toRow);
    const groups = [
      { title: "عقب‌افتاده", tasks: rows.filter((t) => t.dueAt < startOfDay(now)) },
      { title: "امروز", tasks: rows.filter((t) => t.dueAt >= startOfDay(now) && t.dueAt <= endOfDay(now)) },
      { title: "پیش رو", tasks: rows.filter((t) => t.dueAt > endOfDay(now)) },
      { title: "انجام‌شده اخیر", tasks: done.map(toRow) },
    ].filter((g) => g.tasks.length);
    // One list; each group is a header row inside it, not its own boxed card.
    body = groups.length ? (
      <Card className="gap-0 py-0">
        {groups.map((g, i) => (
          <section key={g.title} aria-label={g.title}>
            <h2 className={cn("flex items-center gap-2 bg-muted/45 px-4 py-2 text-[12.5px] font-medium text-muted-foreground", i > 0 && "border-t")}>
              {g.title}
              <span className="rounded-md bg-background px-1.5 text-[11.5px] tabular-nums">{g.tasks.length.toLocaleString("fa-IR")}</span>
            </h2>
            <div className="border-t">
              <TaskList tasks={g.tasks} assignees={assignees} showAssignee={manager && who !== "me"} />
            </div>
          </section>
        ))}
      </Card>
    ) : (
      <Card>
        <EmptyState icon={CheckCircle2} title="تسکی ندارید" description="کارهای پیگیری، تماس‌ها و جلسه‌ها را اینجا برنامه‌ریزی کنید." />
      </Card>
    );
  }

  const tab = (v: "list" | "calendar") => `?${new URLSearchParams({ view: v, ...(manager && { who }) })}`;

  return (
    <>
      <PageHeader title="تسک‌ها و تقویم" description="برنامهٔ کارهای فروش؛ مدیر فروش می‌تواند برای کارشناس‌ها تسک تعریف کند.">
        <TaskFormDialog
          assignees={assignees}
          defaultAssigneeId={manager && who !== "me" && who !== "all" ? who : me.id}
          trigger={
            <Button>
              <Plus /> تسک جدید
            </Button>
          }
        />
      </PageHeader>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          label="نما"
          items={[
            { href: tab("list"), label: <><List /> فهرست</>, active: view === "list" },
            { href: tab("calendar"), label: <><CalendarDays /> تقویم</>, active: view === "calendar" },
          ]}
        />
        {assignees && (
          <form className="flex gap-2">
            <input type="hidden" name="view" value={view} />
            <Select name="who" defaultValue={who}>
              <SelectTrigger className="w-48" aria-label="تسک‌های چه کسی">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">تسک‌های من</SelectItem>
                <SelectItem value="all">همهٔ تیم</SelectItem>
                {assignees
                  .filter((a) => a.id !== me.id)
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary">
              نمایش
            </Button>
          </form>
        )}
      </div>
      {body}
    </>
  );
}
