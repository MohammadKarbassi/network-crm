import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatToman } from "@/lib/labels";
import { canSeeAll } from "@/lib/permissions";
import { OwnerSelect } from "@/components/app/owner-select";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { ownedBy } from "@/server/auth/scope";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getAssignableUsers } from "@/server/users";
import { Board, type BoardDeal } from "./board";
import { DealFormDialog } from "./deal-form-dialog";

export const metadata: Metadata = { title: "پایپ‌لاین فروش" };

export default async function DealsPage({ searchParams }: PageProps<"/deals">) {
  const me = await requireUser();
  const sp = await searchParams;
  const manager = canSeeAll(me.role);
  const owner = manager && typeof sp.owner === "string" && sp.owner !== "all" ? sp.owner : undefined;

  const [deals, customers, owners] = await Promise.all([
    db.deal.findMany({
      where: { ...ownedBy(me), ...(owner && { ownerId: owner === "none" ? null : owner }) },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      include: { customer: { select: { name: true } }, owner: { select: { name: true } } },
    }),
    // shortcut: loads every visible customer into the picker; switch to a searchable combobox past a few hundred.
    db.customer.findMany({ where: ownedBy(me), select: { id: true, name: true }, orderBy: { name: "asc" } }),
    manager ? getAssignableUsers() : Promise.resolve(undefined),
  ]);

  const board: BoardDeal[] = deals.map((d) => ({
    id: d.id,
    title: d.title,
    amount: Number(d.amount), // Toman values stay far below Number.MAX_SAFE_INTEGER
    stage: d.stage,
    customerId: d.customerId,
    customerName: d.customer.name,
    ownerId: d.ownerId,
    ownerName: d.owner?.name ?? null,
    expectedCloseAt: d.expectedCloseAt,
  }));
  const open = board.filter((d) => d.stage !== "WON" && d.stage !== "LOST");

  return (
    <>
      <PageHeader count={open.length}
        title="پایپ‌لاین فروش"
        description={`${open.length.toLocaleString("fa-IR")} معامله باز به ارزش ${formatToman(open.reduce((s, d) => s + d.amount, 0))}. کارت‌ها را بین مراحل جابه‌جا کنید.`}
      >
        {owners && (
          <form className="flex gap-2">
            <div className="w-44">
              <OwnerSelect owners={owners} mode="filter" name="owner" defaultValue={owner} />
            </div>
            <Button type="submit" variant="secondary">
              اعمال
            </Button>
            {owner && (
              <Button variant="ghost" asChild>
                <Link href="/deals">همه</Link>
              </Button>
            )}
          </form>
        )}
        {customers.length > 0 ? (
          <DealFormDialog
            customers={customers}
            owners={owners}
            trigger={
              <Button>
                <Plus /> معامله جدید
              </Button>
            }
          />
        ) : (
          <Button asChild>
            <Link href="/customers">اول یک مشتری ثبت کنید</Link>
          </Button>
        )}
      </PageHeader>
      <Board deals={board} owners={owners} openId={typeof sp.open === "string" ? sp.open : undefined} />
    </>
  );
}
