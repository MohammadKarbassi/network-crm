import { Plus } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import type { OwnerOption } from "@/components/app/owner-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/server/db";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskList } from "./task-list";

/** Open tasks linked to one customer or lead, with a quick-add button. */
export async function RelatedTasks({ link, assignees, defaultAssigneeId }: { link: { customerId?: string; leadId?: string }; assignees?: OwnerOption[]; defaultAssigneeId: string }) {
  const where: Prisma.TaskWhereInput = { ...link, doneAt: null };
  const tasks = await db.task.findMany({ where, orderBy: { dueAt: "asc" }, include: { assignee: { select: { name: true } } } });
  return (
    <Card className="h-fit gap-0 pb-0">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>تسک‌های باز</CardTitle>
        <TaskFormDialog
          link={link}
          assignees={assignees}
          defaultAssigneeId={defaultAssigneeId}
          trigger={
            <Button variant="outline" size="sm">
              <Plus /> تسک
            </Button>
          }
        />
      </CardHeader>
      {tasks.length ? (
        <div className="border-t">
          <TaskList
            tasks={tasks.map((t) => ({ ...t, assigneeName: t.assignee.name, customer: null, lead: null }))}
            assignees={assignees}
            showAssignee
          />
        </div>
      ) : (
        <CardContent className="pb-6 text-sm text-muted-foreground">تسک بازی ندارد.</CardContent>
      )}
    </Card>
  );
}
