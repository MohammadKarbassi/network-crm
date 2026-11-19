import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export const compactFa = (n: number) => new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/** One cell of the KPI strip: label, value, change vs the previous period. Up is good for every metric here. */
export function StatTile({
  label,
  value,
  unit,
  current,
  previous,
  periodLabel,
}: {
  label: string;
  value: string;
  unit?: string;
  current?: number;
  previous?: number;
  periodLabel?: string;
}) {
  const hasDelta = current !== undefined && previous !== undefined;
  const diff = hasDelta ? current - previous : 0;
  const pct = previous ? Math.round((diff / previous) * 100) : null;
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-4 sm:px-5">
      <p className="text-[12.5px] text-muted-foreground">{label}</p>
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        {/* Keyed by value: a new number (period switch) rises in instead of swapping silently. */}
        <span key={value} className="animate-rise text-[21px] leading-8 font-semibold sm:text-[26px] tracking-tight tabular-nums">{value}</span>
        {unit && <span className="text-[13px] text-muted-foreground">{unit}</span>}
      </p>
      {hasDelta && (
        <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span
            key={`${current}-${previous}`}
            className={cn(
              "inline-flex animate-rise items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
              diff > 0 && "bg-emerald-50 text-emerald-700",
              diff < 0 && "bg-red-50 text-red-700",
              diff === 0 && "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-3" />
            {diff === 0 ? "بدون تغییر" : pct === null ? "جدید" : `${Math.abs(pct).toLocaleString("fa-IR")}٪`}
          </span>
          {diff !== 0 && <span>نسبت به {periodLabel}</span>}
        </p>
      )}
    </div>
  );
}

/** KPI cells in one bordered strip with hairline dividers, instead of a row of separate cards. */
export function KpiStrip({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-label="شاخص‌ها"
      className="stagger grid grid-cols-2 divide-border overflow-hidden rounded-[10px] border bg-card lg:grid-cols-4 lg:divide-x [&>*]:border-border max-lg:[&>*:nth-child(odd)]:border-e max-lg:[&>*:nth-child(-n+2)]:border-b"
    >
      {children}
    </section>
  );
}
