"use client";

import { faqItems, supportContacts } from "@/data/support";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function Support() {
  const { t } = useTranslation();
  const router = useRouter();
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const contactCards = useMemo(
    () => [
      {
        id: "phone",
        title: t("support.callTitle"),
        description: t("support.callDesc"),
        buttonText: supportContacts.phone,
        icon: assets.support.phone,
        href: supportContacts.phoneHref,
        testId: "support-call",
      },
      {
        id: "telegram",
        title: "Telegram",
        description: t("support.telegramDesc"),
        buttonText: "Telegram",
        icon: assets.support.tg,
        href: supportContacts.telegramHref,
        external: true,
        testId: "support-telegram",
      },
      {
        id: "email",
        title: "Email",
        description: t("support.emailDesc"),
        buttonText: t("support.writeEmail"),
        icon: assets.support.email,
        href: `mailto:${supportContacts.email}?subject=${encodeURIComponent(t("support.emailSubject"))}`,
        testId: "support-email",
      },
    ],
    [t],
  );

  const localizedFaq = useMemo(
    () => [
      {
        id: "change-booking",
        question: t("support.faqChangeQ"),
        answer: t("support.faqChangeA"),
        icon: faqItems[0].icon,
      },
      {
        id: "payment-methods",
        question: t("support.faqPayQ"),
        answer: t("support.faqPayA"),
        icon: faqItems[1].icon,
      },
      {
        id: "view-bookings",
        question: t("support.faqViewQ"),
        answer: t("support.faqViewA"),
        icon: faqItems[2].icon,
      },
      {
        id: "security",
        question: t("support.faqSecurityQ"),
        answer: t("support.faqSecurityA"),
        icon: faqItems[3].icon,
      },
    ],
    [t],
  );

  function toggleFaq(id: string) {
    setOpenFaqId((current) => (current === id ? null : id));
  }

  return (
    <div className="py-[16px] pb-[80px] lg:py-[24px]" data-testid="support-page">
      <header className="relative mb-[24px] flex min-h-[44px] items-center justify-center lg:mb-[32px] lg:block">
        <button
          type="button"
          aria-label={t("common.back")}
          onClick={() => router.back()}
          className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg-surface-muted)] lg:hidden"
        >
          <svg
            width="9"
            height="16"
            viewBox="0 0 9 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 1L1 8L8 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="text-center lg:text-left">
          <h1 className="text-[24px] font-bold lg:text-[36px] lg:font-semibold">
            {t("support.title")}
          </h1>
          <p className="mt-[2px] text-[13px] font-medium text-[var(--text-muted)] lg:mt-[8px] lg:text-[16px]">
            {t("support.subtitle")}
          </p>
        </div>
      </header>

      <section className="mb-[28px] lg:mb-[48px]">
        <h2 className="mb-[12px] text-[18px] font-bold lg:mb-[20px] lg:text-[24px] lg:font-semibold">
          {t("support.contactUs")}
        </h2>

        <div className="grid grid-cols-1 gap-[12px] md:grid-cols-2 lg:gap-[22px] xl:grid-cols-3">
          {contactCards.map((card) => (
            <article
              key={card.id}
              className="flex items-center gap-[12px] rounded-[14px] bg-[var(--bg-surface)] p-[10px] pr-[14px] lg:gap-[16px] lg:rounded-[24px] lg:p-[16px]"
              data-testid={`support-card-${card.id}`}
            >
              <div className="flex h-[56px] w-[64px] shrink-0 items-center justify-center rounded-[12px] bg-[var(--auth-box)] lg:h-[72px] lg:w-[80px] lg:rounded-[16px]">
                <Image
                  src={card.icon}
                  alt=""
                  width={28}
                  height={28}
                  className="h-[28px] w-[28px] lg:h-[36px] lg:w-[36px]"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-[16px] font-bold lg:text-[20px]">{card.title}</h3>
                <p className="mt-[2px] text-[11px] leading-snug text-[var(--text-muted)] lg:text-[13px]">
                  {card.description}
                </p>
              </div>

              <a
                href={card.href}
                className="shrink-0 rounded-[10px] border-[1.5px] border-[#0a6af7] px-[16px] py-[8px] text-[13px] font-semibold text-[#0a6af7] transition hover:bg-[#0a6af7]/5 lg:px-[22px] lg:py-[10px] lg:text-[15px]"
                data-testid={card.testId}
                {...(card.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {card.buttonText}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section data-testid="support-faq">
        <h2 className="mb-[12px] text-[18px] font-bold lg:mb-[20px] lg:text-[24px] lg:font-semibold">
          {t("support.faqTitle")}
        </h2>

        <div className="flex flex-col gap-[12px] lg:gap-[21px]">
          {localizedFaq.map((item) => {
            const isOpen = openFaqId === item.id;
            const answerId = `support-faq-answer-${item.id}`;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-[14px] bg-[var(--bg-surface)] lg:rounded-[24px]"
                data-testid={`support-faq-item-${item.id}`}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-[14px] p-[10px] pr-[16px] text-left lg:gap-[16px] lg:px-[24px] lg:py-[20px]"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => toggleFaq(item.id)}
                  data-testid={`support-faq-toggle-${item.id}`}
                >
                  <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[#171923] lg:h-[48px] lg:w-[48px] lg:rounded-[14px]">
                    <Image
                      src={item.icon}
                      alt=""
                      width={22}
                      height={22}
                      className="h-[22px] w-[22px] brightness-0 invert"
                    />
                  </div>

                  <span className="flex-1 text-[14px] font-bold lg:text-[20px] lg:font-semibold">
                    {item.question}
                  </span>

                  <span
                    className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center text-[var(--text-muted)] transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  >
                    <svg
                      width="12"
                      height="8"
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
                  <div
                    id={answerId}
                    className="px-[16px] pb-[14px] lg:px-[24px] lg:pb-[20px]"
                    data-testid={answerId}
                  >
                    <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] lg:text-[18px]">
                      {item.answer}
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
