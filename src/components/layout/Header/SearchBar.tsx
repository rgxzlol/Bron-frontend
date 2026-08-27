"use client";

import { useState } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { CategoryModal } from "./CategoryModal";

export default function SearchBar() {
    const [searchValue, setSearchValue] = useState("");
    const [isOpen, setIsOpen] = useState(false)

    const handleClear = () => {
        setSearchValue("");
    };

    const handleClose = () => {
        setIsOpen(false)
    }

    return (
        <div className="flex w-full items-center rounded-[38px] bg-[#f4f4f8] px-5 py-[6px] lg:max-w-[720px]">
            <label className="relative flex flex-1 items-center pb-1 min-w-0">
                <Image className="mr-4 shrink-0" src={assets.header.search} alt="Поиск" width={22} height={22} />
                <input
                    className="mr-1 h-[25px] w-full min-w-0 p-2
                   focus:outline-none
                   [&::-webkit-search-cancel-button]:appearance-none"
                    placeholder="Поиск услуг, мастеров и мест"
                    type="search"
                    name="search"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />

                {searchValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-5 text-gray-400 hover:text-black transition-colors"
                    >
                        <Image src={assets.header.close} alt="clear" />
                    </button>
                )}
            </label>
            <button
                onClick={() => setIsOpen(true)}
                type="button"
                className="rounded-full bg-white p-[9px]"
                aria-label="Фильтры" >
                <Image src={assets.header.filter} alt="" width={18} height={18} />
            </button>
            {
                isOpen &&
                <CategoryModal handleClose={handleClose} />
            }
        </div>

    );
}