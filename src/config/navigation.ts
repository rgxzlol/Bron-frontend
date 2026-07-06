import { assets } from "@/lib/assets";
import { routes, type AppRoute } from "@/config/routes";
import type { StaticImageData } from "next/image";

export type NavItem = {
  title: string;
  href: AppRoute;
  icon: StaticImageData;
};

export const mainNavItems: NavItem[] = [
  { title: "home", href: routes.home, icon: assets.nav.home },
  { title: "map", href: routes.map, icon: assets.nav.map },
  { title: "business", href: routes.business, icon: assets.nav.business },
  { title: "myBookins", href: routes.bookings, icon: assets.nav.booking },
  { title: "support", href: routes.support, icon: assets.nav.support },
];
