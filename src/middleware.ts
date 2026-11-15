import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "./lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);

  // 1. Exact check for /admin/login FIRST (prevents any redirect loop for admin login)
  if (pathname === "/admin/login") {
    if (session && session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // If unauthenticated OR logged in as a regular USER, allow /admin/login to render (200 OK)
    // so the user can sign in with an ADMIN phone number without a redirect loop!
    return NextResponse.next();
  }

  // 2. Check for all other /admin routes (pathname.startsWith('/admin'))
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "ADMIN") {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Check for /login (always redirects authenticated users to /app, never /admin)
  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
    return NextResponse.next();
  }

  // 4. Check for /app routes
  if (pathname.startsWith("/app")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app/:path*",
    "/admin/:path*",
    "/login",
  ],
};
