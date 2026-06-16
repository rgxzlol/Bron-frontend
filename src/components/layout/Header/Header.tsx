import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import Image from "next/image";
import Link from "next/link";
import LanguageSelector from "@/components/layout/Header/LanguageSelector";
import NotificationDropdown from "@/components/layout/Header/NotificationDropdown";

export default function Header() {
  return (
    <header className="my-[45px]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between">
        <div className="flex items-center rounded-[38px] bg-[#f4f4f8] px-5 py-[6px] pr-[7px]">
          <label className="flex items-center">
            <Image className="mr-4" src={assets.header.search} alt="Поиск" />
            <input
              className="mr-1 h-[25px] w-[600px] p-2"
              placeholder="Поиск..."
              type="search"
              name="search"
            />
          </label>

          <button
            type="button"
            className="rounded-full bg-white p-[9px]"
            aria-label="Фильтры"
          >
            <Image src={assets.header.filter} alt="" />
          </button>
        </div>

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
      </div>
    </header>
  );
}