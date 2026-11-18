import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only (cookie present). Real validation happens in requireUser().
// /login itself redirects signed-in users, since a stale cookie must still reach it.
export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has("crm_session");
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  if (!hasSession && !isLogin) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
