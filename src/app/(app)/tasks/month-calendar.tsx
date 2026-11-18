import Link from "next/link";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns-jalali";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TaskRow } from "./task-list";

const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const MAX_PER_DAY = 3;

export const localIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayKey = (d: Date) => localIso(d);

/** Visible range of a Jalali month grid: whole weeks, Saturday to Friday. */
export function monthRange(anchor: Date) {
  return {
    start: startOfWeek(startOfMonth(anchor), { weekStartsOn: 6 }),
    end: addDays(endOfWeek(endOfMonth(anchor), { weekStartsOn: 6 }), 1), // exclusive
  };
}

export function MonthCalendar({ anchor, tasks, query }: { anchor: Date; tasks: TaskRow[]; query: Record<string, string | undefined> }) {
  const { start, end } = monthRange(anchor);
  const days = eachDayOfInterval({ start, end: addDays(end, -1) });
  const byDay = Map.groupBy(tasks, (t) => dayKey(t.dueAt));
  const href = (month: Date) =>
    `?${new URLSearchParams({ ...Object.fromEntries(Object.entries(query).filter(([, v]) => v)), view: "calendar", month: localIso(month) } as Record<string, string>)}`;
  const title = new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric" }).format(anchor);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link href={href(addMonths(anchor, -1))} aria-label="ماه قبل">
              <ChevronRight />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={href(new Date())}>امروز</Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={href(addMonths(anchor, 1))} aria-label="ماه بعد">
              <ChevronLeft />
            </Link>
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[42rem] grid-cols-7 overflow-hidden rounded-xl border">
          {WEEKDAYS.map((w) => (
            <div key={w} className="border-b bg-muted/50 px-2 py-2 text-center text-xs font-medium text-muted-foreground">
              {w}
            </div>
          ))}
          {days.map((day) => {
            const items = byDay.get(dayKey(day)) ?? [];
            const muted = !isSameMonth(day, anchor);
            return (
              <div key={dayKey(day)} className={cn("min-h-28 border-b border-s p-1.5 [&:nth-child(7n+1)]:border-s-0", muted && "bg-muted/30")}>
                <div
                  className={cn(
                    "mb-1 flex size-6 items-center justify-center rounded-full text-xs",
                    muted && "text-muted-foreground",
                    isToday(day) && "bg-primary font-semibold text-primary-foreground",
                  )}
                >
                  {new Intl.DateTimeFormat("fa-IR", { day: "numeric" }).format(day)}
                </div>
                <ul className="flex flex-col gap-1">
                  {items.slice(0, MAX_PER_DAY).map((t) => (
                    <li
                      key={t.id}
                      title={t.title}
                      className={cn(
                        "truncate rounded px-1.5 py-0.5 text-xs",
                        t.doneAt ? "bg-muted text-muted-foreground line-through" : t.dueAt < new Date() ? "bg-destructive/10 text-destructive" : "bg-primary/10",
                      )}
                    >
                      {t.title}
                    </li>
                  ))}
                  {items.length > MAX_PER_DAY && (
                    <li className="px-1.5 text-xs text-muted-foreground">+{(items.length - MAX_PER_DAY).toLocaleString("fa-IR")} مورد دیگر</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
