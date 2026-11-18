import "server-only";
import { canSeeAll } from "@/lib/permissions";
import type { CurrentUser } from "./session";

/** Prisma `where` fragment that limits ownable records (customers, leads, deals) to what the user may see. */
export const ownedBy = (user: CurrentUser) => (canSeeAll(user.role) ? {} : { ownerId: user.id });

/** Tasks: managers see everyone's, a rep sees the tasks assigned to them. */
export const assignedTo = (user: CurrentUser) => (canSeeAll(user.role) ? {} : { assigneeId: user.id });
