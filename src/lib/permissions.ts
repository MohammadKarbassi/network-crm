import type { Role } from "@/generated/prisma/enums";

// Admin and sales manager see everyone's records; a sales rep only sees records assigned to them.
export const canSeeAll = (role: Role) => role === "ADMIN" || role === "SALES_MANAGER";
// Team management: admin manages every user, a sales manager manages sales reps.
export const canManageTeam = (role: Role) => role === "ADMIN" || role === "SALES_MANAGER";
export const isAdmin = (role: Role) => role === "ADMIN";
