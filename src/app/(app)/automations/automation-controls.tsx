"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DeleteButton } from "@/components/app/delete-button";
import { Switch } from "@/components/ui/switch";
import { deleteAutomationAction, toggleAutomationAction } from "./actions";

export function ActiveSwitch({ id, isActive, name }: { id: string; isActive: boolean; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Switch
      checked={isActive}
      disabled={pending}
      aria-label={`فعال بودن «${name}»`}
      onCheckedChange={(v) =>
        startTransition(async () => {
          const res = await toggleAutomationAction(id, v);
          if (!res.ok) toast.error(res.error);
          else toast.success(v ? "اتوماسیون فعال شد." : "اتوماسیون غیرفعال شد.");
        })
      }
    />
  );
}

export function DeleteAutomation({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  return (
    <DeleteButton
      name={name}
      description="سابقهٔ اجراهای این اتوماسیون هم حذف می‌شود. پیام‌هایی که ارسال شده‌اند در تایم‌لاین مشتری‌ها می‌مانند."
      action={deleteAutomationAction.bind(null, id)}
      onDeleted={() => router.push("/automations")}
    />
  );
}
