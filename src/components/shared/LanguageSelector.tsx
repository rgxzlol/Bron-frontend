"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        className="flex items-center gap-[18px] rounded-[27px] bg-white p-[7px] hover:bg-[#FAFAFF] transition-colors"
        aria-label="Выбрать язык"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Image src={assets.header.ruLang} alt="" />
        <span className="pr-[27px] text-[24px] font-semibold">RU</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[150px] rounded-2xl bg-white p-2 shadow-lg border border-[#f4f4f8]">
          <ul className="flex flex-col gap-1">
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-[#f4f4f8] transition-colors"
              >
                <Image src={assets.header.ruLang} alt="RU" className="object-contain" />
                <span className="text-[24px] font-semibold">RU</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-[#f4f4f8] transition-colors"
              >
                <Image src={assets.header.uzLang} alt="UZ" className="object-contain" />
                <span className="text-[24px] font-semibold">UZ</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-[#f4f4f8] transition-colors"
              >
                <Image src={assets.header.enLang} alt="EN" className="object-contain" />
                <span className="text-[24px] font-semibold">EN</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
