import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
    const token = false;
    const pathname = request.nextUrl.pathname;

    const isAuthPage = pathname.includes('/login') || pathname.includes('/register');
    const isProtectedRoute = pathname.includes('/profile');

    const currentLocale = request.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale;

    if (!token && isProtectedRoute) {
        return NextResponse.redirect(new URL(`/${currentLocale}/login`, request.url));
    }

    if (token && isAuthPage) {
        return NextResponse.redirect(new URL(`/${currentLocale}/`, request.url));
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)']
};