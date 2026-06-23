"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { NotificationCard } from "./NotificationCard";
import { NotificationEmpty } from "./NotificationEmpty";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState([
    {
      icon: assets.notification.calendar,
      title: "Напоминание о бронировании",
      description: "У вас завтра бронь в BronFitness",
      time: "09:00",
    },
    {
      icon: assets.notification.card,
      title: "Платеж успешно выполнен",
      description: "Платеж на 98 000 сум прошол успешно!",
      time: "09:00",
    },
    {
      icon: assets.notification.discount,
      title: "Акция для вас!",
      description: "Скидка 20% на все услуги до конца недели!",
      time: "09:00",
    },
  ]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    setNotifications([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="grid place-items-center rounded-full p-[18px] hover:bg-[#FAFAFF] transition-colors"
        aria-label="Уведомления"
        aria-expanded={isOpen}
      >
        <Image src={assets.header.notification} alt="" className="opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-[2px] z-50 min-w-[650px] rounded-[18px] bg-white px-5 py-4 shadow-lg border border-[#f4f4f8]">
          <div className="flex pb-[19px] justify-between border-b-3 border-[#FAFAFF]">
            <h1 className="font-semibold text-[20px] text-black">Уведомления</h1>
            <button
              type="button"
              className="grid place-items-center rounded-full p-[5px] bg-[#FAFAFF] hover:bg-[#eaeaff] active:scale-95 transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              <Image src={assets.header.close} alt="close" />
            </button>
          </div>
          {
            notifications.length > 0 ?
              <div className="mt-3">
                <span className="block font-semibold text-[13px] text-black opacity-60 mb-[14px]">Сегодня</span>
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
                  <span className="font-semibold text-[16px] text-[#0A6AF7]">Удалить все прочитаные</span>
                </button>
              </div> :
              <NotificationEmpty />
          }
        </div>
      )}
    </div>
  );
}
