import { assets } from "@/lib/assets";
import { routes, type AppRoute } from "@/config/routes";
import type { StaticImageData } from "next/image";

export type NavItem = {
  titleKey: string;
  href: AppRoute;
  icon: StaticImageData;
};

export const mainNavItems: NavItem[] = [
  { titleKey: "nav.home", href: routes.home, icon: assets.nav.home },
  { titleKey: "nav.map", href: routes.map, icon: assets.nav.map },
  { titleKey: "nav.business", href: routes.business, icon: assets.nav.business },
  { titleKey: "nav.bookings", href: routes.bookings, icon: assets.nav.booking },
  { titleKey: "nav.support", href: routes.support, icon: assets.nav.support },
];
