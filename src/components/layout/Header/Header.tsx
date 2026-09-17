"use client";

import LanguageSelector from "@/components/layout/Header/LanguageSelector";
import NotificationDropdown from "@/components/layout/Header/NotificationDropdown";
import SearchBar from "./SearchBar";
import { Logo } from "@/components/shared/Logo";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import ProfileButton from "@/components/features/profile/ProfileButton";

export default function Header() {
  return (
    <header className="my-6 flex flex-wrap items-center gap-3 lg:my-[45px] lg:flex-nowrap lg:gap-4">
      <Logo className="text-[26px] lg:hidden" />

      <div className="ml-auto flex items-center gap-[6px] lg:order-3 lg:ml-0 lg:gap-[10px]">
        <LanguageSelector />
        <ThemeSwitcher />
        <NotificationDropdown />
        <ProfileButton variant="header" />
      </div>

      <div className="w-full lg:order-1 lg:w-auto lg:flex-1">
        <SearchBar />
      </div>
    </header>
  );
}
