"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";

export const NotificationEmpty = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center mt-8">
      <Image
        src={assets.notification.emptyNotification}
        alt="empty"
        className="mb-[31px]"
      />
      <h1 className="font-semibold text-[20px] text-black mb-2">
        {t("headerFilters.emptyTitle")}
      </h1>
      <p className="font-semibold text-[16px] text-center text-black/60 mb-[50px]">
        {t("headerFilters.emptySubtitle")}
      </p>
    </div>
  );
};
