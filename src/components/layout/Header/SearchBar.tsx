"use client";

import { useState } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { CategoryModal } from "./CategoryModal";

export default function SearchBar() {
  const [searchValue, setSearchValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    setSearchValue("");
  };

  const handleClose = () => setIsOpen(false);

  return (
    <div className="relative w-[calc(100%-104px)] ml-[104px]">
      <div
        className={`absolute top-0 z-20 flex h-[55px] items-center rounded-[28px] border-2 bg-[#f4f4f8] p-[6px_8px_4px_24px]  transition-all duration-300 ${
          isFocused
            ? "left-[-6px] right-[-2px] border-[#0a6af7]"
            : "left-0 right-0 border-transparent"
        }`}
      >
        <Image
          className="mr-4 shrink-0"
          src={assets.header.search}
          alt="Поиск"
          width={23}
          height={23}
        />

        <input
          type="text"
          className="mr-2 h-[25px] min-w-0 flex-1 bg-transparent p-0 pr-[24px] leading-[25px] focus:outline-none"
          placeholder="Поиск..."
          value={searchValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setSearchValue(e.target.value)}
        />

        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 transition-colors hover:text-black"
          >
            <Image src={assets.header.close} alt="clear" width={16} height={18} />
          </button>
        )}

        <button
          onClick={() => setIsOpen(true)}
          type="button"
          className="ml-2 shrink-0 rounded-full bg-white p-[9px]"
          aria-label="Фильтры"
        >
          <Image src={assets.header.filter} alt="" width={22} height={22} />
        </button>
      </div>

      <div className="h-[55px]" />

      {isOpen && <CategoryModal handleClose={handleClose} />}
    </div>
  );
}