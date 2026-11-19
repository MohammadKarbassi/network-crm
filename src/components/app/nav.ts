import { CalendarCheck, Kanban, LayoutDashboard, Megaphone, Target, UserCog, Users, Workflow } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { canManageTeam } from "@/lib/permissions";

export type NavItem = { href: string; label: string; icon: typeof Users; show?: (role: Role) => boolean };

// One source for the sidebar and the ⌘K palette.
export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "کار روزانه",
    items: [
      { href: "/", label: "داشبورد", icon: LayoutDashboard },
      { href: "/tasks", label: "تسک‌ها و تقویم", icon: CalendarCheck },
    ],
  },
  {
    label: "رکوردها",
    items: [
      { href: "/leads", label: "لیدها", icon: Target },
      { href: "/customers", label: "مشتری‌ها", icon: Users },
      { href: "/deals", label: "پایپ‌لاین فروش", icon: Kanban },
    ],
  },
  {
    label: "بازاریابی و تیم",
    items: [
      { href: "/campaigns", label: "کمپین‌ها", icon: Megaphone, show: canManageTeam },
      { href: "/automations", label: "اتوماسیون", icon: Workflow, show: canManageTeam },
      { href: "/team", label: "تیم فروش", icon: UserCog, show: canManageTeam },
    ],
  },
];

export const visibleNav = (role: Role) =>
  navGroups.map((g) => ({ ...g, items: g.items.filter((i) => !i.show || i.show(role)) })).filter((g) => g.items.length);
