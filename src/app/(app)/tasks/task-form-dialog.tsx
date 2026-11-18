"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import type { OwnerOption } from "@/components/app/owner-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveTaskAction } from "./actions";

export type TaskFormValue = { id: string; title: string; description: string | null; dueAt: Date; assigneeId: string };

// Time of day in Tehran as HH:mm, for the native time input.
const tehranTime = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);

type Props = {
  task?: TaskFormValue;
  /** Managers get an assignee picker; reps always assign to themselves. */
  assignees?: OwnerOption[];
  defaultAssigneeId?: string;
  link?: { customerId?: string; leadId?: string };
  defaultDay?: Date;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function TaskFormDialog({ task, assignees, defaultAssigneeId, link, defaultDay, trigger, open: openProp, onOpenChange }: Props) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();

  const submit = (fd: FormData) =>
    startTransition(async () => {
      const res = await saveTaskAction(task?.id ?? null, fd);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      toast.success(task ? "تسک ویرایش شد." : "تسک اضافه شد.");
      setErrors({});
      setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "ویرایش تسک" : "تسک جدید"}</DialogTitle>
        </DialogHeader>
        {/* onSubmit, not action=: a form action resets inputs, which would wipe them on a validation error. */}
        <form onSubmit={(e) => (e.preventDefault(), submit(new FormData(e.currentTarget)))}>
          {link?.customerId && <input type="hidden" name="customerId" value={link.customerId} />}
          {link?.leadId && <input type="hidden" name="leadId" value={link.leadId} />}
          <FieldGroup className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field data-invalid={!!errors.title} className="sm:col-span-2">
              <FieldLabel htmlFor="title">عنوان</FieldLabel>
              <Input id="title" name="title" defaultValue={task?.title} placeholder="مثلاً: تماس پیگیری پیش‌فاکتور" required />
              <FieldError>{errors.title?.[0]}</FieldError>
            </Field>
            <Field data-invalid={!!errors.dueDay}>
              <FieldLabel>تاریخ</FieldLabel>
              <DatePicker name="dueDay" defaultValue={task?.dueAt ?? defaultDay ?? new Date()} />
              <FieldError>{errors.dueDay?.[0]}</FieldError>
            </Field>
            <Field data-invalid={!!errors.dueTime}>
              <FieldLabel htmlFor="dueTime">ساعت</FieldLabel>
              <Input id="dueTime" name="dueTime" type="time" dir="ltr" defaultValue={task ? tehranTime(task.dueAt) : "09:00"} required />
            </Field>
            {assignees && (
              <Field className="sm:col-span-2">
                <FieldLabel>انجام‌دهنده</FieldLabel>
                <Select name="assigneeId" defaultValue={task?.assigneeId ?? defaultAssigneeId}>
                  <SelectTrigger className="w-full" aria-label="انجام‌دهنده">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignees.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="description">توضیحات</FieldLabel>
              <Textarea id="description" name="description" rows={2} defaultValue={task?.description ?? ""} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={pending}>
              {task ? "ذخیره" : "افزودن"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
