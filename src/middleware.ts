import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isProtectedPage =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/business");

  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/book/:path*", "/bookings/:path*", "/business/:path*"],
};
