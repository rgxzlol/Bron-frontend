"use client";

import { assets } from "@/lib/assets";
import Image from "next/image";
import LanguageSelector from "@/components/layout/Header/LanguageSelector";
import NotificationDropdown from "@/components/layout/Header/NotificationDropdown";
import SearchBar from "./SearchBar";
import { routes } from "@/config/routes";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function Header() {
  const { t } = useTranslation();

  return (
    <header className="my-[45px] flex justify-between">
      <SearchBar />
      <div className="flex gap-[10px]">
        <LanguageSelector />

        <NotificationDropdown />
        <Link
          href={routes.profile}
          className="rounded-full bg-white p-[16px]"
          aria-label={t("common.profile")}
        >
          <Image src={assets.header.profileIcon} alt="" />
        </Link>
      </div>
    </header>
  );
}
