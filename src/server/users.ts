import "server-only";
import type { Role } from "@/generated/prisma/enums";
import { canSeeAll } from "@/lib/permissions";
import { db } from "@/server/db";

/** Active users that records can be assigned to. */
export const getAssignableUsers = () =>
  db.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });

/**
 * Who a record may be assigned to. A rep's records are always their own; managers may pick any
 * active user or leave it unassigned. Returns null if the chosen user is not valid.
 */
export async function resolveOwner(me: { id: string; role: Role }, ownerId: string | undefined): Promise<{ ownerId: string | null } | null> {
  if (!canSeeAll(me.role)) return { ownerId: me.id };
  if (!ownerId) return { ownerId: null };
  const exists = await db.user.findFirst({ where: { id: ownerId, isActive: true }, select: { id: true } });
  return exists ? { ownerId } : null;
}
