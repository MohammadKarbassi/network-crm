import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export const compactFa = (n: number) => new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/** Label · value · delta vs the previous period. Up is good for every metric shown here. */
export function StatTile({
  label,
  value,
  current,
  previous,
  periodLabel,
  hero,
}: {
  label: string;
  value: string;
  current?: number;
  previous?: number;
  periodLabel?: string;
  hero?: boolean;
}) {
  const hasDelta = current !== undefined && previous !== undefined;
  const diff = hasDelta ? current - previous : 0;
  const pct = previous ? Math.round((diff / previous) * 100) : null;
  return (
    <Card className={cn("gap-0 py-5", hero && "sm:col-span-2")}>
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("font-semibold", hero ? "text-5xl leading-tight" : "text-3xl")}>{value}</p>
        {hasDelta && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {diff === 0 ? (
            <span>بدون تغییر نسبت به {periodLabel}</span>
          ) : (
            <>
              <span className={cn("inline-flex items-center gap-0.5 font-medium", diff > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
                {diff > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {pct === null ? (diff > 0 ? "جدید" : "") : `${Math.abs(pct).toLocaleString("fa-IR")}٪`}
              </span>
              <span>{diff > 0 ? "بیشتر" : "کمتر"} از {periodLabel}</span>
            </>
          )}
        </p>
        )}
      </CardContent>
    </Card>
  );
}
