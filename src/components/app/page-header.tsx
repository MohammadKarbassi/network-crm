import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Sticky one-row page toolbar: optional breadcrumb, title, one muted line of context, actions on the end side.
 * Data starts right below it, no hero block.
 */
export function PageHeader({
  title,
  description,
  back,
  count,
  children,
}: {
  title: string;
  description?: string;
  count?: number;
  back?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="sticky top-13 z-10 -mx-4 -mt-4 border-b bg-background/92 px-4 backdrop-blur-md md:top-0 md:-mx-8 md:-mt-6 md:px-8">
      <div className="flex min-h-13 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
        <div className="flex min-w-0 items-baseline gap-x-2">
          {back && (
            <nav aria-label="مسیر" className="flex shrink-0 items-center gap-1 text-[13px] text-muted-foreground">
              <Link href={back.href} className="hover:text-foreground">
                {back.label}
              </Link>
              <ChevronLeft className="size-3.5 self-center" />
            </nav>
          )}
          <h1 className="truncate text-[16px] leading-7 font-semibold tracking-tight">{title}</h1>
          {count !== undefined && <span className="text-[13px] text-muted-foreground tabular-nums">{count.toLocaleString("fa-IR")}</span>}
          {description && <p className="hidden truncate text-[13px] text-muted-foreground md:block">{description}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
