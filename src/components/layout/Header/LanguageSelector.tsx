"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from "@/i18n/routing";

const LOCALES = [
  { code: "ru", label: "RU", icon: assets.header.ruLang },
  { code: "uz", label: "UZ", icon: assets.header.uzLang },
  { code: "en", label: "EN", icon: assets.header.enLang },
] as const;

export default function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('LanguageSelector');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LOCALES.find((l) => l.code === currentLocale) ?? LOCALES[0];

  const handleSelectLocale = (nextLocale: string) => {
    if (nextLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isPending}
        className="flex items-center gap-[18px] rounded-[27px] bg-white p-[7px] hover:bg-[#FAFAFF] transition-colors disabled:opacity-60"
        aria-label={t('selectLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Image src={currentLang.icon} alt="" />
        <span className="pr-[27px] text-[24px] font-semibold">{currentLang.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[150px] rounded-2xl bg-white p-2 shadow-lg border border-[#f4f4f8]">
          <ul className="flex flex-col gap-1" role="listbox">
            {LOCALES.map((lang) => (
              <li key={lang.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={lang.code === currentLocale}
                  onClick={() => handleSelectLocale(lang.code)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-[#f4f4f8] transition-colors ${lang.code === currentLocale ? "bg-[#f4f4f8]" : ""
                    }`}
                >
                  <Image src={lang.icon} alt={lang.label} className="object-contain" />
                  <span className="text-[24px] font-semibold">{lang.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}