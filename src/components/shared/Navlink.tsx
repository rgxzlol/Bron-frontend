"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  activeClassName?: string;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  "aria-disabled"?: boolean;
  "data-testid"?: string;
}

export function NavLink({
  href,
  children,
  activeClassName = "active",
  className = "",
  onClick,
  "aria-disabled": ariaDisabled,
  "data-testid": dataTestId,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const computedClassName = `${className} ${isActive ? activeClassName : ""}`.trim();

  return (
    <Link
      href={href}
      className={computedClassName}
      onClick={onClick}
      aria-disabled={ariaDisabled}
      data-testid={dataTestId}
    >
      {children}
    </Link>
  );
}
