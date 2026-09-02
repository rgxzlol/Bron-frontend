"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { useProfileStore, type ProfileLanguage } from "@/store/profile.store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import s from "./languageSelector.module.css";

const LANGUAGES: Array<{
  code: ProfileLanguage;
  label: string;
  icon: (typeof assets.header)["ruLang"];
}> = [
  { code: "ru", label: "RU", icon: assets.header.ruLang },
  { code: "uz", label: "UZ", icon: assets.header.uzLang },
  { code: "en", label: "EN", icon: assets.header.enLang },
];

export default function LanguageSelector() {
  const { t } = useTranslation();
  const language = useProfileStore((state) => state.language);
  const setLanguage = useProfileStore((state) => state.setLanguage);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    LANGUAGES.find((item) => item.code === language) ?? LANGUAGES[0];

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

  function handleSelect(nextLanguage: ProfileLanguage) {
    setLanguage(nextLanguage);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-full bg-white p-1 transition-opacity hover:opacity-90"
        aria-label={t("common.selectLanguage")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        data-testid="language-selector"
      >
        <span className={s.trigger}>
          <Image src={currentLanguage.icon} alt="" className="w-6 shrink-0" />
          <span className={s.label}>{currentLanguage.label}</span>
        </span>
      </button>

      {isOpen ? (
        <div
          role="listbox"
          aria-label={t("common.languageChoice")}
          className="absolute right-0 top-full z-50 mt-2 min-w-[150px] rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 shadow-lg"
        >
          <ul className="flex flex-col gap-1">
            {LANGUAGES.map((item) => (
              <li key={item.code} role="option" aria-selected={language === item.code}>
                <button
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  data-testid={`language-option-${item.code}`}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-[var(--bg-surface-muted)] ${
                    language === item.code ? "bg-[var(--bg-surface-muted)]" : ""
                  }`}
                >
                  <Image src={item.icon} alt="" className="object-contain" />
                  <span className="text-[24px] font-semibold">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
