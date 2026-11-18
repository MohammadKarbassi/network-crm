"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { NoteSuggestion } from "@/app/(app)/ai/actions";
import type { ActionResult } from "@/lib/action-result";
import { dealStageLabel, leadStatusLabel, priorityLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Ai = {
  analyze: (note: string) => Promise<{ ok: true; data: NoteSuggestion } | { ok: false; error: string }>;
  apply: (note: string, picked: NoteSuggestion) => Promise<{ ok: true; applied: string[] } | { ok: false; error: string }>;
};

/** `action` is a server action already bound to its record. `ai` (optional) adds smart-note analysis. */
export function ActivityForm({ action, ai }: { action: (fd: FormData) => Promise<ActionResult>; ai?: Ai }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [note, setNote] = useState("");
  const [suggestion, setSuggestion] = useState<NoteSuggestion | null>(null);
  const [pending, startTransition] = useTransition();
  const [thinking, startThinking] = useTransition();

  const submit = (fd: FormData) =>
    startTransition(async () => {
      const res = await action(fd);
      if (!res.ok) return void toast.error(res.fieldErrors?.body?.[0] ?? res.error);
      setNote("");
    });

  const analyze = () =>
    startThinking(async () => {
      const res = await ai!.analyze(note);
      if (!res.ok) return void toast.error(res.error);
      setSuggestion(res.data);
    });

  return (
    <div className="flex flex-col gap-3">
      <form ref={formRef} onSubmit={(e) => (e.preventDefault(), submit(new FormData(e.currentTarget)))} className="flex flex-col gap-2">
        <Textarea
          name="body"
          rows={3}
          value={note}
          onChange={(e) => (setNote(e.target.value), setSuggestion(null))}
          placeholder={ai ? "نتیجه تماس یا جلسه را آزاد بنویسید؛ مثلاً «بودجه ۵۰ میلیون، هفته بعد جلسه». تحلیل هوشمند تغییرات لازم را پیشنهاد می‌دهد." : "نتیجه تماس، جلسه یا هر نکته‌ای …"}
          aria-label="متن یادداشت"
          required
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          {ai && (
            <Button type="button" variant="outline" onClick={analyze} disabled={thinking || pending || note.trim().length < 5} className="me-auto">
              {thinking ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {thinking ? "در حال تحلیل…" : "تحلیل هوشمند"}
            </Button>
          )}
          <Select name="type" defaultValue="NOTE">
            <SelectTrigger className="w-32" aria-label="نوع">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NOTE">یادداشت</SelectItem>
              <SelectItem value="CALL">تماس</SelectItem>
              <SelectItem value="MEETING">جلسه</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={pending}>
            ثبت
          </Button>
        </div>
      </form>
      {ai && suggestion && (
        <SuggestionPanel
          suggestion={suggestion}
          onCancel={() => setSuggestion(null)}
          onApply={(picked) =>
            startTransition(async () => {
              const res = await ai.apply(note, picked);
              if (!res.ok) return void toast.error(res.error);
              toast.success(`ثبت شد: ${res.applied.join("، ")}`);
              setSuggestion(null);
              setNote("");
            })
          }
          pending={pending}
        />
      )}
    </div>
  );
}

function SuggestionPanel({
  suggestion: s,
  onApply,
  onCancel,
  pending,
}: {
  suggestion: NoteSuggestion;
  onApply: (picked: NoteSuggestion) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  // Every suggestion starts ticked; the user unticks what they don't want. Nothing is saved until "apply".
  const [on, setOn] = useState({ task: !!s.task, deal: !!s.deal, leadStatus: !!s.leadStatus, leadPriority: !!s.leadPriority });
  const [dealStage, setDealStage] = useState(s.deal?.stage);
  const rows = [
    s.task && { key: "task" as const, text: `ساخت تسک «${s.task.title}» برای ${s.task.dueInDays === 0 ? "امروز" : `${s.task.dueInDays.toLocaleString("fa-IR")} روز دیگر`}` },
    s.deal && {
      key: "deal" as const,
      text: `${s.deal.action === "update" ? "به‌روزرسانی معاملهٔ باز" : `ساخت معاملهٔ «${s.deal.title}»`}${s.deal.amount !== null ? ` با مبلغ ${s.deal.amount.toLocaleString("fa-IR")} تومان` : ""}`,
      extra: (
        <Select value={dealStage} onValueChange={(v) => setDealStage(v as typeof dealStage)}>
          <SelectTrigger size="sm" className="w-36" aria-label="مرحله معامله">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(dealStageLabel) as (keyof typeof dealStageLabel)[]).map((k) => (
              <SelectItem key={k} value={k}>
                {dealStageLabel[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    s.leadStatus && { key: "leadStatus" as const, text: `تغییر وضعیت لید به «${leadStatusLabel[s.leadStatus]}»` },
    s.leadPriority && { key: "leadPriority" as const, text: `تغییر اولویت به «${priorityLabel[s.leadPriority]}»` },
  ].filter((r) => !!r);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/30">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="size-4 text-violet-600" /> پیشنهاد هوش مصنوعی
      </p>
      <p className="text-sm text-muted-foreground">{s.summary}</p>
      {rows.length === 0 ? (
        <p className="text-sm">تغییری لازم نیست؛ فقط یادداشت ثبت می‌شود.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.key} className="flex flex-wrap items-center gap-2">
              <Checkbox id={`ai-${r.key}`} checked={on[r.key]} onCheckedChange={(v) => setOn((o) => ({ ...o, [r.key]: v === true }))} />
              <Label htmlFor={`ai-${r.key}`} className="font-normal">
                {r.text}
              </Label>
              {"extra" in r && r.extra}
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          انصراف
        </Button>
        <Button
          disabled={pending}
          onClick={() =>
            onApply({
              summary: s.summary,
              task: on.task ? s.task : null,
              deal: on.deal && s.deal && dealStage ? { ...s.deal, stage: dealStage } : null,
              leadStatus: on.leadStatus ? s.leadStatus : null,
              leadPriority: on.leadPriority ? s.leadPriority : null,
            })
          }
        >
          ثبت یادداشت و تغییرات انتخاب‌شده
        </Button>
      </div>
    </div>
  );
}
