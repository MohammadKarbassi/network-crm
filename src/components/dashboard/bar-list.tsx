import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Horizontal bars in plain HTML: label, bar, value. One hue; the value is always printed, so color never carries meaning alone. */
export function BarList({ rows, empty }: { rows: { label: string; value: number; display: string; detail?: string }[]; empty: string }) {
  const max = Math.max(...rows.map((r) => r.value), 0);
  if (!max) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.label}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm" tabIndex={0}>
                <span className="truncate text-muted-foreground">{r.label}</span>
                <div className="h-3 rounded-e bg-transparent">
                  {r.value > 0 && <div className="h-full rounded-e-[4px] bg-primary/80" style={{ width: `${(r.value / max) * 100}%`, minWidth: 4 }} />}
                </div>
                <span className="text-end font-medium tabular-nums">{r.display}</span>
              </div>
            </TooltipTrigger>
            {r.detail && <TooltipContent>{r.detail}</TooltipContent>}
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}
