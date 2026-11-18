"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { OwnerOption } from "@/components/app/owner-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteTaskAction, toggleTaskAction } from "./actions";
import { TaskFormDialog, type TaskFormValue } from "./task-form-dialog";

export type TaskRow = TaskFormValue & {
  doneAt: Date | null;
  assigneeName: string;
  customer: { id: string; name: string } | null;
  lead: { id: string; name: string } | null;
};

export function TaskList({ tasks, assignees, showAssignee }: { tasks: TaskRow[]; assignees?: OwnerOption[]; showAssignee?: boolean }) {
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [, startTransition] = useTransition();
  // Ticks the checkbox immediately while the server saves.
  const [optimistic, setDone] = useOptimistic(tasks, (list, { id, done }: { id: string; done: boolean }) =>
    list.map((t) => (t.id === id ? { ...t, doneAt: done ? new Date() : null } : t)),
  );
  const now = new Date();

  const toggle = (t: TaskRow, done: boolean) =>
    startTransition(async () => {
      setDone({ id: t.id, done });
      const res = await toggleTaskAction(t.id, done);
      if (!res.ok) toast.error(res.error);
    });

  const remove = (t: TaskRow) =>
    startTransition(async () => {
      const res = await deleteTaskAction(t.id);
      if (!res.ok) toast.error(res.error);
      else toast.success("تسک حذف شد.");
    });

  return (
    <>
      <ul className="divide-y">
        {optimistic.map((t) => {
          const overdue = !t.doneAt && t.dueAt < now;
          const related = t.customer ? { href: `/customers/${t.customer.id}`, name: t.customer.name } : t.lead ? { href: `/leads/${t.lead.id}`, name: t.lead.name } : null;
          return (
            <li key={t.id} className="group flex items-start gap-3 px-4 py-3">
              <Checkbox
                className="mt-0.5"
                checked={!!t.doneAt}
                onCheckedChange={(v) => toggle(t, v === true)}
                aria-label={t.doneAt ? `برگرداندن «${t.title}» به انجام‌نشده` : `علامت انجام برای «${t.title}»`}
              />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", t.doneAt && "text-muted-foreground line-through")}>{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className={cn(overdue && "font-medium text-destructive")}>
                    {overdue && "عقب‌افتاده · "}
                    {formatDateTime(t.dueAt)}
                  </span>
                  {showAssignee && <span>{t.assigneeName}</span>}
                  {related && (
                    <Link href={related.href} className="underline-offset-2 hover:underline">
                      {related.name}
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                <Button variant="ghost" size="icon" onClick={() => setEditing(t)} aria-label={`ویرایش «${t.title}»`}>
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(t)} aria-label={`حذف «${t.title}»`}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {editing && (
        <TaskFormDialog key={editing.id} task={editing} assignees={assignees} open onOpenChange={(o) => !o && setEditing(null)} />
      )}
    </>
  );
}
