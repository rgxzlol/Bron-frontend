"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { mainNavItems } from "@/config/navigation";
import { routes } from "@/config/routes";
import { useBusinessNavAccess } from "@/lib/business/applicationAccess";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { showBusinessInNav, canAccessBusinessPage, isBusinessLocked, businessHref } =
    useBusinessNavAccess();

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 lg:hidden"
      aria-label="Основная навигация"
    >
      <ul className="mx-auto flex max-w-[460px] items-center justify-between gap-1 rounded-full bg-[#0a6af7] p-2 shadow-[0_12px_30px_-8px_rgba(10,106,247,0.55)]">
        {mainNavItems.map((item) => {
          const isBusinessItem = item.href === routes.business;

          if (isBusinessItem && !showBusinessInNav) {
            return null;
          }

          const href = isBusinessItem ? businessHref : item.href;
          const locked = isBusinessItem && isBusinessLocked;
          const isActive = pathname === href || (isBusinessItem && pathname.startsWith(routes.business));

          return (
            <li key={item.href} className="flex flex-1 justify-center">
              <Link
                href={href}
                aria-label={item.title}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={locked}
                data-testid={isBusinessItem ? "nav-business" : undefined}
                onClick={(event) => {
                  if (locked && !canAccessBusinessPage) {
                    event.preventDefault();
                    return;
                  }

                  if (isBusinessItem && canAccessBusinessPage) {
                    event.preventDefault();
                    router.push(routes.business);
                  }
                }}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-white" : "hover:bg-white/15"
                } ${locked ? "opacity-45" : ""}`}
              >
                <span
                  className="h-6 w-6 [-webkit-mask-repeat:no-repeat] [mask-repeat:no-repeat] [-webkit-mask-size:contain] [mask-size:contain] [-webkit-mask-position:center] [mask-position:center]"
                  style={{
                    backgroundColor: isActive ? "#0a6af7" : "#ffffff",
                    WebkitMaskImage: `url(${item.icon.src})`,
                    maskImage: `url(${item.icon.src})`,
                  }}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
