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
    <div className="flex justify-between px-[23px] py-[26px]">
      <div className="flex flex-col gap-[8px]">
        <h3 className="max-w-[450px] text-[36px] font-semibold">
          {t("business.emptyTitle")}
        </h3>

        <p className="text-[20px] font-semibold opacity-75">
          {t("business.emptySubtitle")}
        </p>

        <Button
          onClick={onAddBusiness}
          className="mt-[25px] py-[15px] text-[20px] !px-[30px]"
          text={t("business.addBusiness")}
        />
      </div>

      <Image
        className="mr-[70px] max-w-[392px] object-cover"
        src={assets.bussines.photo1}
        alt=""
      />
    </div>
  );
}
