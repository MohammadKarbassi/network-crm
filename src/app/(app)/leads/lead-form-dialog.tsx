"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LeadStatus, Priority, Source } from "@/generated/prisma/enums";
import { leadStatusLabel, priorityLabel, sourceLabel } from "@/lib/labels";
import { EnumSelect } from "@/components/app/enum-select";
import { OwnerSelect, type OwnerOption } from "@/components/app/owner-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveLeadAction } from "./actions";

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  source: Source;
  status: LeadStatus;
  priority: Priority;
  ownerId: string | null;
  notes: string | null;
};

const editableStatuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED"];

export function LeadFormDialog({ lead, owners, trigger }: { lead?: Lead; owners?: OwnerOption[]; trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();

  const submit = (fd: FormData) =>
    startTransition(async () => {
      const res = await saveLeadAction(lead?.id ?? null, fd);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      toast.success(lead ? "لید ویرایش شد." : "لید اضافه شد.");
      setErrors({});
      setOpen(false);
      if (!lead) router.push(`/leads/${res.id}`);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead ? "ویرایش لید" : "لید جدید"}</DialogTitle>
        </DialogHeader>
        {/* onSubmit, not action=: a form action resets inputs, which would wipe them on a validation error. */}
        <form onSubmit={(e) => (e.preventDefault(), submit(new FormData(e.currentTarget)))}>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.name} className="sm:col-span-2">
              <FieldLabel htmlFor="name">نام</FieldLabel>
              <Input id="name" name="name" defaultValue={lead?.name} required />
              <FieldError>{errors.name?.[0]}</FieldError>
            </Field>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="phone">تلفن</FieldLabel>
              <Input id="phone" name="phone" dir="ltr" inputMode="tel" defaultValue={lead?.phone ?? ""} />
              <FieldError>{errors.phone?.[0]}</FieldError>
            </Field>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">ایمیل</FieldLabel>
              <Input id="email" name="email" type="email" dir="ltr" defaultValue={lead?.email ?? ""} />
              <FieldError>{errors.email?.[0]}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="company">شرکت</FieldLabel>
              <Input id="company" name="company" defaultValue={lead?.company ?? ""} />
            </Field>
            <Field>
              <FieldLabel>منبع</FieldLabel>
              <EnumSelect name="source" labels={sourceLabel} defaultValue={lead?.source ?? "OTHER"} ariaLabel="منبع" />
            </Field>
            <Field>
              <FieldLabel>وضعیت</FieldLabel>
              <EnumSelect name="status" labels={leadStatusLabel} values={editableStatuses} defaultValue={lead?.status} ariaLabel="وضعیت" />
            </Field>
            <Field>
              <FieldLabel>اولویت</FieldLabel>
              <EnumSelect name="priority" labels={priorityLabel} defaultValue={lead?.priority ?? "MEDIUM"} ariaLabel="اولویت" />
            </Field>
            {owners && (
              <Field className="sm:col-span-2">
                <FieldLabel>کارشناس مسئول</FieldLabel>
                <OwnerSelect owners={owners} defaultValue={lead?.ownerId} />
              </Field>
            )}
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="notes">توضیحات</FieldLabel>
              <Textarea id="notes" name="notes" rows={3} defaultValue={lead?.notes ?? ""} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={pending}>
              {lead ? "ذخیره" : "افزودن"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
