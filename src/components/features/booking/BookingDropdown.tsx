"use client";
import { useEffect, useRef, useState } from "react";

interface BookingDropdownProps {
    onCancelClick: () => void;
    onEditClick?: () => void;
}

export const BookingDropdown = ({ onCancelClick, onEditClick }: BookingDropdownProps) => {
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
                className="grid h-[32px] w-[32px] place-items-center rounded-full bg-black/80 text-white transition-colors duration-200 hover:bg-black active:scale-90"
                aria-label="Меню брони"
                aria-expanded={isOpen}
                aria-haspopup="menu"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                </svg>
            </button>

            {isOpen && (
                <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[190px] rounded-[14px] bg-[var(--bg-surface)] p-[6px] shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setIsOpen(false);
                            if (onEditClick) onEditClick();
                        }}
                        className="flex w-full items-center rounded-[10px] px-[14px] py-[12px] text-left text-[14px] font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:bg-[var(--bg-surface-muted)]"
                    >
                        Изменить бронь
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setIsOpen(false);
                            onCancelClick();
                        }}
                        className="flex w-full items-center rounded-[10px] px-[14px] py-[12px] text-left text-[14px] font-semibold text-[#e02424] transition-colors duration-200 hover:bg-[#fde8e8] dark:hover:bg-[var(--bg-surface-muted)]"
                    >
                        Отменить бронь
                    </button>
                </div>
            )}
        </div>
    );
};
