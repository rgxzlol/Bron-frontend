"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { NotificationCard } from "./NotificationCard";
import { NotificationEmpty } from "./NotificationEmpty";

export default function NotificationDropdown() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [cleared, setCleared] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const demoNotifications = useMemo(
    () => [
      {
        icon: assets.notification.calendar,
        title: t("headerFilters.demoReminderTitle"),
        description: t("headerFilters.demoReminderDesc"),
        time: "09:00",
      },
      {
        icon: assets.notification.card,
        title: t("headerFilters.demoPaymentTitle"),
        description: t("headerFilters.demoPaymentDesc"),
        time: "09:00",
      },
      {
        icon: assets.notification.discount,
        title: t("headerFilters.demoPromoTitle"),
        description: t("headerFilters.demoPromoDesc"),
        time: "09:00",
      },
    ],
    [t],
  );

  const notifications = cleared ? [] : demoNotifications;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleClear = () => {
    setCleared(true);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="grid place-items-center rounded-full p-[18px] hover:bg-[var(--bg-hover)] transition-colors border border-transparent"
        aria-label={t("header.notifications")}
        aria-expanded={isOpen}
      >
        <Image src={assets.header.notification} alt="" className="opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-[2px] z-50 min-w-[650px] rounded-[18px] bg-[var(--bg-surface)] px-5 py-4 shadow-lg border border-[var(--border-default)]">
          <div className="flex pb-[19px] justify-between border-b-3 border-[var(--border-default)]">
            <h1 className="font-semibold text-[20px] text-[var(--text-primary)]">
              {t("header.notifications")}
            </h1>
            <button
              type="button"
              className="grid place-items-center rounded-full p-[5px] bg-[var(--bg-surface-muted)] hover:bg-[var(--bg-hover)] active:scale-95 transition-all duration-200"
              onClick={() => setIsOpen(false)}
              aria-label={t("common.close")}
            >
              <Image src={assets.header.close} alt="close" />
            </button>
          </div>
          {notifications.length > 0 ? (
            <div className="mt-3">
              <span className="block font-semibold text-[13px] text-black opacity-60 mb-[14px]">
                {t("headerFilters.today")}
              </span>
              <ul className="flex flex-col my-[14px] gap-3">
                {notifications.map((notif, index) => (
                  <NotificationCard
                    key={index}
                    icon={notif.icon}
                    title={notif.title}
                    description={notif.description}
                    time={notif.time}
                  />
                ))}
              </ul>
              <button
                type="button"
                onClick={handleClear}
                className="mx-auto bg-[#FAFAFF] rounded-[14px] px-[42px] py-[15px] flex gap-[15px] hover:bg-[#eaeaff] hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                <Image src={assets.notification.trash} alt="trash" />
                <span className="font-semibold text-[16px] text-[#0A6AF7]">
                  {t("headerFilters.clearRead")}
                </span>
              </button>
            </div>
          ) : (
            <NotificationEmpty />
          )}
        </div>
      )}
    </div>
  );
}
