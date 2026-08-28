"use client";

import { assets } from "@/lib/assets";
import Image from "next/image";
import LanguageSelector from "@/components/layout/Header/LanguageSelector";
import NotificationDropdown from "@/components/layout/Header/NotificationDropdown";
import SearchBar from "./SearchBar";
import { routes } from "@/config/routes";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";

export default function Header() {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const profileHref = hydrated && token ? routes.profile : routes.login;

  return (
    <header className="my-[45px] flex justify-between">
      <SearchBar />
      <div className="flex gap-[10px]">
        <LanguageSelector />

        <NotificationDropdown />
        <Link
          href={profileHref}
          className="rounded-full bg-white p-[16px]"
          aria-label={token ? "Профиль" : "Войти"}
        >
          <Image src={assets.header.profileIcon} alt="" />
        </Link>
      </div>
    </header>
  );
}