"use client";
import { assets } from "@/lib/assets";
import Image from "next/image";
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from "react";

interface BookingDropdownProps {
    onCancelClick: () => void;
    onEditClick?: () => void;
}

export const BookingDropdown = ({ onCancelClick, onEditClick }: BookingDropdownProps) => {
    const t = useTranslations('BookingDropdown');
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
                className="rounded-full w-[40px] h-[40px] bg-transparent grid place-items-center shrink-0 transition-colors duration-200 hover:bg-gray-100 active:scale-90"
                aria-label={t('menu')}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <Image src={assets.booking.kebabIcon} alt='kebab' />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-5 z-50 min-w-[246px] rounded-[17px] bg-[#FAFAFF] px-[12px] py-[14px]">
                    <ul className="flex flex-col gap-[10px]">
                        <li>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    if (onEditClick) onEditClick();
                                }}
                                className="flex w-full items-center gap-[14px] rounded-[17px] p-[18px] bg-white hover:bg-[#f4f4f8] transition-all duration-200 hover:scale-[1.02] active:scale-95"
                            >
                                <Image src={assets.booking.editIcon} alt="edit" className="object-contain" width={17} height={17} />
                                <span className="text-[16px] font-semibold">{t('editBooking')}</span>
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    onCancelClick();
                                }}
                                className="flex w-full items-center gap-[14px] rounded-[17px] p-[18px] bg-white hover:bg-[#f4f4f8] transition-all duration-200 hover:scale-[1.02] active:scale-95"
                            >
                                <Image src={assets.booking.deleteIcon} alt="cancel" className="object-contain" width={17} height={17} />
                                <span className="text-[16px] font-semibold">{t('cancelBooking')}</span>
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    )
}