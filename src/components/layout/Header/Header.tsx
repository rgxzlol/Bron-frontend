import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import Image from "next/image";
import Link from "next/link";
import LanguageSelector from "@/components/layout/Header/LanguageSelector";
import NotificationDropdown from "@/components/layout/Header/NotificationDropdown";
import SearchBar from "./SearchBar";
import { useTranslations } from 'next-intl';

export default function Header() {
  const t = useTranslations('Header');
  return (
    <header className="sticky top-0 z-50 my-[45px] flex justify-between">
      <SearchBar />

      <div className="flex gap-[10px]">
        <LanguageSelector />

        <NotificationDropdown />

        <Link
          href={routes.profile}
          className="rounded-full bg-white p-[16px]"
          aria-label={t('profile')}
        >
          <Image src={assets.header.profileIcon} alt="" />
        </Link>
      </div>
    </header>
  );
}