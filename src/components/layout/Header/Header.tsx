"use client";

import { assets } from "@/lib/assets";
import Image from "next/image";
import LanguageSelector from "@/components/layout/Header/LanguageSelector";
import NotificationDropdown from "@/components/layout/Header/NotificationDropdown";
import SearchBar from "./SearchBar";
import { Logo } from "@/components/shared/Logo";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { routes } from "@/config/routes";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";

export default function Header() {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const profileHref = hydrated && token ? routes.profile : routes.login;

  return (
    <header className="my-6 flex flex-wrap items-center gap-3 lg:my-[45px] lg:flex-nowrap lg:gap-4">
      {/* Mobile / tablet: logo (nav lives in the bottom navbar) */}
      <Logo className="text-[26px] lg:hidden" />

      {/* Controls: right side */}
      <div className="ml-auto flex items-center gap-[6px] lg:order-3 lg:ml-0 lg:gap-[10px]">
        <div className="hidden lg:flex">
          <LanguageSelector />
        </div>
        <ThemeSwitcher />
        <NotificationDropdown />
        <Link
          href={routes.profile}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white"
          aria-label="Профиль"
        >
          <Image src={assets.header.profileIcon} alt="" />
        </Link>
      </div>

      {/* Search: full width on mobile, flexible on desktop */}
      <div className="w-full lg:order-1 lg:w-auto lg:flex-1">
        <SearchBar />
      </div>
    </header>
  );
}
