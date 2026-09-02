"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getNotificationPresentation } from "@/lib/notifications/presentation";
import { useNotificationStore } from "@/store/notification.store";
import { useAuthStore } from "@/store/auth.store";
import { NotificationCard } from "./NotificationCard";
import { NotificationEmpty } from "./NotificationEmpty";

export default function NotificationDropdown() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const items = useNotificationStore((state) => state.items);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const deleteReadNotifications = useNotificationStore(
    (state) => state.deleteReadNotifications,
  );
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      void fetchNotifications();
    }
  }, [token, fetchNotifications]);

  useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closePanel();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closePanel]);

  useEffect(() => {
    if (!isOpen) return;

    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (!isMobile) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => {
      const isMobile = window.matchMedia("(max-width: 1023px)").matches;
      const panelSelector = isMobile
        ? '[data-testid="notifications-panel-mobile"]'
        : '[data-testid="notifications-panel"]';
      const panel = dropdownRef.current?.querySelector(panelSelector);
      const closeEl = panel?.querySelector<HTMLElement>(
        '[data-testid="notifications-close"]',
      );
      closeEl?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const hasNotifications = items.length > 0;

  const list = (
    <>
      <span className="block text-[13px] font-medium text-[var(--text-secondary)]">
        {t("headerFilters.today")}
      </span>
      <ul className="mt-2.5 flex flex-col gap-3" data-testid="notifications-list">
        {items.map((item) => {
          const presentation = getNotificationPresentation(item.type, t);

          return (
            <NotificationCard
              key={item.id}
              icon={presentation.icon}
              title={presentation.title}
              description={presentation.description}
              time={item.time}
              testId={presentation.testId}
            />
          );
        })}
      </ul>
    </>
  );

  const clearButton = (
    <button
      type="button"
      onClick={() => void deleteReadNotifications()}
      className="mx-auto flex items-center gap-2.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-7 py-[15px] shadow-[0_4px_16px_rgba(17,24,39,0.06)] transition-all duration-200 hover:bg-[var(--bg-hover)] active:scale-95"
      data-testid="notifications-delete-read"
    >
      <Image src={assets.notification.trash} alt="" className="h-5 w-5 object-contain" />
      <span className="text-[15px] font-semibold text-[#0a6af7]">
        {t("headerFilters.clearRead")}
      </span>
    </button>
  );

  const panelBody = isLoading ? (
    <p className="py-8 text-center text-[15px] font-medium text-[var(--text-secondary)]">
      {t("common.loading")}
    </p>
  ) : hasNotifications ? (
    <>
      {list}
      <div className="mt-6 flex justify-center pb-1 lg:mt-6">{clearButton}</div>
    </>
  ) : (
    <NotificationEmpty />
  );

  const closeButtonClassName =
    "grid place-items-center rounded-full bg-[var(--bg-surface-muted)] p-[5px] transition-all duration-200 hover:bg-[var(--bg-hover)] active:scale-95";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-full bg-white p-1 transition-opacity hover:opacity-90"
        aria-label={t("header.notifications")}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="notifications-panel"
        data-testid="notifications-button"
      >
        <span className="relative grid h-11 w-11 place-items-center rounded-full bg-[var(--bg-surface-muted)] transition-colors hover:bg-[var(--bg-hover)]">
          <Image
            src={assets.header.notification}
            alt=""
            data-header-icon
            className="opacity-60"
          />
          {hasNotifications ? (
            <span
              className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e02424] px-1 text-[11px] font-bold text-white"
              data-testid="notifications-count"
            >
              {items.length}
            </span>
          ) : null}
        </span>
      </button>

      {isOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[var(--bg-page)] lg:hidden"
            id="notifications-panel-mobile"
            role="dialog"
            aria-modal="true"
            aria-label={t("header.notifications")}
            data-testid="notifications-panel-mobile"
          >
            <div className="relative flex shrink-0 items-center justify-center px-4 pb-3 pt-4">
              <button
                type="button"
                onClick={closePanel}
                aria-label={t("common.back")}
                className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface-muted)] text-[var(--text-primary)] transition-transform active:scale-95 lg:hidden"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-[20px] font-bold text-[var(--text-primary)]">
                {t("header.notifications")}
              </h2>
              <div className="absolute right-4">
                <button
                  type="button"
                  className={closeButtonClassName}
                  onClick={closePanel}
                  aria-label={t("common.close")}
                  data-testid="notifications-close"
                >
                  <Image src={assets.header.close} alt="" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col px-4 pb-10 pt-3">{panelBody}</div>
          </div>

          <div
            className="absolute right-0 top-full z-50 mt-[2px] hidden min-w-[650px] rounded-[18px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-4 shadow-lg lg:block"
            id="notifications-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("header.notifications")}
            data-testid="notifications-panel"
          >
            <div className="flex justify-between border-b-3 border-[var(--border-default)] pb-[19px]">
              <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">
                {t("header.notifications")}
              </h1>
              <button
                type="button"
                className={closeButtonClassName}
                onClick={closePanel}
                aria-label={t("common.close")}
                data-testid="notifications-close"
              >
                <Image src={assets.header.close} alt="" />
              </button>
            </div>
            <div className="mt-4">{panelBody}</div>
          </div>
        </>
      ) : null}
    </div>
  );
}
