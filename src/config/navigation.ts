import { assets } from "@/lib/assets";
import { routes, type AppRoute } from "@/config/routes";
import type { StaticImageData } from "next/image";

export type NavItem = {
  title: string;
  href: AppRoute;
  icon: StaticImageData;
};

export const mainNavItems: NavItem[] = [
  { title: "Главная", href: routes.home, icon: assets.nav.home },
  { title: "Карта", href: routes.map, icon: assets.nav.map },
  { title: "Бизнес страница", href: routes.business, icon: assets.nav.business },
  { title: "Мои брони", href: routes.bookings, icon: assets.nav.booking },
  { title: "Поддержка", href: routes.support, icon: assets.nav.support },
];
