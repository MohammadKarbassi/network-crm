import { CalendarClock, Info, Mail, MessageSquare, Phone, RefreshCw, StickyNote } from "lucide-react";
import type { ActivityType } from "@/generated/prisma/enums";
import { activityTypeLabel, formatDateTime } from "@/lib/labels";

const icons: Record<ActivityType, typeof Info> = {
  NOTE: StickyNote,
  CALL: Phone,
  MEETING: CalendarClock,
  SMS: MessageSquare,
  EMAIL: Mail,
  STATUS_CHANGE: RefreshCw,
  SYSTEM: Info,
};

export type TimelineItem = { id: string; type: ActivityType; body: string; createdAt: Date; author: { name: string } | null };

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) return <p className="py-6 text-center text-sm text-muted-foreground">هنوز فعالیتی ثبت نشده.</p>;
  return (
    <ol className="flex flex-col gap-4">
      {items.map((a) => {
        const Icon = icons[a.type];
        return (
          <li key={a.id} className="flex gap-3 transition-[opacity,translate] duration-300 ease-out starting:translate-y-1.5 starting:opacity-0">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{activityTypeLabel[a.type]}</span>
                {a.author && <span>{a.author.name}</span>}
                <span>{formatDateTime(a.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{a.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
