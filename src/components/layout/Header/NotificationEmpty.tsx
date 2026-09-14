"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function NotificationEmpty() {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center px-6 pt-8 text-center lg:px-4 lg:pt-3"
      data-testid="notifications-empty-state"
    >
      <Image
        src={assets.notification.emptyNotification}
        alt=""
        className="notification-empty-image mb-[31px] h-auto w-[220px] max-w-full lg:mb-[38px] lg:w-[275px]"
      />
      <h1
        className="mb-2 text-[22px] font-bold leading-tight text-[var(--text-primary)] lg:text-[28px]"
        data-testid="notifications-empty-title"
      >
        {t("headerFilters.emptyTitle")}
      </h1>
      <p
        className="mb-[50px] max-w-[280px] text-[15px] font-medium leading-[1.45] text-[var(--text-secondary)] lg:mb-[42px] lg:max-w-[360px] lg:text-[20px]"
        data-testid="notifications-empty-subtitle"
      >
        {t("headerFilters.emptySubtitle")}
      </p>
    </div>
  );
}
