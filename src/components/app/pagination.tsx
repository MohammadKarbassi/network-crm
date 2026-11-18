import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Prev/next links that keep the current filters in the query string. */
export function Pagination({ page, pageCount, params }: { page: number; pageCount: number; params: Record<string, string | undefined> }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => `?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), page: String(p) } as Record<string, string>)}`;
  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <Button variant="outline" size="sm" asChild disabled={page <= 1}>
        {page > 1 ? <Link href={href(page - 1)}>قبلی</Link> : <span>قبلی</span>}
      </Button>
      <span className="text-muted-foreground">
        صفحه {page.toLocaleString("fa-IR")} از {pageCount.toLocaleString("fa-IR")}
      </span>
      <Button variant="outline" size="sm" asChild disabled={page >= pageCount}>
        {page < pageCount ? <Link href={href(page + 1)}>بعدی</Link> : <span>بعدی</span>}
      </Button>
    </div>
  );
}
