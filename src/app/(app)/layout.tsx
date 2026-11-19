import { addDays, startOfDay } from "date-fns-jalali";
import { AppSidebar } from "@/components/app/app-sidebar";
import { CommandPalette } from "@/components/app/command-palette";
import { MobileBar } from "@/components/app/mobile-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  // Badge on «تسک‌ها»: the user's own tasks due today or overdue.
  const dueTasks = await db.task.count({ where: { assigneeId: user.id, doneAt: null, dueAt: { lt: addDays(startOfDay(new Date()), 1) } } });
  return (
    <CommandPalette role={user.role}>
      <SidebarProvider>
        <AppSidebar user={user} dueTasks={dueTasks} />
        <SidebarInset className="min-w-0">
          <MobileBar />
          <div className="flex flex-1 flex-col px-4 pt-4 pb-10 md:px-8 md:pt-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </CommandPalette>
  );
}
