import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { RunStatus } from "@/generated/prisma/enums";
import { stepsSchema, triggerConfigSchema } from "@/lib/automation";
import { formatDateTime } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { DeleteAutomation } from "../automation-controls";
import { AutomationBuilder } from "../builder";

export const metadata: Metadata = { title: "اتوماسیون" };

const runStatus: Record<RunStatus, { label: string; className: string }> = {
  RUNNING: { label: "در جریان", className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  COMPLETED: { label: "کامل شد", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  FAILED: { label: "متوقف شد", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
};

type LogEntry = { at: string; note: string };

export default async function AutomationPage({ params }: PageProps<"/automations/[id]">) {
  await requireUser(["ADMIN", "SALES_MANAGER"]);
  const { id } = await params;
  const automation = await db.automation.findUnique({ where: { id }, include: { runs: { orderBy: { createdAt: "desc" }, take: 20 } } });
  if (!automation) notFound();

  // Name the lead/customer each run was for.
  const ctx = automation.runs.map((r) => r.context as { leadId?: string; customerId?: string });
  const [leads, customers] = await Promise.all([
    db.lead.findMany({ where: { id: { in: ctx.flatMap((c) => c.leadId ?? []) } }, select: { id: true, name: true } }),
    db.customer.findMany({ where: { id: { in: ctx.flatMap((c) => c.customerId ?? []) } }, select: { id: true, name: true } }),
  ]);
  const target = (c: (typeof ctx)[number]) =>
    c.leadId
      ? { href: `/leads/${c.leadId}`, name: leads.find((l) => l.id === c.leadId)?.name }
      : c.customerId
        ? { href: `/customers/${c.customerId}`, name: customers.find((x) => x.id === c.customerId)?.name }
        : null;

  return (
    <>
      <AutoRefresh active={automation.runs.some((r) => r.status === "RUNNING")} ms={5000} />
      <PageHeader back={{ href: "/automations", label: "اتوماسیون‌ها" }} title={automation.name}>
        <DeleteAutomation id={automation.id} name={automation.name} />
      </PageHeader>
      <AutomationBuilder
        id={automation.id}
        initial={{
          name: automation.name,
          trigger: automation.trigger,
          triggerConfig: triggerConfigSchema.parse(automation.triggerConfig),
          steps: stepsSchema.parse(automation.steps),
          isActive: automation.isActive,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>اجراهای اخیر</CardTitle>
        </CardHeader>
        <CardContent>
          {automation.runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">هنوز اجرا نشده. وقتی رویداد شروع رخ دهد، اجرا اینجا دیده می‌شود.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {automation.runs.map((r, i) => {
                const t = target(ctx[i]);
                return (
                  <li key={r.id} className="flex flex-col gap-2 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", runStatus[r.status].className)}>{runStatus[r.status].label}</span>
                      {t?.name ? (
                        <Link href={t.href} className="font-medium hover:underline">
                          {t.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">رکورد حذف شده</span>
                      )}
                      <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
                      {r.error && <span className="text-xs text-destructive">{r.error}</span>}
                    </div>
                    <ol className="flex flex-col gap-1 border-s ps-3 text-xs text-muted-foreground">
                      {(r.log as LogEntry[]).map((l, j) => (
                        <li key={j}>
                          {new Date(l.at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })} · {l.note}
                        </li>
                      ))}
                    </ol>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
