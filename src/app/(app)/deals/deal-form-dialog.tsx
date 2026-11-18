"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { DealStage } from "@/generated/prisma/enums";
import { dealStageLabel } from "@/lib/labels";
import { DatePicker } from "@/components/app/date-picker";
import { DeleteButton } from "@/components/app/delete-button";
import { EnumSelect } from "@/components/app/enum-select";
import { OwnerSelect, type OwnerOption } from "@/components/app/owner-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteDealAction, saveDealAction } from "./actions";

export type DealFormValue = {
  id: string;
  title: string;
  amount: number;
  stage: DealStage;
  customerId: string;
  ownerId: string | null;
  expectedCloseAt: Date | null;
};

type Props = {
  deal?: DealFormValue;
  /** Pick list for new deals from the board; omit when the customer is fixed (customer page). */
  customers?: { id: string; name: string }[];
  customerId?: string;
  owners?: OwnerOption[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DealFormDialog({ deal, customers, customerId, owners, trigger, open: openProp, onOpenChange }: Props) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();
  const fixedCustomer = deal?.customerId ?? customerId;

  const submit = (fd: FormData) =>
    startTransition(async () => {
      const res = await saveDealAction(deal?.id ?? null, fd);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      toast.success(deal ? "معامله ویرایش شد." : "معامله اضافه شد.");
      setErrors({});
      setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{deal ? "ویرایش معامله" : "معامله جدید"}</DialogTitle>
        </DialogHeader>
        {/* onSubmit, not action=: a form action resets inputs, which would wipe them on a validation error. */}
        <form onSubmit={(e) => (e.preventDefault(), submit(new FormData(e.currentTarget)))}>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.title} className="sm:col-span-2">
              <FieldLabel htmlFor="title">عنوان</FieldLabel>
              <Input id="title" name="title" defaultValue={deal?.title} placeholder="مثلاً: قرارداد پشتیبانی سالانه" required />
              <FieldError>{errors.title?.[0]}</FieldError>
            </Field>
            {fixedCustomer ? (
              <input type="hidden" name="customerId" value={fixedCustomer} />
            ) : (
              <Field data-invalid={!!errors.customerId} className="sm:col-span-2">
                <FieldLabel>مشتری</FieldLabel>
                <Select name="customerId">
                  <SelectTrigger className="w-full" aria-label="مشتری">
                    <SelectValue placeholder="انتخاب مشتری" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{errors.customerId?.[0]}</FieldError>
              </Field>
            )}
            <Field data-invalid={!!errors.amount}>
              <FieldLabel htmlFor="amount">مبلغ (تومان)</FieldLabel>
              <Input id="amount" name="amount" dir="ltr" inputMode="numeric" defaultValue={deal?.amount ?? ""} placeholder="0" />
              <FieldError>{errors.amount?.[0]}</FieldError>
            </Field>
            <Field>
              <FieldLabel>مرحله</FieldLabel>
              <EnumSelect name="stage" labels={dealStageLabel} defaultValue={deal?.stage} ariaLabel="مرحله" />
            </Field>
            <Field>
              <FieldLabel>تاریخ پیش‌بینی بستن</FieldLabel>
              <DatePicker name="expectedCloseAt" defaultValue={deal?.expectedCloseAt} />
            </Field>
            {owners && (
              <Field>
                <FieldLabel>کارشناس</FieldLabel>
                <OwnerSelect owners={owners} defaultValue={deal?.ownerId} />
              </Field>
            )}
          </FieldGroup>
          <DialogFooter className="mt-6 sm:justify-between">
            <Button type="submit" disabled={pending}>
              {deal ? "ذخیره" : "افزودن"}
            </Button>
            {deal && (
              <DeleteButton
                name={deal.title}
                description="یادداشت‌ها و تسک‌های این معامله هم حذف می‌شوند. سابقهٔ آن در صفحهٔ مشتری می‌ماند."
                action={deleteDealAction.bind(null, deal.id)}
                onDeleted={() => (toast.success("معامله حذف شد."), setOpen(false))}
              />
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
