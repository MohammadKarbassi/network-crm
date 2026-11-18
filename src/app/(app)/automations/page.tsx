import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus, Workflow } from "lucide-react";
import { automationTemplates, stepSummary, stepsSchema, triggerSummary } from "@/lib/automation";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { ActiveSwitch } from "./automation-controls";

export const metadata: Metadata = { title: "اتوماسیون" };

export default async function AutomationsPage() {
  await requireUser(["ADMIN", "SALES_MANAGER"]);
  const [automations, runCounts] = await Promise.all([
    db.automation.findMany({ orderBy: { createdAt: "desc" } }),
    db.automationRun.groupBy({ by: ["automationId", "status"], _count: true }),
  ]);
  const count = (id: string, status?: string) =>
    runCounts.filter((r) => r.automationId === id && (!status || r.status === status)).reduce((s, r) => s + r._count, 0);

  return (
    <>
      <PageHeader title="اتوماسیون" description="کارهای تکراری را خودکار کنید: وقتی اتفاقی می‌افتد، پیامک، ایمیل یا تسک به‌موقع ساخته شود.">
        <Button asChild>
          <Link href="/automations/new">
            <Plus /> اتوماسیون خالی
          </Link>
        </Button>
      </PageHeader>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">شروع سریع با الگوهای آماده</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {automationTemplates.map((t, i) => (
            <Card key={t.name} className="gap-3">
              <CardHeader>
                <CardTitle>{t.name}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/automations/new?template=${i}`}>
                    استفاده از الگو <ArrowLeft />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">اتوماسیون‌های شما</h2>
        {automations.length === 0 ? (
          <Card>
            <EmptyState icon={Workflow} title="هنوز اتوماسیونی نساخته‌اید" description="از یکی از الگوهای بالا شروع کنید." />
          </Card>
        ) : (
          automations.map((a) => {
            const steps = stepsSchema.safeParse(a.steps).data ?? [];
            return (
              <Card key={a.id} className="flex-row flex-wrap items-center gap-4 px-6">
                <ActiveSwitch id={a.id} isActive={a.isActive} name={a.name} />
                <div className="min-w-0 flex-1">
                  <Link href={`/automations/${a.id}`} className="font-semibold hover:underline">
                    {a.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{triggerSummary(a.trigger, a.triggerConfig)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
                    {steps.map((s, i) => (
                      <Badge key={i} variant="secondary">
                        {stepSummary(s)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 text-center text-xs text-muted-foreground tabular-nums">
                  <div>
                    <div className="text-lg font-semibold text-foreground">{count(a.id).toLocaleString("fa-IR")}</div>
                    اجرا
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground">{count(a.id, "RUNNING").toLocaleString("fa-IR")}</div>
                    در جریان
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground">{count(a.id, "COMPLETED").toLocaleString("fa-IR")}</div>
                    کامل
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </section>
    </>
  );
}
