import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

function readAuthToken(request: NextRequest) {
  const rawToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  try {
    return decodeURIComponent(rawToken);
  } catch {
    return rawToken;
  }
}

export function middleware(request: NextRequest) {
  const token = readAuthToken(request);
  const { pathname } = request.nextUrl;

  const isProtectedPage =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/business");

  if (!token && isProtectedPage) {
    const redirectPath = pathname.startsWith("/profile") ? "/auth" : "/login";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/book/:path*", "/bookings/:path*", "/business/:path*"],
};
