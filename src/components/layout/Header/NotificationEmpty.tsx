"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function NotificationEmpty() {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center px-6 pt-8 text-center"
      data-testid="notifications-empty-state"
    >
      <Image
        src={assets.notification.emptyNotification}
        alt=""
        data-theme-invert
        className="mb-[31px] h-auto w-[220px] max-w-full"
      />
      <h1
        className="mb-2 text-[22px] font-bold text-[var(--text-primary)]"
        data-testid="notifications-empty-title"
      >
        {t("headerFilters.emptyTitle")}
      </h1>
      <p
        className="mb-[50px] max-w-[280px] text-[15px] font-medium text-[var(--text-secondary)]"
        data-testid="notifications-empty-subtitle"
      >
        {t("headerFilters.emptySubtitle")}
      </p>
    </div>
  );
}
