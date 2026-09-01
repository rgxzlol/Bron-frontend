"use client";

import { useEffect, useId, useState } from "react";
import { supportContacts } from "@/data/support";

export const SupportModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full rounded-3xl bg-white p-4 text-[20px] font-semibold text-black transition-all duration-200 hover:bg-[#f2f2f7] active:scale-[0.98]"
      >
        Тех.Поддержка
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex w-full max-w-211.25 flex-col justify-center rounded-[30px] bg-slate-50 px-7 pt-5 pb-9"
            onClick={(event) => event.stopPropagation()}
          >
            <h1 id={titleId} className="mb-4.5 text-center text-3xl font-semibold text-black">
              Тех.Поддержка
            </h1>

            <div className="mb-8 flex flex-col gap-2.5">
              <a
                href={supportContacts.telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1.5 text-left"
              >
                <span className="text-xl font-semibold text-black">Телеграм</span>
                <div className="w-full rounded-3xl bg-white px-6 py-7.5 transition-all duration-200 group-hover:border-blue-500 group-hover:shadow-md group-active:scale-[0.99] group-active:bg-gray-50">
                  <span className="text-2xl font-semibold text-black transition-colors group-hover:text-blue-600">
                    @{supportContacts.telegram}
                  </span>
                </div>
              </a>

              <a
                href={supportContacts.phoneHref}
                aria-label={`Позвонить ${supportContacts.phone}`}
                className="group flex flex-col gap-1.5 text-left"
              >
                <span className="text-xl font-semibold text-black">Номер телефона</span>
                <div className="w-full rounded-3xl bg-white px-6 py-7.5 transition-all duration-200 group-hover:border-blue-500 group-hover:shadow-md group-active:scale-[0.99] group-active:bg-gray-50">
                  <span className="text-2xl font-semibold text-black transition-colors group-hover:text-blue-600">
                    {supportContacts.phone}
                  </span>
                </div>
              </a>

              <a
                href={`mailto:${supportContacts.email}`}
                aria-label={`Написать на ${supportContacts.email}`}
                className="group flex flex-col gap-1.5 text-left"
              >
                <span className="text-xl font-semibold text-black">Email</span>
                <div className="w-full rounded-3xl bg-white px-6 py-7.5 transition-all duration-200 group-hover:border-blue-500 group-hover:shadow-md group-active:scale-[0.99] group-active:bg-gray-50">
                  <span className="text-2xl font-semibold text-black transition-colors group-hover:text-blue-600">
                    {supportContacts.email}
                  </span>
                </div>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-20 w-full rounded-3xl bg-blue-600 p-6 transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
            >
              <span className="text-2xl font-semibold text-white">Закрыть</span>
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
};
