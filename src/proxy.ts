import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

// Redirect UX only - a fast cookie-presence check, not real verification.
// Next.js explicitly recommends against relying on proxy/middleware as the
// actual security boundary (a matcher edit or a Server Action reachable by
// a different path could silently bypass it). The real check is
// getSessionUser() in src/lib/auth/session.ts, called at the top of every
// protected layout, page, and Route Handler that touches data.
const AUTH_ROUTES = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (AUTH_ROUTES.includes(pathname)) {
    if (hasSessionCookie) {
      return NextResponse.redirect(new URL("/feed", request.url));
    }
    return NextResponse.next();
  }

  const isProtectedRoute =
    pathname.startsWith("/feed") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/post") ||
    pathname.startsWith("/people") ||
    pathname.startsWith("/complete-profile");

  if (isProtectedRoute && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
