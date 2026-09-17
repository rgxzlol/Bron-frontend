"use client";

import { mainNavItems } from "@/config/navigation";
import { routes } from "@/config/routes";
import { NavLink } from "@/components/shared/Navlink";
import { useBusinessNavAccess } from "@/lib/business/applicationAccess";
import { useTranslation } from "@/lib/i18n/useTranslation";
import s from "./sidebar.module.css";

type SidebarNavProps = {
  onNavigate?: () => void;
};

const NAV_TITLE_KEYS = [
  "nav.home",
  "nav.map",
  "nav.business",
  "nav.bookings",
  "nav.support",
] as const;

export default function SidebarNav({ onNavigate }: SidebarNavProps) {
  const { t } = useTranslation();
  const { canAccessBusinessPage, isBusinessLocked, isBusinessVisible, businessHref } =
    useBusinessNavAccess();

  return (
    <ul className="mt-8 list-none w-full lg:mt-[47px]">
      {mainNavItems.map((item, index) => {
        const isBusinessItem = item.href === routes.business;

        if (isBusinessItem && !isBusinessVisible) {
          return null;
        }

        const href = isBusinessItem ? businessHref : item.href;
        const locked = isBusinessItem && isBusinessLocked;

        return (
          <li key={item.href} className="w-full">
            <NavLink
              href={href}
              onClick={(event) => {
                if (locked && !canAccessBusinessPage) {
                  event.preventDefault();
                }
                onNavigate?.();
              }}
              aria-disabled={locked}
              className={`${s.link} ${locked ? s.locked : ""}`}
              activeClassName={s.active}
              data-testid={isBusinessItem ? "nav-business" : undefined}
            >
              <span
                className={s.icon}
                style={{
                  width: item.icon.width,
                  height: item.icon.height,
                  WebkitMaskImage: `url(${item.icon.src})`,
                  maskImage: `url(${item.icon.src})`,
                }}
                aria-hidden
              />
              <span className={s.title}>{t(NAV_TITLE_KEYS[index])}</span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}
