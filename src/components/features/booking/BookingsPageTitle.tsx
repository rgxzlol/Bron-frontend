"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export function BookingsPageTitle() {
  const { t } = useTranslation();

  return (
    <h1 className="mb-[22px] text-[32px] font-semibold text-[var(--text-primary)]">
      {t("nav.bookings")}
    </h1>
  );
}
