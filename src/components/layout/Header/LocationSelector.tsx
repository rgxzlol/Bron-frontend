"use client";

import { FC } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { MapLocationFilter } from "@/store/mapFilter.store";

interface LocationOptionProps {
  label: string;
  isActive: boolean;
  onClick(): void;
  testId: string;
}

const LocationOption: FC<LocationOptionProps> = ({
  label,
  isActive,
  onClick,
  testId,
}) => {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`flex h-[72px] w-full cursor-pointer items-center gap-[17px] rounded-[17px] border-2 px-[18px] py-[24px] text-left transition-all duration-300 ${
        isActive
          ? "border-[#0A6AF7] bg-blue-50/30 text-[#0A6AF7]"
          : "border-transparent bg-[#FAFAFF] text-black hover:border-gray-200 hover:bg-gray-100"
      }`}
    >
      <span
        className={`flex h-[43px] w-[43px] items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 ${
          isActive ? "scale-105" : ""
        }`}
      >
        <Image
          src={assets.booking.gpsIcon}
          alt=""
          className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-60"}`}
        />
      </span>
      <span
        className={`text-[20px] font-medium transition-colors duration-300 ${
          isActive ? "font-semibold text-[#0A6AF7]" : "text-black"
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

  const options: { id: MapLocationFilter; label: string }[] = [
    { id: "nearby", label: t("map.proximityNearby") },
    { id: "3-7", label: t("map.range3to7") },
    { id: "10-15", label: t("map.range10to15") },
  ];

  return (
    <div className="flex flex-col gap-[9px]">
      {options.map((option) => (
        <LocationOption
          key={option.id}
          testId={`map-location-${option.id}`}
          label={option.label}
          isActive={value === option.id}
          onClick={() => onChange(option.id)}
        />
      ))}
    </div>
  );
};
