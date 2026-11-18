"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { AiSummary } from "@/app/(app)/ai/actions";
import { ScoreBadge } from "@/components/app/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";


/** On-demand AI briefing: summary, risks, next step (and the lead score for leads). */
export function AiSummaryCard({ summarize }: { summarize: () => Promise<{ ok: true; data: AiSummary } | { ok: false; error: string }> }) {
  const [data, setData] = useState<AiSummary | null>(null);
  const [pending, startTransition] = useTransition();
  const run = () =>
    startTransition(async () => {
      const res = await summarize();
      if (!res.ok) return void toast.error(res.error);
      setData(res.data);
    });

  return (
    <Card className="h-fit border-violet-200 dark:border-violet-900">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-600" /> خلاصهٔ هوشمند
        </CardTitle>
        <Button variant="outline" size="sm" onClick={run} disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {data ? "به‌روزرسانی" : "تهیهٔ خلاصه"}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm" aria-live="polite">
        {pending && !data ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </>
        ) : data ? (
          <>
            {data.score && (
              <p className="flex items-center gap-2">
                امتیاز لید: <ScoreBadge score={data.score.value} band={data.score.band} />
              </p>
            )}
            <p className="leading-7">{data.summary}</p>
            {data.risks.length > 0 && (
              <ul className="flex flex-col gap-1">
                {data.risks.map((r) => (
                  <li key={r} className="flex gap-2 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            )}
            <p className="flex gap-2 rounded-md bg-muted p-3 font-medium">
              <ArrowLeft className="mt-0.5 size-4 shrink-0" /> {data.nextStep}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">قبل از تماس، تاریخچه را در چند خط مرور کنید: چه گذشته، چه ریسکی هست و قدم بعدی چیست.</p>
        )}
      </CardContent>
    </Card>
  );
}
