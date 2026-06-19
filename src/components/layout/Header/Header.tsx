"use client";

import { assets } from "@/lib/assets";
import Image from "next/image";
import LanguageSelector from "@/components/layout/Header/LanguageSelector";
import NotificationDropdown from "@/components/layout/Header/NotificationDropdown";
import ProfileButton from "@/components/features/profile/ProfileButton";

export default function Header() {
  return (
    <header className="my-[45px]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between">
        <div className="flex items-center rounded-[38px] bg-[var(--bg-surface-muted)] px-5 py-[6px] pr-[7px]">
          <label className="flex items-center">
            <Image className="mr-4" src={assets.header.search} alt="Поиск" data-theme-aware />
            <input
              className="mr-1 h-[25px] w-[600px] bg-transparent p-2 outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Поиск..."
              type="search"
              name="search"
            />
          </label>

          <button
            type="button"
            className="rounded-full bg-[var(--bg-surface)] p-[9px]"
            aria-label="Фильтры"
          >
            <Image src={assets.header.filter} alt="" data-theme-aware />
          </button>
        </div>

        <div className="flex gap-[10px]">
          <LanguageSelector />
          <NotificationDropdown />
          <ProfileButton />
        </div>
      </div>
    </header>
  );
}
