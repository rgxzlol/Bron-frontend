"use client";

import { faqItems, supportContactCards, supportContacts } from "@/data/support";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Image from "next/image";
import { useState } from "react";

const contactButtonClassName =
  "inline-flex items-center justify-center rounded-[21px] border border-[#0a6af7] px-[32px] py-[14px] text-[24px] font-semibold text-[#0a6af7] transition hover:bg-[#0a6af7]/5 w-full";

const CONTACT_COPY: Record<
  "phone" | "telegram" | "email",
  { titleKey: string; descKey: string; buttonKey?: string }
> = {
  phone: { titleKey: "support.callTitle", descKey: "support.callDesc" },
  telegram: { titleKey: "Telegram", descKey: "support.telegramDesc" },
  email: {
    titleKey: "Email",
    descKey: "support.emailDesc",
    buttonKey: "support.writeEmail",
  },
};

const FAQ_COPY: Record<
  (typeof faqItems)[number]["id"],
  { q: string; a: string }
> = {
  "change-booking": { q: "support.faqChangeQ", a: "support.faqChangeA" },
  "payment-methods": { q: "support.faqPayQ", a: "support.faqPayA" },
  "view-bookings": { q: "support.faqViewQ", a: "support.faqViewA" },
  "how-booking-works": { q: "support.faqHowQ", a: "support.faqHowA" },
  security: { q: "support.faqSecurityQ", a: "support.faqSecurityA" },
};

export default function Support() {
  const { t } = useTranslation();
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  function toggleFaq(id: string) {
    setOpenFaqId((current) => (current === id ? null : id));
  }

  return (
    <div className="ml-[50px] py-[24px] pb-[80px]">
      <header className="mb-[32px]">
        <h1 className="text-[36px] font-semibold">{t("support.title")}</h1>
        <p className="mt-[8px] text-[16px] font-semibold opacity-75">
          {t("support.subtitle")}
        </p>
      </header>

      <div className="mb-[48px] grid grid-cols-3 gap-[22px]">
        {supportContactCards.map((card) => {
          const copy = CONTACT_COPY[card.id];
          const title =
            copy.titleKey.startsWith("support.") ? t(copy.titleKey) : copy.titleKey;
          const href =
            card.id === "email"
              ? `mailto:${supportContacts.email}?subject=${encodeURIComponent(t("support.emailSubject"))}`
              : card.href;
          const buttonText =
            card.buttonText ??
            (copy.buttonKey ? t(copy.buttonKey) : "");

          return (
            <article
              key={card.id}
              className="flex flex-col rounded-[24px] bg-white px-[24px] py-[28px]">
              <div className="mb-[24px] flex items-start gap-[16px]">
                <div className="flex px-[50px] py-[40px] shrink-0 items-center justify-center rounded-[32px] bg-[#e8f1ff]">
                  <Image src={card.icon} alt="" width={70} height={70} />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <h2 className="text-[24px] font-semibold">{title}</h2>
                  <p className="max-w-[170px] font-semibold">
                    {t(copy.descKey)}
                  </p>
                </div>
              </div>

              <a
                href={href}
                className={`${contactButtonClassName} mt-auto w-fit`}
                {...(card.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {buttonText}
              </a>
            </article>
          );
        })}
      </div>

      <section>
        <h2 className="mb-[20px] text-[24px] font-semibold">
          {t("support.faqTitle")}
        </h2>

        <div className="flex flex-col gap-[21px]">
          {faqItems.map((item) => {
            const isOpen = openFaqId === item.id;
            const copy = FAQ_COPY[item.id];

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-[24px] bg-white"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-[16px] px-[24px] py-[20px] text-left"
                  aria-expanded={isOpen}
                  onClick={() => toggleFaq(item.id)}
                >
                  <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[14px] bg-[#e8f1ff]">
                    <Image
                      src={item.icon}
                      alt=""
                      width={24}
                      height={24}
                      className="brightness-0"
                    />
                  </div>

                  <span className="flex-1 text-[20px] font-semibold">
                    {t(copy.q)}
                  </span>

                  <span
                    className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center text-[#0a6af7] transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  >
                    <svg
                      width="16"
                      height="10"
                      viewBox="0 0 16 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 1.5L8 8.5L15 1.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                {isOpen && (
                  <div className="px-[24px] pb-[20px] pl-[24px]">
                    <p className="text-[18px] leading-relaxed opacity-75">
                      {t(copy.a)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
