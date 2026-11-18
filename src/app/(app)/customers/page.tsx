import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import type { Source } from "@/generated/prisma/enums";
import { formatDate, sourceLabel } from "@/lib/labels";
import { canSeeAll } from "@/lib/permissions";
import { EmptyState } from "@/components/app/empty-state";
import { OwnerSelect } from "@/components/app/owner-select";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { EnumSelect } from "@/components/app/enum-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ownedBy } from "@/server/auth/scope";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getAssignableUsers } from "@/server/users";
import { CustomerFormDialog } from "./customer-form-dialog";

export const metadata: Metadata = { title: "مشتری‌ها" };
const PAGE_SIZE = 20;

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  const me = await requireUser();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const source = typeof sp.source === "string" && sp.source in sourceLabel ? (sp.source as Source) : undefined;
  const owner = typeof sp.owner === "string" && sp.owner !== "all" ? sp.owner : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const manager = canSeeAll(me.role);

  const where: Prisma.CustomerWhereInput = {
    ...ownedBy(me),
    ...(source && { source }),
    ...(manager && owner && { ownerId: owner === "none" ? null : owner }),
    ...(q && {
      OR: ["name", "phone", "email", "company"].map((f) => ({ [f]: { contains: q, mode: "insensitive" } })),
    }),
  };

  const [customers, total, owners] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { owner: { select: { name: true } } },
    }),
    db.customer.count({ where }),
    manager ? getAssignableUsers() : Promise.resolve(undefined),
  ]);
  const filtered = Boolean(q || source || owner);

  return (
    <>
      <PageHeader title="مشتری‌ها" description={`${total.toLocaleString("fa-IR")} مشتری${manager ? "" : " تخصیص‌یافته به شما"}`}>
        <CustomerFormDialog
          owners={owners}
          trigger={
            <Button>
              <Plus /> مشتری جدید
            </Button>
          }
        />
      </PageHeader>

      {/* Plain GET form: filters live in the URL, so they survive refresh and can be shared. */}
      <form className="grid gap-2 sm:grid-cols-[1fr_12rem_12rem_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="جستجوی نام، تلفن، ایمیل یا شرکت" className="ps-9" aria-label="جستجو" />
        </div>
        <EnumSelect name="source" labels={sourceLabel} defaultValue={source} allLabel="همه منابع" ariaLabel="منبع" />
        {owners ? <OwnerSelect owners={owners} mode="filter" name="owner" defaultValue={owner} /> : <div className="hidden sm:block" />}
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            اعمال
          </Button>
          {filtered && (
            <Button variant="ghost" asChild>
              <Link href="/customers">حذف فیلتر</Link>
            </Button>
          )}
        </div>
      </form>

      <Card className="py-0">
        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtered ? "مشتری‌ای با این فیلترها پیدا نشد" : "هنوز مشتری‌ای ثبت نشده"}
            description={filtered ? "فیلترها را تغییر دهید." : "اولین مشتری را اضافه کنید."}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>شرکت</TableHead>
                <TableHead>تلفن</TableHead>
                <TableHead>منبع</TableHead>
                {manager && <TableHead>کارشناس</TableHead>}
                <TableHead>تاریخ ثبت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id} className="relative">
                  <TableCell className="font-medium">
                    {/* The ::after overlay makes the whole row clickable while keeping a real link. */}
                    <Link href={`/customers/${c.id}`} className="after:absolute after:inset-0 hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell>{c.company ?? "—"}</TableCell>
                  <TableCell dir="ltr" className="text-end">{c.phone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sourceLabel[c.source]}</Badge>
                  </TableCell>
                  {manager && <TableCell>{c.owner?.name ?? <span className="text-muted-foreground">بدون تخصیص</span>}</TableCell>}
                  <TableCell>{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} params={{ q, source, owner }} />
    </>
  );
}
