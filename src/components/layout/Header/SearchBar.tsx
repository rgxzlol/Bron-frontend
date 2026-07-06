"use client";

import { useState } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { CategoryModal } from "./CategoryModal";
import { useTranslations } from 'next-intl';

export default function SearchBar() {
    const t = useTranslations('SearchBar');
    const [searchValue, setSearchValue] = useState("");
    const [isOpen, setIsOpen] = useState(false)

    const handleClear = () => {
        setSearchValue("");
    };

    const handleClose = () => {
        setIsOpen(false)
    }

    return (
        <div className="flex items-center rounded-[38px] bg-[#f4f4f8] px-5 py-[6px]">
            <label className="relative flex items-center pb-1">
                <Image className="mr-4" src={assets.header.search} alt={t('searchAlt')} width={22} height={22} />
                <input
                    className="mr-1 h-[25px] w-[600px] p-2 
                   focus:outline-none 
                   [&::-webkit-search-cancel-button]:appearance-none"
                    placeholder={t('searchPlaceholder')}
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
                aria-label={t('filters')} >
                <Image src={assets.header.filter} alt="" width={18} height={18} />
            </button>
            {
                isOpen &&
                <CategoryModal handleClose={handleClose} />
            }
        </div>

    );
}