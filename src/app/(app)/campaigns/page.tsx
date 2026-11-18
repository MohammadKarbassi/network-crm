import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { formatDateTime, leadStatusLabel, sourceLabel } from "@/lib/labels";
import { audienceSchema } from "@/lib/schemas";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/server/auth/session";
import { aiEnabled } from "@/server/ai";
import { db } from "@/server/db";
import { channelStatus } from "@/server/messaging";
import { getAssignableUsers } from "@/server/users";
import { CampaignFormDialog } from "./campaign-form-dialog";

export const metadata: Metadata = { title: "کمپین‌ها" };

export default async function CampaignsPage() {
  await requireUser(["ADMIN", "SALES_MANAGER"]);
  const [campaigns, counts, owners] = await Promise.all([
    db.campaign.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { createdBy: { select: { name: true } } } }),
    db.message.groupBy({ by: ["campaignId", "status"], where: { campaignId: { not: null } }, _count: true }),
    getAssignableUsers(),
  ]);
  const ownerName = new Map(owners.map((o) => [o.id, o.name]));
  const stat = (id: string, status: "QUEUED" | "SENT" | "FAILED") => counts.find((c) => c.campaignId === id && c.status === status)?._count ?? 0;
  const busy = campaigns.some((c) => c.status !== "DONE" || stat(c.id, "QUEUED") > 0);
  const allowlist = Boolean(process.env.MESSAGING_ALLOWLIST);

  return (
    <>
      <AutoRefresh active={busy} />
      <PageHeader title="کمپین‌ها" description="ارسال گروهی پیامک یا ایمیل به مشتری‌ها و لیدها، از طریق صف.">
        <CampaignFormDialog owners={owners} ready={channelStatus()} ai={aiEnabled()} />
      </PageHeader>
      {allowlist && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          حالت آزمایشی فعال است: پیام فقط به گیرنده‌های فهرست <code>MESSAGING_ALLOWLIST</code> ارسال می‌شود و بقیه «ناموفق» ثبت می‌شوند.
        </p>
      )}
      <Card className="py-0">
        {campaigns.length === 0 ? (
          <EmptyState icon={Megaphone} title="هنوز کمپینی ساخته نشده" description="مثلاً یک پیامک تخفیف برای همهٔ مشتری‌های اینستاگرام بفرستید." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کمپین</TableHead>
                <TableHead>کانال</TableHead>
                <TableHead>مخاطبان</TableHead>
                <TableHead className="text-end">ارسال‌شده</TableHead>
                <TableHead className="text-end">در صف</TableHead>
                <TableHead className="text-end">ناموفق</TableHead>
                <TableHead>زمان</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="tabular-nums">
              {campaigns.map((c) => {
                const a = audienceSchema.safeParse(c.audience).data;
                const audience = a
                  ? [
                      a.target === "customers" ? "مشتری‌ها" : "لیدها",
                      a.source && sourceLabel[a.source],
                      a.status && leadStatusLabel[a.status],
                      a.ownerId && ownerName.get(a.ownerId),
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "—";
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      <div className="max-w-80 truncate text-xs text-muted-foreground" title={c.body}>
                        {c.body}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.channel === "SMS" ? "پیامک" : "ایمیل"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{audience}</TableCell>
                    <TableCell className="text-end font-medium">{stat(c.id, "SENT").toLocaleString("fa-IR")}</TableCell>
                    <TableCell className="text-end text-muted-foreground">
                      {c.status === "DONE" ? stat(c.id, "QUEUED").toLocaleString("fa-IR") : "در حال آماده‌سازی…"}
                    </TableCell>
                    <TableCell className="text-end">
                      {stat(c.id, "FAILED") > 0 ? <span className="font-medium text-destructive">{stat(c.id, "FAILED").toLocaleString("fa-IR")}</span> : "۰"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{formatDateTime(c.createdAt)}</div>
                      <div className="text-xs text-muted-foreground">{c.createdBy?.name}</div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
