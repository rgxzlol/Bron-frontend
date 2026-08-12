"use client";

import { assets } from "@/lib/assets";
import Image from "next/image";
import LanguageSelector from "@/components/layout/Header/LanguageSelector";
import NotificationDropdown from "@/components/layout/Header/NotificationDropdown";
import SearchBar from "./SearchBar";
import { routes } from "@/config/routes";
import Link from "next/link";

export default function Header() {
  return (
    <header className="mt-[49px] mb-[45px] flex gap-[22px] items-center">
      <div className="flex-1 min-w-0">
        <SearchBar />
      </div>
      <div className="flex gap-[10px] shrink-0 items-center">
        <LanguageSelector />
        
        <NotificationDropdown />
        <Link
          href={routes.profile}
          className="rounded-full bg-white p-[16px] w-[58px] h-[58px]"
          aria-label="Профиль"
        >
          <Image src={assets.header.profileIcon} alt="" width={27} height={27} />
        </Link>
      </div>
    </header>
  );
}