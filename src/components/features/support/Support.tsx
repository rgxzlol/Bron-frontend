"use client";

import { faqItems, supportContactCards } from "@/data/support";
import Image from "next/image";
import { useState } from "react";

const contactButtonClassName =
  "inline-flex items-center justify-center rounded-[10px] border border-[#0a6af7] px-[32px] py-[14px] text-[16px] font-semibold text-[#0a6af7] transition hover:bg-[#0a6af7]/5";

export default function Support() {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  function toggleFaq(id: string) {
    setOpenFaqId((current) => (current === id ? null : id));
  }

  return (
    <div className="ml-[50px] py-[24px] pb-[80px]">
      <header className="mb-[32px]">
        <h1 className="text-[36px] font-semibold">Поддержка</h1>
        <p className="mt-[8px] text-[16px] font-semibold opacity-75">
          Мы всегда готовы вам помочь
        </p>
      </header>

      <div className="mb-[48px] grid grid-cols-3 gap-[22px]">
        {supportContactCards.map((card) => (
          <article
            key={card.id}
            className="flex flex-col rounded-[24px] bg-white px-[24px] py-[28px]"
          >
            <div className="mb-[24px] flex items-start gap-[16px]">
              <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[16px] bg-[#e8f1ff]">
                <Image src={card.icon} alt="" width={28} height={28} />
              </div>
              <div className="flex flex-col gap-[6px]">
                <h2 className="text-[20px] font-semibold">{card.title}</h2>
                <p className="text-[14px] font-semibold opacity-75">
                  {card.description}
                </p>
              </div>
            </div>

            <a
              href={card.href}
              className={`${contactButtonClassName} mt-auto w-fit`}
              {...(card.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {card.buttonText}
            </a>
          </article>
        ))}
      </div>

      <section>
        <h2 className="mb-[20px] text-[24px] font-semibold">
          Часто задаваемые вопросы
        </h2>

        <div className="flex flex-col gap-[12px]">
          {faqItems.map((item) => {
            const isOpen = openFaqId === item.id;

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

                  <span className="flex-1 text-[16px] font-semibold">
                    {item.question}
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
                  <div className="px-[24px] pb-[20px] pl-[88px]">
                    <p className="text-[15px] leading-relaxed opacity-75">
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
