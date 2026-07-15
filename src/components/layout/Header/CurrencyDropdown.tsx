"use client";

import { FC, useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface CurrencyDropdownProps {
  value: string;
  onChange(val: string): void;
}

export const CurrencyDropdown: FC<CurrencyDropdownProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = useMemo(
    () => [
      { id: "sum", label: t("headerFilters.currencySum"), badge: "UZS" },
      { id: "usd", label: "USD", badge: "$" },
    ],
    [t],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.id === value) || options[0];

  return (
    <div className="relative w-[130px]" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[72px] rounded-[17px] bg-[#FAFAFF] border-2 transition-all duration-300 flex items-center justify-between px-[18px] cursor-pointer text-left ${
          isOpen
            ? "border-[#0A6AF7] bg-white shadow-sm"
            : "border-transparent hover:border-gray-200"
        }`}
      >
        <div className="flex flex-col">
          <span className="text-[18px] font-semibold text-black leading-tight">
            {selectedOption.label}
          </span>
          <span className="text-[11px] font-medium text-gray-400">
            {selectedOption.badge}
          </span>
        </div>
        <span
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          <Image
            src={assets.booking.arrowDown}
            alt="expand"
            width={16}
            height={16}
          />
        </span>
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[140px] bg-white rounded-[17px] shadow-xl border border-gray-100 p-2 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((opt) => {
            const isSelected = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-[14px] py-[10px] hover:bg-[#FAFAFF] transition-all duration-200 rounded-[12px] text-left ${
                  isSelected ? "bg-blue-50/50 text-[#0A6AF7]" : "text-black"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold">{opt.label}</span>
                  <span className="text-[10px] opacity-60 font-medium">
                    {opt.badge}
                  </span>
                </div>
                {isSelected && (
                  <span className="text-[#0A6AF7] font-semibold text-[14px] animate-in zoom-in duration-200">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
