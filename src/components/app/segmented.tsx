import Link from "next/link";
import { cn } from "@/lib/utils";

/** Link-based segmented control: the choice lives in the URL. */
export function Segmented({ items, label }: { items: { href: string; label: React.ReactNode; active: boolean }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex h-8 items-center rounded-lg border bg-muted/60 p-0.5">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          role="tab"
          aria-selected={i.active}
          className={cn(
            "flex h-full items-center gap-1.5 rounded-md px-3 text-[13px] text-muted-foreground transition-colors duration-150 hover:text-foreground [&_svg]:size-3.5",
            i.active && "bg-background font-medium text-foreground ring-1 ring-border",
          )}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}
