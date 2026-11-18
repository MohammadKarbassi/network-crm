"use client";

import { useEffect, useState, useTransition } from "react";
import { Megaphone, Users } from "lucide-react";
import { toast } from "sonner";
import type { Channel, LeadStatus, Source } from "@/generated/prisma/enums";
import { leadStatusLabel, sourceLabel } from "@/lib/labels";
import type { Audience } from "@/lib/schemas";
import { TEMPLATE_HINT } from "@/lib/template";
import { AiWriteButton } from "@/components/app/ai-write-button";
import type { OwnerOption } from "@/components/app/owner-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet, FieldLegend } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createCampaignAction, previewAudienceAction } from "./actions";

const activeLeadStatuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED"];
const SMS_PART = 70; // characters per Persian (UCS-2) SMS part

export function CampaignFormDialog({ owners, ready, ai }: { owners: OwnerOption[]; ready: Record<Channel, boolean>; ai: boolean }) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>(ready.SMS ? "SMS" : "EMAIL");
  const [audience, setAudience] = useState<Audience>({ target: "customers" });
  const [reach, setReach] = useState<{ count: number; sample: string[] } | null>(null);
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();

  // Recount recipients whenever the audience or channel changes (debounced).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(() => previewAudienceAction(audience, channel).then((r) => !cancelled && setReach(r)), 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [audience, channel, open]);

  const set = (patch: Partial<Audience>) => setAudience((a) => ({ ...a, ...patch }));
  const all = <T,>(v: string) => (v === "all" ? undefined : (v as T));

  const submit = (fd: FormData) =>
    startTransition(async () => {
      const res = await createCampaignAction(fd);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      toast.success("کمپین در صف ارسال قرار گرفت.");
      setErrors({});
      setBody("");
      setSubject("");
      setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!ready.SMS && !ready.EMAIL}>
          <Megaphone /> کمپین جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>کمپین جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => (e.preventDefault(), submit(new FormData(e.currentTarget)))}>
          <input type="hidden" name="channel" value={channel} />
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">نام کمپین</FieldLabel>
              <Input id="name" name="name" placeholder="مثلاً: تخفیف پاییزه مشتریان اینستاگرام" required />
              <FieldError>{errors.name?.[0]}</FieldError>
            </Field>

            <Tabs value={channel} onValueChange={(v) => setChannel(v as Channel)}>
              <TabsList className="w-full">
                <TabsTrigger value="SMS" disabled={!ready.SMS}>
                  پیامک {!ready.SMS && <span className="text-xs">(پیکربندی نشده)</span>}
                </TabsTrigger>
                <TabsTrigger value="EMAIL" disabled={!ready.EMAIL}>
                  ایمیل {!ready.EMAIL && <span className="text-xs">(پیکربندی نشده)</span>}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <FieldSet className="rounded-lg border p-4">
              <FieldLegend variant="label">مخاطبان</FieldLegend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel>گروه</FieldLabel>
                  <Select name="target" value={audience.target} onValueChange={(v) => set({ target: v as Audience["target"], status: undefined })}>
                    <SelectTrigger className="w-full" aria-label="گروه">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customers">مشتری‌ها</SelectItem>
                      <SelectItem value="leads">لیدها</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>منبع</FieldLabel>
                  <Select name="source" value={audience.source ?? "all"} onValueChange={(v) => set({ source: all<Source>(v) })}>
                    <SelectTrigger className="w-full" aria-label="منبع">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه منابع</SelectItem>
                      {(Object.keys(sourceLabel) as Source[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {sourceLabel[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {audience.target === "leads" && (
                  <Field>
                    <FieldLabel>وضعیت لید</FieldLabel>
                    <Select name="status" value={audience.status ?? "all"} onValueChange={(v) => set({ status: all<Audience["status"]>(v) })}>
                      <SelectTrigger className="w-full" aria-label="وضعیت لید">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه لیدهای فعال</SelectItem>
                        {activeLeadStatuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {leadStatusLabel[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
                <Field>
                  <FieldLabel>کارشناس</FieldLabel>
                  <Select name="ownerId" value={audience.ownerId ?? "all"} onValueChange={(v) => set({ ownerId: all<string>(v) })}>
                    <SelectTrigger className="w-full" aria-label="کارشناس">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه کارشناس‌ها</SelectItem>
                      {owners.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <p className="flex items-center gap-2 text-sm" aria-live="polite">
                <Users className="size-4 text-muted-foreground" />
                {reach === null ? (
                  <span className="text-muted-foreground">در حال شمارش…</span>
                ) : (
                  <span>
                    <strong>{reach.count.toLocaleString("fa-IR")}</strong> گیرنده با {channel === "SMS" ? "شماره تلفن" : "ایمیل"}
                    {reach.sample.length > 0 && <span className="text-muted-foreground"> (مثل {reach.sample.join("، ")})</span>}
                  </span>
                )}
              </p>
            </FieldSet>

            {channel === "EMAIL" && (
              <Field data-invalid={!!errors.subject}>
                <FieldLabel htmlFor="subject">موضوع ایمیل</FieldLabel>
                <Input id="subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <FieldError>{errors.subject?.[0]}</FieldError>
              </Field>
            )}
            <Field data-invalid={!!errors.body}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="body">متن پیام</FieldLabel>
                {ai && <AiWriteButton channel={channel} onWrite={(m) => (setBody(m.body), m.subject && setSubject(m.subject))} />}
              </div>
              <Textarea id="body" name="body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="سلام {{name}} عزیز، …" required />
              <FieldDescription>
                {TEMPLATE_HINT}
                {channel === "SMS" && body && ` · ${body.length.toLocaleString("fa-IR")} حرف ≈ ${Math.ceil(body.length / SMS_PART).toLocaleString("fa-IR")} پیامک برای هر گیرنده`}
              </FieldDescription>
              <FieldError>{errors.body?.[0]}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={pending || !reach?.count}>
              ارسال به {(reach?.count ?? 0).toLocaleString("fa-IR")} نفر
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
