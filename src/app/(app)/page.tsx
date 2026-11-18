import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { dealStageLabel, formatToman, roleLabel, sourceLabel } from "@/lib/labels";
import { canSeeAll } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { BarList } from "@/components/dashboard/bar-list";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { compactFa, StatTile } from "@/components/dashboard/stat-tile";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/server/auth/session";
import { getLeadSources, getMonthlyRevenue, getMyOpenTasks, getPipeline, getStats, getTeamPerformance, type Period } from "@/server/dashboard";
import { TaskList } from "./tasks/task-list";

export const metadata: Metadata = { title: "داشبورد" };

const periodText: Record<Period, { now: string; prev: string }> = {
  week: { now: "این هفته", prev: "هفتهٔ قبل" },
  month: { now: "این ماه", prev: "ماه قبل" },
};

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const me = await requireUser();
  const sp = await searchParams;
  const period: Period = sp.period === "week" ? "week" : "month";
  const manager = canSeeAll(me.role);
  const t = periodText[period];

  const [{ current, previous }, monthly, pipeline, sources, team, myTasks] = await Promise.all([
    getStats(me, period),
    getMonthlyRevenue(me),
    getPipeline(me),
    getLeadSources(me, period),
    manager ? getTeamPerformance(period) : Promise.resolve([]),
    getMyOpenTasks(me),
  ]);
  const openValue = pipeline.reduce((s, p) => s + p.value, 0);
  const openCount = pipeline.reduce((s, p) => s + p.count, 0);

  return (
    <>
      <PageHeader title={`سلام ${me.name}`} description={manager ? "نمای کلی فروش تیم" : "نمای کار و فروش شما"}>
        <div className="inline-flex rounded-lg border p-0.5" role="tablist" aria-label="بازهٔ زمانی">
          {(["week", "month"] as const).map((p) => (
            <Link
              key={p}
              href={`?period=${p}`}
              role="tab"
              aria-selected={period === p}
              className={cn("rounded-md px-3 py-1.5 text-sm", period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {periodText[p].now}
            </Link>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile hero label={`فروش ${t.now}`} value={formatToman(current.revenue)} current={current.revenue} previous={previous.revenue} periodLabel={t.prev} />
        <StatTile label="معامله موفق" value={current.wonCount.toLocaleString("fa-IR")} current={current.wonCount} previous={previous.wonCount} periodLabel={t.prev} />
        <StatTile label="لید جدید" value={current.leads.toLocaleString("fa-IR")} current={current.leads} previous={previous.leads} periodLabel={t.prev} />
        {manager ? (
          <StatTile label="مشتری جدید" value={current.customers.toLocaleString("fa-IR")} current={current.customers} previous={previous.customers} periodLabel={t.prev} />
        ) : (
          <StatTile label="معامله باز" value={openCount.toLocaleString("fa-IR")} />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader>
            <CardTitle>فروش ماهانه</CardTitle>
            <CardDescription>مبلغ معامله‌های موفق در ۶ ماه اخیر (میلیون تومان)</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={monthly} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>پایپ‌لاین باز</CardTitle>
            <CardDescription>
              {openCount.toLocaleString("fa-IR")} معامله به ارزش {formatToman(openValue)}
              {current.winRate !== null && ` · نرخ موفقیت ${t.now}: ${Math.round(current.winRate * 100).toLocaleString("fa-IR")}٪`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              empty="معامله بازی وجود ندارد."
              rows={pipeline.map((p) => ({
                label: dealStageLabel[p.stage],
                value: p.value,
                display: compactFa(p.value),
                detail: `${p.count.toLocaleString("fa-IR")} معامله · ${formatToman(p.value)}`,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[24rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>منبع لیدهای {t.now}</CardTitle>
            <CardDescription>لیدها از کجا آمده‌اند</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              empty={`${t.now} لیدی ثبت نشده.`}
              rows={sources.map((s) => ({ label: sourceLabel[s.source], value: s.count, display: s.count.toLocaleString("fa-IR") }))}
            />
          </CardContent>
        </Card>

        {manager ? (
          <Card className="gap-0 pb-0">
            <CardHeader className="pb-4">
              <CardTitle>عملکرد تیم {t.now}</CardTitle>
              <CardDescription>مرتب بر اساس فروش</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کارشناس</TableHead>
                  <TableHead className="text-end">لید جدید</TableHead>
                  <TableHead className="text-end">موفق</TableHead>
                  <TableHead className="text-end">فروش (تومان)</TableHead>
                  <TableHead className="text-end">پایپ‌لاین باز</TableHead>
                  <TableHead className="text-end">تسک عقب‌افتاده</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {team.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{roleLabel[u.role]}</div>
                    </TableCell>
                    <TableCell className="text-end">{u.leads.toLocaleString("fa-IR")}</TableCell>
                    <TableCell className="text-end">{u.wonCount.toLocaleString("fa-IR")}</TableCell>
                    <TableCell className="text-end font-medium">{u.revenue.toLocaleString("fa-IR")}</TableCell>
                    <TableCell className="text-end">
                      {u.openCount.toLocaleString("fa-IR")}
                      {u.openValue > 0 && <span className="text-xs text-muted-foreground"> ({compactFa(u.openValue)})</span>}
                    </TableCell>
                    <TableCell className={cn("text-end", u.overdueTasks > 0 && "font-medium text-destructive")}>{u.overdueTasks.toLocaleString("fa-IR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="gap-0 pb-0">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>کارهای امروز</CardTitle>
                <CardDescription>تسک‌های امروز و عقب‌افتاده</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/tasks">همهٔ تسک‌ها</Link>
              </Button>
            </CardHeader>
            {myTasks.length ? (
              <div className="border-t">
                <TaskList tasks={myTasks.map((x) => ({ ...x, assigneeName: x.assignee.name }))} />
              </div>
            ) : (
              <EmptyState icon={CheckCircle2} title="کاری برای امروز نمانده" />
            )}
          </Card>
        )}
      </div>
    </>
  );
}
