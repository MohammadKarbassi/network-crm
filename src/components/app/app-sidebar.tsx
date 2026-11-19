"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, LogOut, Search } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { roleLabel } from "@/lib/labels";
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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useOpenPalette, useShortcutLabel } from "./command-palette";
import { Logo, LogoMark } from "./logo";
import { visibleNav } from "./nav";

export function AppSidebar({ user, dueTasks }: { user: { name: string; phone: string; role: Role }; dueTasks: number }) {
  const pathname = usePathname();
  const openPalette = useOpenPalette();
  const shortcut = useShortcutLabel();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="gap-3 px-3 pt-4">
        <Link href="/" className="flex h-8 items-center px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0" aria-label="نتورک، داشبورد">
          <Logo className="group-data-[collapsible=icon]:hidden" />
          <LogoMark className="hidden size-6 group-data-[collapsible=icon]:block" />
        </Link>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={openPalette}
              tooltip={`جستجو (${shortcut})`}
              className="border bg-background text-muted-foreground hover:bg-background hover:text-foreground"
            >
              <Search />
              <span>جستجو…</span>
              <kbd dir="ltr" className="ms-auto rounded border bg-muted px-1.5 font-sans text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden">
                {shortcut}
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1">
        {visibleNav(user.role).map((group) => (
          <SidebarGroup key={group.label} className="py-1.5">
            <SidebarGroupLabel className="text-[11.5px] font-medium text-muted-foreground/80">{group.label}</SidebarGroupLabel>
            <SidebarMenu className="gap-px">
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    className="h-8 text-[13.5px] text-sidebar-foreground data-[active=true]:font-semibold data-[active=true]:text-foreground [&>svg]:text-muted-foreground data-[active=true]:[&>svg]:text-primary"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.href === "/tasks" && dueTasks > 0 && (
                    <SidebarMenuBadge className="rounded-full bg-primary/12 px-1.5 text-[11px] text-brand-ink" aria-label={`${dueTasks} تسک امروز و عقب‌افتاده`}>
                      {dueTasks.toLocaleString("fa-IR")}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="h-11">
                  <Avatar className="size-7 rounded-md">
                    <AvatarFallback className="rounded-md bg-brand-soft text-xs font-semibold text-brand-ink">{user.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start leading-tight">
                    <span className="truncate text-[13px] font-medium">{user.name}</span>
                    <span className="truncate text-[11.5px] text-muted-foreground">{roleLabel[user.role]}</span>
                  </div>
                  <ChevronsUpDown className="ms-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="font-medium">{user.name}</div>
                  <div dir="ltr" className="text-end text-xs text-muted-foreground tabular-nums">
                    {user.phone}
                  </div>
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
