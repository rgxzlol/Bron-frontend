'use client';

import { Link, usePathname } from '@/i18n/routing';
import { ReactNode } from 'react';

interface NavLinkProps {
    href: string;
    children: ReactNode;
    activeClassName?: string;
    className?: string;
}

export function NavLink({
    href,
    children,
    activeClassName = 'active',
    className = ''
}: NavLinkProps) {
    const pathname = usePathname();

    const isActive = pathname === href;

    const computedClassName = `${className} ${isActive ? activeClassName : ''}`.trim();

    return (
        <Link href={href} className={computedClassName}>
            {children}
        </Link>
    );
}