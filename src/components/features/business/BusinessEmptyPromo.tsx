"use client";

import Button from "@/components/shared/Button";
import { assets } from "@/lib/assets";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  onAddBusiness: () => void;
};

export default function BusinessEmptyPromo({ onAddBusiness }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center gap-6 rounded-[34px] bg-white px-5 py-6 md:flex-row md:items-center md:justify-between md:px-[23px] md:py-[26px]"
      data-testid="business-empty-state"
    >
      <div className="flex w-full flex-col items-center gap-[8px] text-center">
        <h3
          className="mx-auto max-w-[450px] text-[26px] font-semibold md:text-[36px]"
          data-testid="business-empty-title"
        >
          {t("business.emptyTitle")}
        </h3>

        <p
          className="max-w-[450px] text-[18px] font-semibold opacity-75 md:text-[20px]"
          data-testid="business-empty-subtitle"
        >
          {t("business.emptySubtitle")}
        </p>

        <Button
          onClick={onAddBusiness}
          className="mx-auto mt-[25px] py-[15px] text-[20px] !px-[30px]"
          text={t("business.addBusiness")}
          data-testid="business-add-button"
        />
      </div>

      <Image
        className="mx-auto h-auto w-full max-w-[280px] object-cover md:mx-0 md:mr-[70px] md:max-w-[392px]"
        src={assets.bussines.photo1}
        alt=""
        data-testid="business-empty-illustration"
      />
    </div>
  );
}
