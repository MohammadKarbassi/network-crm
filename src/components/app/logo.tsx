import { cn } from "@/lib/utils";

/** «نتورک» mark: three linked nodes, the smallest picture of a network. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary-foreground/70">
        <path d="M10 21.5 16 10.5M16 10.5l6 11M10 21.5h12" />
      </g>
      <g className="fill-primary-foreground">
        <circle cx="16" cy="10.5" r="3" />
        <circle cx="10" cy="21.5" r="3" />
        <circle cx="22" cy="21.5" r="3" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[15px] font-bold tracking-tight">نتورک</span>
    </span>
  );
}
