"use client";

import { useTransition } from "react";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";
import type { LeadStatus } from "@/generated/prisma/enums";
import { leadStatusLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convertLeadAction, setLeadStatusAction } from "../actions";

const statuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED"];

/** Status picker that saves on change, plus the convert-to-customer button. */
export function LeadControls({ id, status }: { id: string; status: LeadStatus }) {
  const [pending, startTransition] = useTransition();

  const changeStatus = (next: string) =>
    startTransition(async () => {
      const res = await setLeadStatusAction(id, next as LeadStatus);
      if (!res.ok) toast.error(res.error);
      else toast.success(`وضعیت: ${leadStatusLabel[next as LeadStatus]}`);
    });

  const convert = () =>
    startTransition(async () => {
      const res = await convertLeadAction(id); // redirects to the new customer on success
      if (res && !res.ok) toast.error(res.error);
    });

  return (
    <>
      <Select value={status} onValueChange={changeStatus} disabled={pending}>
        <SelectTrigger className="w-44" aria-label="وضعیت لید">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {leadStatusLabel[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={convert} disabled={pending}>
        <UserCheck /> تبدیل به مشتری
      </Button>
    </>
  );
}
