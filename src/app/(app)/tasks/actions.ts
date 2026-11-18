"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, formToObject, invalid } from "@/lib/action-result";
import { canSeeAll } from "@/lib/permissions";
import { tehranDateTime } from "@/lib/schemas";
import { assignedTo, ownedBy } from "@/server/auth/scope";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";

const taskSchema = z.object({
  title: z.string({ error: "عنوان الزامی است." }).trim().min(2, "عنوان حداقل ۲ حرف باشد."),
  description: z.string().trim().optional(),
  dueDay: z.string({ error: "تاریخ را انتخاب کنید." }).regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ را انتخاب کنید."),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/, "ساعت معتبر نیست.").default("09:00"),
  assigneeId: z.string().optional(),
  customerId: z.string().optional(),
  leadId: z.string().optional(),
});

type Me = Awaited<ReturnType<typeof requireUser>>;

function refresh(task: { customerId?: string | null; leadId?: string | null }) {
  revalidatePath("/tasks");
  revalidatePath("/");
  if (task.customerId) revalidatePath(`/customers/${task.customerId}`);
  if (task.leadId) revalidatePath(`/leads/${task.leadId}`);
}

export async function saveTaskAction(id: string | null, fd: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const parsed = taskSchema.safeParse(formToObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const { dueDay, dueTime, assigneeId, customerId, leadId, ...rest } = parsed.data;

  // Reps plan their own work; managers can give a task to anyone active.
  const assignee = canSeeAll(me.role) ? (assigneeId ?? me.id) : me.id;
  if (assignee !== me.id && !(await db.user.findFirst({ where: { id: assignee, isActive: true } }))) {
    return { ok: false, error: "کارشناس انتخاب‌شده معتبر نیست." };
  }
  // A linked record must be one the user can see.
  if (customerId && !(await db.customer.findFirst({ where: { id: customerId, ...ownedBy(me) } }))) return { ok: false, error: "مشتری پیدا نشد." };
  if (leadId && !(await db.lead.findFirst({ where: { id: leadId, ...ownedBy(me) } }))) return { ok: false, error: "لید پیدا نشد." };

  const data = { ...rest, dueAt: tehranDateTime(dueDay, dueTime), assigneeId: assignee };
  if (id) {
    const existing = await db.task.findFirst({ where: { id, ...assignedTo(me) } });
    if (!existing) return { ok: false, error: "تسک پیدا نشد." };
    await db.task.update({ where: { id }, data });
    refresh(existing);
  } else {
    const task = await db.task.create({ data: { ...data, customerId, leadId, createdById: me.id } });
    refresh(task);
    id = task.id;
  }
  return { ok: true, id };
}

export async function toggleTaskAction(id: string, done: boolean): Promise<ActionResult> {
  const me = await requireUser();
  const task = await findTask(me, id);
  if (!task) return { ok: false, error: "تسک پیدا نشد." };
  await db.task.update({ where: { id }, data: { doneAt: done ? new Date() : null } });
  // Completed follow-ups show on the customer's or lead's timeline.
  if (done && (task.customerId || task.leadId)) {
    await db.activity.create({
      data: { type: "SYSTEM", body: `تسک «${task.title}» انجام شد.`, customerId: task.customerId, leadId: task.leadId, authorId: me.id },
    });
  }
  refresh(task);
  return { ok: true };
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  const me = await requireUser();
  const task = await findTask(me, id);
  if (!task) return { ok: false, error: "تسک پیدا نشد." };
  await db.task.delete({ where: { id } });
  refresh(task);
  return { ok: true };
}

const findTask = (me: Me, id: string) => db.task.findFirst({ where: { id, ...assignedTo(me) } });
