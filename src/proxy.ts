import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const locales = ['ru', 'en'];
const defaultLocale = 'ru';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale
});

export function proxy(request: NextRequest) {
    const token = false;
    const pathname = request.nextUrl.pathname;

    const isAuthPage = pathname.includes('/login') || pathname.includes('/register');
    const isProtectedRoute = pathname.includes('/profile');

    const currentLocale = request.cookies.get('NEXT_LOCALE')?.value || defaultLocale;

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