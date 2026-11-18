"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import type { Channel } from "@/generated/prisma/enums";
import type { ActionResult } from "@/lib/action-result";
import { AiWriteButton } from "@/components/app/ai-write-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

/** `action` is sendMessageAction bound to the record. `contacts` decides which channels are usable. */
export function SendMessageDialog({
  action,
  contacts,
  ready,
  ai,
}: {
  action: (fd: FormData) => Promise<ActionResult>;
  contacts: { phone: string | null; email: string | null };
  ready: Record<Channel, boolean>;
  ai?: boolean;
}) {
  const usable: Record<Channel, boolean> = { SMS: ready.SMS && !!contacts.phone, EMAIL: ready.EMAIL && !!contacts.email };
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>(usable.SMS || !usable.EMAIL ? "SMS" : "EMAIL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();

  const why = (c: Channel) =>
    !ready[c] ? "سرویس پیکربندی نشده" : c === "SMS" ? (!contacts.phone ? "شماره ثبت نشده" : null) : !contacts.email ? "ایمیل ثبت نشده" : null;

  const submit = (fd: FormData) =>
    startTransition(async () => {
      const res = await action(fd);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      toast.success("پیام در صف ارسال قرار گرفت. نتیجه در تایم‌لاین ثبت می‌شود.");
      setErrors({});
      setSubject("");
      setBody("");
      setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!usable.SMS && !usable.EMAIL} title={!usable.SMS && !usable.EMAIL ? "راه ارتباطی قابل استفاده‌ای ثبت نشده" : undefined}>
          <Send /> ارسال پیام
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ارسال پیام</DialogTitle>
          <DialogDescription dir="ltr" className="text-end">
            {channel === "SMS" ? contacts.phone : contacts.email}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => (e.preventDefault(), submit(new FormData(e.currentTarget)))}>
          <input type="hidden" name="channel" value={channel} />
          <FieldGroup>
            <Tabs value={channel} onValueChange={(v) => setChannel(v as Channel)}>
              <TabsList className="w-full">
                {(["SMS", "EMAIL"] as const).map((c) => (
                  <TabsTrigger key={c} value={c} disabled={!usable[c]} title={why(c) ?? undefined}>
                    {c === "SMS" ? "پیامک" : "ایمیل"}
                    {why(c) && <span className="text-xs text-muted-foreground">({why(c)})</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {channel === "EMAIL" && (
              <Field data-invalid={!!errors.subject}>
                <FieldLabel htmlFor="subject">موضوع</FieldLabel>
                <Input id="subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <FieldError>{errors.subject?.[0]}</FieldError>
              </Field>
            )}
            <Field data-invalid={!!errors.body}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="body">متن</FieldLabel>
                {ai && <AiWriteButton channel={channel} onWrite={(m) => (setBody(m.body), m.subject && setSubject(m.subject))} />}
              </div>
              <Textarea id="body" name="body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} required />
              {channel === "SMS" && <FieldDescription>هر ۷۰ حرف فارسی یک پیامک حساب می‌شود.</FieldDescription>}
              <FieldError>{errors.body?.[0]}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={pending}>
              <Send /> ارسال
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
