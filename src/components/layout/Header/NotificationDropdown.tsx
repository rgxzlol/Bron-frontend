"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { NotificationCard, type NotificationItem } from "./NotificationCard";
import { NotificationEmpty } from "./NotificationEmpty";

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    icon: assets.notification.calendar,
    title: "Напоминание о бронировании",
    description: "У вас завтра бронь в BronFitness",
    time: "09:00",
  },
  {
    icon: assets.notification.card,
    title: "Платеж успешно выполнен!",
    description: "Платеж на 98 000сум выполнен",
    time: "09:00",
  },
  {
    icon: assets.notification.discount,
    title: "Акция для вас!",
    description: "Скидка на 20% на все бронирования",
    time: "09:00",
  },
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
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
  }, [isOpen]);

  const handleClear = () => {
    setNotifications([]);
  };

  const list = (
    <>
      <span className="block text-[13px] font-medium text-[var(--text-secondary)]">Сегодня</span>
      <ul className="mt-2.5 flex flex-col gap-3">
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
    </>
  );

  const clearButton = (
    <button
      type="button"
      onClick={handleClear}
      className="mx-auto flex items-center gap-2.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-7 py-[15px] shadow-[0_4px_16px_rgba(17,24,39,0.06)] transition-all duration-200 hover:bg-[var(--bg-hover)] active:scale-95"
    >
      <Image src={assets.notification.trash} alt="" className="h-5 w-5 object-contain" />
      <span className="text-[15px] font-semibold text-[#0a6af7]">Удалить все прочитаные</span>
    </button>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="grid place-items-center rounded-full p-[18px] hover:bg-[var(--bg-hover)] transition-colors border border-transparent"
        aria-label="Уведомления"
        aria-expanded={isOpen}
      >
        <Image src={assets.header.notification} alt="" className="opacity-60" />
      </button>

      {/* Mobile: full-screen overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[var(--bg-page)] lg:hidden">
          <div className="relative flex shrink-0 items-center justify-center px-4 pb-3 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Назад"
              className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface-muted)] text-[var(--text-primary)] transition-transform active:scale-95"
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
            <h2 className="text-[20px] font-bold text-[var(--text-primary)]">Уведомления</h2>
          </div>

          {notifications.length > 0 ? (
            <div className="flex flex-1 flex-col px-4 pb-10 pt-3">
              {list}
              <div className="mt-auto flex justify-center pt-12">{clearButton}</div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col pt-8">
              <NotificationEmpty />
            </div>
          )}
        </div>
      )}

      {/* Desktop: dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-[2px] hidden min-w-[650px] rounded-[18px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-4 shadow-lg lg:block">
          <div className="flex justify-between border-b-3 border-[var(--border-default)] pb-[19px]">
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Уведомления</h1>
            <button
              type="button"
              className="grid place-items-center rounded-full bg-[var(--bg-surface-muted)] p-[5px] transition-all duration-200 hover:bg-[var(--bg-hover)] active:scale-95"
              onClick={() => setIsOpen(false)}
            >
              <Image src={assets.header.close} alt="close" />
            </button>
          </div>
          {notifications.length > 0 ? (
            <div className="mt-4">
              {list}
              <div className="mt-6 flex justify-center pb-1">{clearButton}</div>
            </div>
          ) : (
            <NotificationEmpty />
          )}
        </div>
      )}
    </div>
  );
}
