import { destroySession } from "@/server/auth/session";

export async function POST() {
  await destroySession();
  // Relative Location on purpose: behind Liara's proxy `req.url` is the container's
  // own address (https://0.0.0.0:3000), so an absolute URL built from it breaks.
  return new Response(null, { status: 303, headers: { Location: "/login" } });
}
