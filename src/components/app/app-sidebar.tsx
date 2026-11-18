"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, ChevronsUpDown, Kanban, LayoutDashboard, LogOut, Megaphone, Target, Workflow, UserCog, Users } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { roleLabel } from "@/lib/labels";
import { canManageTeam } from "@/lib/permissions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type NavItem = { href: string; label: string; icon: typeof Users; show?: (role: Role) => boolean };

const nav: NavItem[] = [
  { href: "/", label: "داشبورد", icon: LayoutDashboard },
  { href: "/leads", label: "لیدها", icon: Target },
  { href: "/customers", label: "مشتری‌ها", icon: Users },
  { href: "/deals", label: "پایپ‌لاین فروش", icon: Kanban },
  { href: "/tasks", label: "تسک‌ها و تقویم", icon: CalendarCheck },
  { href: "/campaigns", label: "کمپین‌ها", icon: Megaphone, show: canManageTeam },
  { href: "/automations", label: "اتوماسیون", icon: Workflow, show: canManageTeam },
  { href: "/team", label: "تیم فروش", icon: UserCog, show: canManageTeam },
];

export function AppSidebar({ user }: { user: { name: string; phone: string; role: Role } }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">ن</div>
                <div className="grid leading-tight">
                  <span className="font-semibold">نتورک</span>
                  <span className="text-xs text-muted-foreground">مدیریت ارتباط با مشتری</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {nav
              .filter((item) => !item.show || item.show(user.role))
              .map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-8">
                    <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{roleLabel[user.role]}</span>
                  </div>
                  <ChevronsUpDown className="ms-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="font-medium">{user.name}</div>
                  <div dir="ltr" className="text-end text-xs text-muted-foreground">{user.phone}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form action="/logout" method="post">
                  <DropdownMenuItem asChild variant="destructive">
                    <button type="submit" className="w-full">
                      <LogOut />
                      خروج
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
