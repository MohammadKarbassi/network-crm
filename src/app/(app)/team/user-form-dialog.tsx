"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Role } from "@/generated/prisma/enums";
import type { ActionResult } from "@/lib/action-result";
import { roleLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveUserAction } from "./actions";

type User = { id: string; name: string; phone: string; email: string | null; role: Role; isActive: boolean };

export function UserFormDialog({ user, roles, trigger }: { user?: User; roles: Role[]; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();

  const submit = (fd: FormData) =>
    startTransition(async () => {
      const res: ActionResult = await saveUserAction(user?.id ?? null, fd);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      toast.success(user ? "کاربر ویرایش شد." : "کاربر اضافه شد.");
      setErrors({});
      setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "ویرایش کاربر" : "کاربر جدید"}</DialogTitle>
        </DialogHeader>
        {/* onSubmit, not action=: a form action resets inputs, which would wipe them on a validation error. */}
        <form onSubmit={(e) => (e.preventDefault(), submit(new FormData(e.currentTarget)))}>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">نام و نام خانوادگی</FieldLabel>
              <Input id="name" name="name" defaultValue={user?.name} required />
              <FieldError>{errors.name?.[0]}</FieldError>
            </Field>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="phone">شماره موبایل (برای ورود)</FieldLabel>
              <Input id="phone" name="phone" dir="ltr" inputMode="tel" placeholder="09xxxxxxxxx" defaultValue={user?.phone} required />
              <FieldError>{errors.phone?.[0]}</FieldError>
            </Field>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">ایمیل (اختیاری)</FieldLabel>
              <Input id="email" name="email" type="email" dir="ltr" defaultValue={user?.email ?? ""} />
              <FieldError>{errors.email?.[0]}</FieldError>
            </Field>
            <Field>
              <FieldLabel>نقش</FieldLabel>
              <Select name="role" defaultValue={user?.role ?? roles[roles.length - 1]}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabel[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="isActive" name="isActive" defaultChecked={user?.isActive ?? true} />
              <FieldLabel htmlFor="isActive">حساب فعال است</FieldLabel>
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={pending}>
              {user ? "ذخیره" : "افزودن"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
