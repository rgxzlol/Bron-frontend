"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  type ProfileLanguage,
  useProfileStore,
} from "@/store/profile.store";

const LANG_OPTIONS: {
  id: ProfileLanguage;
  label: string;
  flag: typeof assets.header.ruLang;
}[] = [
  { id: "ru", label: "RU", flag: assets.header.ruLang },
  { id: "uz", label: "UZ", flag: assets.header.uzLang },
  { id: "en", label: "EN", flag: assets.header.enLang },
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const language = useProfileStore((state) => state.language);
  const setLanguage = useProfileStore((state) => state.setLanguage);
  const { t } = useTranslation();

  const current =
    LANG_OPTIONS.find((option) => option.id === language) ?? LANG_OPTIONS[0];

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

  function handleSelect(next: ProfileLanguage) {
    setLanguage(next);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-[18px] rounded-[27px] bg-[var(--bg-surface)] p-[7px] hover:bg-[var(--bg-surface-muted)] transition-colors border border-[var(--border-default)]"
        aria-label={t("common.selectLanguage")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Image src={current.flag} alt="" />
        <span className="pr-[27px] text-[24px] font-semibold">{current.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[150px] rounded-2xl bg-[var(--bg-surface)] p-2 shadow-lg border border-[var(--border-default)]">
          <ul className="flex flex-col gap-1" role="listbox">
            {LANG_OPTIONS.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.id === language}
                  onClick={() => handleSelect(option.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-[var(--bg-surface-muted)] transition-colors"
                >
                  <Image src={option.flag} alt={option.label} className="object-contain" />
                  <span className="text-[24px] font-semibold">{option.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
