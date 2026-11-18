"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Source } from "@/generated/prisma/enums";
import { OwnerSelect, type OwnerOption } from "@/components/app/owner-select";
import { sourceLabel } from "@/lib/labels";
import { EnumSelect } from "@/components/app/enum-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveCustomerAction } from "./actions";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  source: Source;
  ownerId: string | null;
  notes: string | null;
};

export function CustomerFormDialog({
  customer,
  owners,
  trigger,
}: {
  customer?: Customer;
  owners?: OwnerOption[]; // only passed for managers; reps own what they create
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();

  const submit = (fd: FormData) =>
    startTransition(async () => {
      const res = await saveCustomerAction(customer?.id ?? null, fd);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      toast.success(customer ? "مشتری ویرایش شد." : "مشتری اضافه شد.");
      setErrors({});
      setOpen(false);
      if (!customer) router.push(`/customers/${res.id}`);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer ? "ویرایش مشتری" : "مشتری جدید"}</DialogTitle>
        </DialogHeader>
        {/* onSubmit, not action=: a form action resets inputs, which would wipe them on a validation error. */}
        <form onSubmit={(e) => (e.preventDefault(), submit(new FormData(e.currentTarget)))}>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.name} className="sm:col-span-2">
              <FieldLabel htmlFor="name">نام</FieldLabel>
              <Input id="name" name="name" defaultValue={customer?.name} required />
              <FieldError>{errors.name?.[0]}</FieldError>
            </Field>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="phone">تلفن</FieldLabel>
              <Input id="phone" name="phone" dir="ltr" inputMode="tel" defaultValue={customer?.phone ?? ""} />
              <FieldError>{errors.phone?.[0]}</FieldError>
            </Field>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">ایمیل</FieldLabel>
              <Input id="email" name="email" type="email" dir="ltr" defaultValue={customer?.email ?? ""} />
              <FieldError>{errors.email?.[0]}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="company">شرکت</FieldLabel>
              <Input id="company" name="company" defaultValue={customer?.company ?? ""} />
            </Field>
            <Field>
              <FieldLabel>منبع آشنایی</FieldLabel>
              <EnumSelect name="source" labels={sourceLabel} defaultValue={customer?.source ?? "OTHER"} ariaLabel="منبع" />
            </Field>
            {owners && (
              <Field className="sm:col-span-2">
                <FieldLabel>کارشناس مسئول</FieldLabel>
                <OwnerSelect owners={owners} defaultValue={customer?.ownerId} />
              </Field>
            )}
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="notes">توضیحات</FieldLabel>
              <Textarea id="notes" name="notes" rows={3} defaultValue={customer?.notes ?? ""} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={pending}>
              {customer ? "ذخیره" : "افزودن"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
