import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { redis } from "@/server/redis";

export const SESSION_COOKIE = "crm_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const key = (token: string) => `session:${token}`;

// The cookie only holds a random id; the session itself lives in Redis so logout and deactivation take effect at once.
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await redis.set(key(token), userId, "EX", SESSION_TTL_SECONDS);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await redis.del(key(token));
  store.delete(SESSION_COOKIE);
}

/** Current user or null. Deduplicated per request. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = await redis.get(key(token));
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, phone: true, role: true, isActive: true } });
  return user?.isActive ? user : null;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Use in pages and server actions. Redirects to /login, or to / if the role is not allowed. */
export async function requireUser(roles?: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/");
  return user;
}
