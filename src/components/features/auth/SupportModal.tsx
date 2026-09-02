"use client";

import { useEffect, useId, useState } from "react";
import { supportContacts } from "@/data/support";
import { openSupportEmail } from "@/lib/support/openSupportEmail";
import { useTranslation } from "@/lib/i18n/useTranslation";

export const SupportModal = () => {
  const { t } = useTranslation();
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
            className="flex w-full max-w-211.25 flex-col justify-center rounded-[30px] bg-[var(--bg-surface)] px-7 pt-5 pb-9 text-[var(--text-primary)] shadow-[var(--shadow-modal)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h1 id={titleId} className="mb-4.5 text-center text-3xl font-semibold text-[var(--text-primary)]">
              Тех.Поддержка
            </h1>

            <div className="mb-8 flex flex-col gap-2.5">
              <a
                href={supportContacts.telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1.5 text-left"
              >
                <span className="text-xl font-semibold text-[var(--text-primary)]">Телеграм</span>
                <div className="w-full rounded-3xl bg-[var(--bg-surface-muted)] px-6 py-7.5 transition-all duration-200 group-hover:bg-[var(--bg-hover)] group-active:scale-[0.99]">
                  <span className="text-2xl font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[#3d8df8]">
                    @{supportContacts.telegram}
                  </span>
                </div>
              </a>

              <a
                href={supportContacts.phoneHref}
                aria-label={`Позвонить ${supportContacts.phone}`}
                className="group flex flex-col gap-1.5 text-left"
              >
                <span className="text-xl font-semibold text-[var(--text-primary)]">Номер телефона</span>
                <div className="w-full rounded-3xl bg-[var(--bg-surface-muted)] px-6 py-7.5 transition-all duration-200 group-hover:bg-[var(--bg-hover)] group-active:scale-[0.99]">
                  <span className="text-2xl font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[#3d8df8]">
                    {supportContacts.phone}
                  </span>
                </div>
              </a>

              <button
                type="button"
                onClick={() =>
                  openSupportEmail({
                    email: supportContacts.email,
                    subject: t("support.emailSubject"),
                  })
                }
                aria-label={`${t("support.writeEmail")} ${supportContacts.email}`}
                className="group flex w-full flex-col gap-1.5 text-left"
              >
                <span className="text-xl font-semibold text-[var(--text-primary)]">Email</span>
                <div className="w-full rounded-3xl bg-[var(--bg-surface-muted)] px-6 py-7.5 transition-all duration-200 group-hover:bg-[var(--bg-hover)] group-active:scale-[0.99]">
                  <span className="text-2xl font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[#3d8df8]">
                    {supportContacts.email}
                  </span>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-20 w-full rounded-3xl bg-[#0A6AF7] p-6 transition-all duration-200 hover:bg-[#0858ce] active:scale-[0.98]"
            >
              <span className="text-2xl font-semibold text-white">Закрыть</span>
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
};
