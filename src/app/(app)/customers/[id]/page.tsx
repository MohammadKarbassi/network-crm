import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { dealStageLabel, formatDate, formatToman, sourceLabel } from "@/lib/labels";
import { canSeeAll } from "@/lib/permissions";
import { ActivityForm } from "@/components/app/activity-form";
import { AiSummaryCard } from "@/components/app/ai-summary-card";
import { DeleteButton } from "@/components/app/delete-button";
import { PageHeader } from "@/components/app/page-header";
import { SendMessageDialog } from "@/components/app/send-message-dialog";
import { Timeline } from "@/components/app/timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ownedBy } from "@/server/auth/scope";
import { requireUser } from "@/server/auth/session";
import { aiEnabled } from "@/server/ai";
import { db } from "@/server/db";
import { channelStatus } from "@/server/messaging";
import { getAssignableUsers } from "@/server/users";
import { analyzeNoteAction, applyNoteAction, summarizeAction } from "../../ai/actions";
import { sendMessageAction } from "../../messages/actions";
import { addCustomerActivityAction, deleteCustomerAction } from "../actions";
import { DealFormDialog } from "../../deals/deal-form-dialog";
import { RelatedTasks } from "../../tasks/related-tasks";
import { CustomerFormDialog } from "../customer-form-dialog";

export const metadata: Metadata = { title: "مشتری" };

export default async function CustomerPage({ params }: PageProps<"/customers/[id]">) {
  const me = await requireUser();
  const { id } = await params;
  const customer = await db.customer.findFirst({
    where: { id, ...ownedBy(me) },
    include: {
      owner: { select: { name: true } },
      deals: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!customer) notFound();
  const ai = aiEnabled();
  const owners = canSeeAll(me.role) ? await getAssignableUsers() : undefined;

  const info: [string, React.ReactNode][] = [
    ["شرکت", customer.company],
    ["تلفن", customer.phone && <a href={`tel:${customer.phone}`} dir="ltr">{customer.phone}</a>],
    ["ایمیل", customer.email && <a href={`mailto:${customer.email}`} dir="ltr">{customer.email}</a>],
    ["منبع آشنایی", sourceLabel[customer.source]],
    ["کارشناس مسئول", customer.owner?.name ?? "بدون تخصیص"],
    ["تاریخ ثبت", formatDate(customer.createdAt)],
  ];

  return (
    <>
      <PageHeader back={{ href: "/customers", label: "مشتری‌ها" }} title={customer.name} description={customer.company ?? undefined}>
        <SendMessageDialog
          action={sendMessageAction.bind(null, { customerId: customer.id })}
          contacts={{ phone: customer.phone, email: customer.email }}
          ready={channelStatus()}
          ai={ai}
        />
        <CustomerFormDialog
          customer={customer}
          owners={owners}
          trigger={
            <Button variant="outline">
              <Pencil /> ویرایش
            </Button>
          }
        />
        <DeleteButton
          name={customer.name}
          description="معامله‌ها، تسک‌ها و یادداشت‌های این مشتری هم حذف می‌شوند. این کار برگشت‌پذیر نیست."
          action={deleteCustomerAction.bind(null, customer.id)}
        />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="flex flex-col gap-6">
        {ai && <AiSummaryCard summarize={summarizeAction.bind(null, { customerId: customer.id })} />}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>اطلاعات</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              {info.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[7rem_1fr] gap-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 break-words">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            {customer.notes && <p className="mt-4 whitespace-pre-wrap border-t pt-4 text-sm">{customer.notes}</p>}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>معامله‌ها</CardTitle>
            <DealFormDialog
              customerId={customer.id}
              owners={owners}
              trigger={
                <Button variant="outline" size="sm">
                  <Plus /> معامله
                </Button>
              }
            />
          </CardHeader>
          <CardContent>
            {customer.deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">هنوز معامله‌ای ثبت نشده.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {customer.deals.map((d) => (
                  <li key={d.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{formatToman(Number(d.amount))}</p>
                    </div>
                    <Badge variant="secondary">{dealStageLabel[d.stage]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <RelatedTasks link={{ customerId: customer.id }} assignees={owners} defaultAssigneeId={customer.ownerId ?? me.id} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>فعالیت‌ها</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <ActivityForm
              action={addCustomerActivityAction.bind(null, customer.id)}
              ai={ai ? { analyze: analyzeNoteAction.bind(null, { customerId: customer.id }), apply: applyNoteAction.bind(null, { customerId: customer.id }) } : undefined}
            />
            <Timeline items={customer.activities} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
