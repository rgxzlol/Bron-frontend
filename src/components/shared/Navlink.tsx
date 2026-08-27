'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavLinkProps {
    href: string;
    children: ReactNode;
    activeClassName?: string;
    className?: string;
    onClick?: () => void;
}

export function NavLink({
    href,
    children,
    activeClassName = 'active',
    className = '',
    onClick
}: NavLinkProps) {
    const pathname = usePathname();

    const isActive = pathname === href;

    const computedClassName = `${className} ${isActive ? activeClassName : ''}`.trim();

    return (
        <Link href={href} className={computedClassName} onClick={onClick}>
            {children}
        </Link>
    );
}