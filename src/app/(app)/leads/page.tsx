import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Target } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import type { LeadStatus, Priority, Source } from "@/generated/prisma/enums";
import { formatDate, leadStatusLabel, priorityLabel, sourceLabel } from "@/lib/labels";
import { scoreLead } from "@/lib/lead-score";
import { canSeeAll } from "@/lib/permissions";
import { EmptyState } from "@/components/app/empty-state";
import { EnumSelect } from "@/components/app/enum-select";
import { OwnerSelect } from "@/components/app/owner-select";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { LeadStatusBadge, PriorityBadge, ScoreBadge } from "@/components/app/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ownedBy } from "@/server/auth/scope";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getAssignableUsers } from "@/server/users";
import { LeadFormDialog } from "./lead-form-dialog";

export const metadata: Metadata = { title: "لیدها" };
const PAGE_SIZE = 20;

const pick = <T extends string>(v: unknown, labels: Record<T, string>) =>
  typeof v === "string" && v in labels ? (v as T) : undefined;

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const me = await requireUser();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = pick<LeadStatus>(sp.status, leadStatusLabel);
  const priority = pick<Priority>(sp.priority, priorityLabel);
  const source = pick<Source>(sp.source, sourceLabel);
  const owner = typeof sp.owner === "string" && sp.owner !== "all" ? sp.owner : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const manager = canSeeAll(me.role);

  const where: Prisma.LeadWhereInput = {
    ...ownedBy(me),
    // Converted leads live on as customers; hide them unless asked for.
    status: status ?? { not: "CONVERTED" },
    ...(priority && { priority }),
    ...(source && { source }),
    ...(manager && owner && { ownerId: owner === "none" ? null : owner }),
    ...(q && { OR: ["name", "phone", "email", "company"].map((f) => ({ [f]: { contains: q, mode: "insensitive" } })) }),
  };

  const [leads, total, owners] = await Promise.all([
    db.lead.findMany({
      where,
      // Enum order is LOW < MEDIUM < HIGH, so desc puts urgent leads first.
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { owner: { select: { name: true } } },
    }),
    db.lead.count({ where }),
    manager ? getAssignableUsers() : Promise.resolve(undefined),
  ]);
  const filtered = Boolean(q || status || priority || source || owner);

  // Inputs for the rule-based score: human interactions per lead (system events don't count).
  const engagement = await db.activity.groupBy({
    by: ["leadId"],
    where: { leadId: { in: leads.map((l) => l.id) }, type: { in: ["NOTE", "CALL", "MEETING", "SMS", "EMAIL"] } },
    _count: true,
    _max: { createdAt: true },
  });
  const scoreOf = (l: (typeof leads)[number]) => {
    const e = engagement.find((x) => x.leadId === l.id);
    return scoreLead({ ...l, interactions: e?._count ?? 0, lastInteractionAt: e?._max.createdAt ?? null });
  };

  return (
    <>
      <PageHeader count={total} title="لیدها" description="مشتریان بالقوه‌ای که هنوز خرید نکرده‌اند. لید واجد شرایط را به مشتری تبدیل کنید.">
        <LeadFormDialog
          owners={owners}
          trigger={
            <Button>
              <Plus /> لید جدید
            </Button>
          }
        />
      </PageHeader>

      <form className="grid grid-cols-2 gap-2 lg:grid-cols-[1fr_10rem_9rem_10rem_11rem_auto]">
        <div className="relative col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="جستجوی نام، تلفن، ایمیل یا شرکت" className="ps-9" aria-label="جستجو" />
        </div>
        <EnumSelect name="status" labels={leadStatusLabel} defaultValue={status} allLabel="وضعیت‌های فعال" ariaLabel="وضعیت" />
        <EnumSelect name="priority" labels={priorityLabel} defaultValue={priority} allLabel="همه اولویت‌ها" ariaLabel="اولویت" />
        <EnumSelect name="source" labels={sourceLabel} defaultValue={source} allLabel="همه منابع" ariaLabel="منبع" />
        {owners ? <OwnerSelect owners={owners} mode="filter" name="owner" defaultValue={owner} /> : <div className="hidden lg:block" />}
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            اعمال
          </Button>
          {filtered && (
            <Button variant="ghost" asChild>
              <Link href="/leads">حذف فیلتر</Link>
            </Button>
          )}
        </div>
      </form>

      <Card className="py-0">
        {leads.length === 0 ? (
          <EmptyState
            icon={Target}
            title={filtered ? "لیدی با این فیلترها پیدا نشد" : "هنوز لیدی ثبت نشده"}
            description={filtered ? "فیلترها را تغییر دهید." : "هر کسی که به محصول شما علاقه نشان داده را اینجا ثبت کنید."}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>اولویت</TableHead>
                <TableHead>امتیاز</TableHead>
                <TableHead>منبع</TableHead>
                <TableHead>تلفن</TableHead>
                {manager && <TableHead>کارشناس</TableHead>}
                <TableHead>تاریخ ثبت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id} className="relative">
                  <TableCell className="font-medium">
                    <Link href={`/leads/${l.id}`} className="after:absolute after:inset-0 hover:underline">
                      {l.name}
                    </Link>
                    {l.company && <div className="text-xs font-normal text-muted-foreground">{l.company}</div>}
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge status={l.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={l.priority} />
                  </TableCell>
                  <TableCell>
                    <ScoreBadge {...scoreOf(l)} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sourceLabel[l.source]}</Badge>
                  </TableCell>
                  <TableCell dir="ltr" className="text-end">{l.phone ?? "—"}</TableCell>
                  {manager && <TableCell>{l.owner?.name ?? <span className="text-muted-foreground">بدون تخصیص</span>}</TableCell>}
                  <TableCell>{formatDate(l.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} params={{ q, status, priority, source, owner }} />
    </>
  );
}
