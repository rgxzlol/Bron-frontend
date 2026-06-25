import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import Image from "next/image";
import Link from "next/link";
import LanguageSelector from "@/components/layout/Header/LanguageSelector";
import NotificationDropdown from "@/components/layout/Header/NotificationDropdown";
import SearchBar from "./SearchBar";

export default function Header() {
  return (
    <header className="my-[45px] flex justify-between">
      <SearchBar />

      <div className="flex gap-[10px]">
        <LanguageSelector />

        <NotificationDropdown />

        <Link
          href={routes.profile}
          className="rounded-full bg-white p-[16px]"
          aria-label="Профиль"
        >
          <Image src={assets.header.profileIcon} alt="" />
        </Link>
      </div>
    </header>
  );
}