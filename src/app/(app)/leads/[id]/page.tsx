import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { formatDate, sourceLabel } from "@/lib/labels";
import { canSeeAll } from "@/lib/permissions";
import { ActivityForm } from "@/components/app/activity-form";
import { AiSummaryCard } from "@/components/app/ai-summary-card";
import { DeleteButton } from "@/components/app/delete-button";
import { PageHeader } from "@/components/app/page-header";
import { SendMessageDialog } from "@/components/app/send-message-dialog";
import { LeadStatusBadge, PriorityBadge } from "@/components/app/status-badges";
import { Timeline } from "@/components/app/timeline";
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
import { addLeadActivityAction, deleteLeadAction } from "../actions";
import { RelatedTasks } from "../../tasks/related-tasks";
import { LeadFormDialog } from "../lead-form-dialog";
import { LeadControls } from "./lead-controls";

export const metadata: Metadata = { title: "لید" };

export default async function LeadPage({ params }: PageProps<"/leads/[id]">) {
  const me = await requireUser();
  const { id } = await params;
  const lead = await db.lead.findFirst({
    where: { id, ...ownedBy(me) },
    include: {
      owner: { select: { name: true } },
      activities: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!lead) notFound();
  const ai = aiEnabled();
  const converted = lead.status === "CONVERTED";
  const owners = canSeeAll(me.role) && !converted ? await getAssignableUsers() : undefined;

  const info: [string, React.ReactNode][] = [
    ["وضعیت", <LeadStatusBadge key="s" status={lead.status} />],
    ["اولویت", <PriorityBadge key="p" priority={lead.priority} />],
    ["شرکت", lead.company],
    ["تلفن", lead.phone && <a href={`tel:${lead.phone}`} dir="ltr">{lead.phone}</a>],
    ["ایمیل", lead.email && <a href={`mailto:${lead.email}`} dir="ltr">{lead.email}</a>],
    ["منبع", sourceLabel[lead.source]],
    ["کارشناس مسئول", lead.owner?.name ?? "بدون تخصیص"],
    ["تاریخ ثبت", formatDate(lead.createdAt)],
  ];

  return (
    <>
      <PageHeader back={{ href: "/leads", label: "لیدها" }} title={lead.name} description={lead.company ?? undefined}>
        <SendMessageDialog
          action={sendMessageAction.bind(null, { leadId: lead.id })}
          contacts={{ phone: lead.phone, email: lead.email }}
          ready={channelStatus()}
          ai={ai}
        />
        {!converted && (
          <>
            <LeadControls id={lead.id} status={lead.status} />
            <LeadFormDialog
              lead={lead}
              owners={owners}
              trigger={
                <Button variant="outline">
                  <Pencil /> ویرایش
                </Button>
              }
            />
          </>
        )}
        <DeleteButton
          name={lead.name}
          description={converted ? "مشتریِ ساخته‌شده از این لید و تاریخچه‌اش باقی می‌ماند." : "یادداشت‌ها و تسک‌های این لید هم حذف می‌شوند. این کار برگشت‌پذیر نیست."}
          action={deleteLeadAction.bind(null, lead.id)}
        />
      </PageHeader>

      {converted && lead.customerId && (
        <Card className="flex-row items-center justify-between gap-4 border-amber-300 bg-amber-50 px-6 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm">این لید به مشتری تبدیل شده است و از این پس پیگیری‌ها در صفحه مشتری انجام می‌شود.</p>
          <Button variant="outline" asChild>
            <Link href={`/customers/${lead.customerId}`}>
              صفحه مشتری <ArrowLeft />
            </Link>
          </Button>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="flex flex-col gap-6">
        {ai && <AiSummaryCard summarize={summarizeAction.bind(null, { leadId: lead.id })} />}
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
            {lead.notes && <p className="mt-4 whitespace-pre-wrap border-t pt-4 text-sm">{lead.notes}</p>}
          </CardContent>
        </Card>
        {!converted && <RelatedTasks link={{ leadId: lead.id }} assignees={owners} defaultAssigneeId={lead.ownerId ?? me.id} />}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>فعالیت‌ها</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {!converted && <ActivityForm
              action={addLeadActivityAction.bind(null, lead.id)}
              ai={ai ? { analyze: analyzeNoteAction.bind(null, { leadId: lead.id }), apply: applyNoteAction.bind(null, { leadId: lead.id }) } : undefined}
            />}
            <Timeline items={lead.activities} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
