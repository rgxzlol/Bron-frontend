"use client";

import { FC } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface LocationOptionProps {
  label: string;
  isActive: boolean;
  onClick(): void;
}

const LocationOption: FC<LocationOptionProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-[72px] px-[18px] py-[24px] rounded-[17px] flex items-center gap-[17px] transition-all duration-300 text-left cursor-pointer border-2 ${
        isActive
          ? "bg-blue-50/30 border-[#0A6AF7] text-[#0A6AF7]"
          : "bg-[#FAFAFF] border-transparent text-black hover:bg-gray-100 hover:border-gray-200"
      }`}
    >
      <span
        className={`w-[43px] h-[43px] rounded-full flex items-center justify-center bg-white shadow-sm transition-all duration-300 ${
          isActive ? "scale-105" : ""
        }`}
      >
        <Image
          src={assets.booking.gpsIcon}
          alt="geo"
          className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-60"}`}
        />
      </span>
      <span
        className={`text-[20px] font-medium transition-colors duration-300 ${
          isActive ? "text-[#0A6AF7] font-semibold" : "text-black"
        }`}
      >
        {label}
      </span>
    </button>
  );
};

interface LocationSelectorProps {
  value: string;
  onChange(val: string): void;
}

export const LocationSelector: FC<LocationSelectorProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  const options = [
    { id: "nearby", label: t("header.nearby") },
    { id: "3-7km", label: t("headerFilters.range3to7") },
    { id: "10-15km", label: t("headerFilters.range10to15") },
  ];

  return (
    <div className="flex flex-col gap-[9px]">
      {options.map((opt) => (
        <LocationOption
          key={opt.id}
          label={opt.label}
          isActive={value === opt.id}
          onClick={() => onChange(opt.id)}
        />
      ))}
    </div>
  );
};
