"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Clock, ListChecks, Mail, MessageSquare, Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import type { AutomationTrigger, DealStage, LeadStatus } from "@/generated/prisma/enums";
import { type Step, stepLabel, type TriggerConfig, triggerLabel } from "@/lib/automation";
import { dealStageLabel, leadStatusLabel } from "@/lib/labels";
import { TEMPLATE_HINT } from "@/lib/template";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { type AutomationInput, saveAutomationAction } from "./actions";

const stepIcon = { SEND_SMS: MessageSquare, SEND_EMAIL: Mail, WAIT: Clock, CREATE_TASK: ListChecks } as const;
const blank: Record<Step["type"], Step> = {
  SEND_SMS: { type: "SEND_SMS", body: "" },
  SEND_EMAIL: { type: "SEND_EMAIL", subject: "", body: "" },
  WAIT: { type: "WAIT", minutes: 1440 },
  CREATE_TASK: { type: "CREATE_TASK", title: "", dueInHours: 24 },
};
const units = { m: 1, h: 60, d: 1440 } as const;
const unitLabel = { m: "دقیقه", h: "ساعت", d: "روز" } as const;
const unitOf = (min: number): keyof typeof units => (min % 1440 === 0 ? "d" : min % 60 === 0 ? "h" : "m");

export function AutomationBuilder({ id, initial }: { id?: string; initial: AutomationInput }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<AutomationInput>) => setState((s) => ({ ...s, ...patch }));
  const setStep = (i: number, step: Step) => set({ steps: state.steps.map((s, j) => (j === i ? step : s)) });
  const move = (i: number, d: -1 | 1) => {
    const steps = [...state.steps];
    [steps[i], steps[i + d]] = [steps[i + d], steps[i]];
    set({ steps });
  };

  const save = () =>
    startTransition(async () => {
      const res = await saveAutomationAction(id ?? null, state);
      if (!res.ok) return void toast.error(res.error);
      toast.success("اتوماسیون ذخیره شد.");
      if (!id) router.push(`/automations/${res.id}`);
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col items-stretch">
        {/* Trigger */}
        <Card className="border-primary/40">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-5" />
            </div>
            <CardTitle>وقتی…</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Select value={state.trigger} onValueChange={(v) => set({ trigger: v as AutomationTrigger, triggerConfig: {} })}>
              <SelectTrigger className="w-full" aria-label="رویداد">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(triggerLabel) as AutomationTrigger[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {triggerLabel[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.trigger === "LEAD_STATUS_CHANGED" && (
              <ConfigSelect
                label="به وضعیت"
                value={state.triggerConfig.status}
                options={(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED"] as LeadStatus[]).map((s) => [s, leadStatusLabel[s]])}
                onChange={(status) => set({ triggerConfig: { status: status as TriggerConfig["status"] } })}
              />
            )}
            {state.trigger === "DEAL_STAGE_CHANGED" && (
              <ConfigSelect
                label="به مرحله"
                value={state.triggerConfig.stage}
                options={(Object.keys(dealStageLabel) as DealStage[]).map((s) => [s, dealStageLabel[s]])}
                onChange={(stage) => set({ triggerConfig: { stage: stage as TriggerConfig["stage"] } })}
              />
            )}
          </CardContent>
        </Card>

        {/* Steps, drawn as a vertical flow */}
        {state.steps.map((step, i) => {
          const Icon = stepIcon[step.type];
          return (
            <div key={i} className="flex flex-col items-stretch transition-[opacity,translate] duration-300 ease-out starting:-translate-y-1.5 starting:opacity-0">
              <div className="mx-auto h-6 w-px bg-border" aria-hidden />
              <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="flex-1">
                    {(i + 1).toLocaleString("fa-IR")}. {stepLabel[step.type]}
                  </CardTitle>
                  <div className="flex">
                    <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label="انتقال به بالا">
                      <ArrowUp />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={i === state.steps.length - 1} onClick={() => move(i, 1)} aria-label="انتقال به پایین">
                      <ArrowDown />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => set({ steps: state.steps.filter((_, j) => j !== i) })} aria-label="حذف مرحله">
                      <Trash2 />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <StepFields step={step} onChange={(s) => setStep(i, s)} />
                </CardContent>
              </Card>
            </div>
          );
        })}

        <div className="mx-auto h-6 w-px bg-border" aria-hidden />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="mx-auto border-dashed">
              <Plus /> افزودن مرحله
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {(Object.keys(blank) as Step["type"][]).map((t) => {
              const Icon = stepIcon[t];
              return (
                <DropdownMenuItem key={t} onSelect={() => set({ steps: [...state.steps, blank[t]] })}>
                  <Icon /> {stepLabel[t]}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="h-fit lg:sticky lg:top-4">
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="name">نام اتوماسیون</FieldLabel>
            <Input id="name" value={state.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="active">فعال</Label>
            <Switch id="active" checked={state.isActive} onCheckedChange={(isActive) => set({ isActive })} />
          </div>
          <p className="text-xs text-muted-foreground">
            پیام‌ها از صف ارسال می‌شوند و مرحلهٔ «انتظار» بدون نگه‌داشتن سرور، در زمان خودش ادامه پیدا می‌کند. {TEMPLATE_HINT}
          </p>
          <Button onClick={save} disabled={pending}>
            ذخیره
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigSelect({ label, value, options, onChange }: { label: string; value?: string; options: [string, string][]; onChange: (v: string | undefined) => void }) {
  return (
    <Select value={value ?? "any"} onValueChange={(v) => onChange(v === "any" ? undefined : v)}>
      <SelectTrigger className="w-full" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="any">{label}: هر مقدار</SelectItem>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {label}: {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StepFields({ step, onChange }: { step: Step; onChange: (s: Step) => void }) {
  switch (step.type) {
    case "SEND_SMS":
      return (
        <Field>
          <Textarea aria-label="متن پیامک" rows={3} value={step.body} onChange={(e) => onChange({ ...step, body: e.target.value })} placeholder="سلام {{name}} عزیز، …" />
        </Field>
      );
    case "SEND_EMAIL":
      return (
        <>
          <Input aria-label="موضوع ایمیل" value={step.subject} onChange={(e) => onChange({ ...step, subject: e.target.value })} placeholder="موضوع" />
          <Textarea aria-label="متن ایمیل" rows={4} value={step.body} onChange={(e) => onChange({ ...step, body: e.target.value })} placeholder="متن ایمیل" />
        </>
      );
    case "WAIT": {
      const unit = unitOf(step.minutes);
      return (
        <div className="flex items-center gap-2">
          <Input
            aria-label="مدت انتظار"
            type="number"
            min={1}
            className="w-28"
            dir="ltr"
            value={step.minutes / units[unit]}
            onChange={(e) => onChange({ ...step, minutes: Math.max(1, Math.round(Number(e.target.value) || 1)) * units[unit] })}
          />
          <Select value={unit} onValueChange={(u) => onChange({ ...step, minutes: (step.minutes / units[unit]) * units[u as keyof typeof units] })}>
            <SelectTrigger className="w-28" aria-label="واحد">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(units) as (keyof typeof units)[]).map((u) => (
                <SelectItem key={u} value={u}>
                  {unitLabel[u]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    case "CREATE_TASK":
      return (
        <div className="grid gap-2 sm:grid-cols-[1fr_9rem]">
          <Input aria-label="عنوان تسک" value={step.title} onChange={(e) => onChange({ ...step, title: e.target.value })} placeholder="عنوان تسک" />
          <Field orientation="horizontal">
            <Input
              aria-label="مهلت به ساعت"
              type="number"
              min={0}
              dir="ltr"
              className="w-20"
              value={step.dueInHours}
              onChange={(e) => onChange({ ...step, dueInHours: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
            />
            <FieldDescription>ساعت مهلت</FieldDescription>
          </Field>
        </div>
      );
  }
}
