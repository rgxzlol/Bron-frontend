"use client";

import { routes } from "@/config/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { id: "upcoming", labelKey: "bookings.upcoming" },
  { id: "past", labelKey: "bookings.past" },
] as const;

export function BookingNav() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") === "past" ? "past" : "upcoming";

  function handleTabChange(tab: (typeof TABS)[number]["id"]) {
    router.push(`${routes.bookings}?tab=${tab}`, { scroll: false });
  }

  return (
    <nav aria-label={t("bookings.navLabel")} data-testid="bookings-tabs">
      <div className="flex w-full gap-[10px] lg:max-w-[430px]">
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              data-testid={`bookings-tab-${tab.id}`}
              className={`flex-1 rounded-[12px] py-[13px] text-[15px] font-semibold transition-colors duration-200 focus:outline-none ${
                isActive
                  ? "bg-[#0a6af7] text-white"
                  : "bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-muted)]"
              }`}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
