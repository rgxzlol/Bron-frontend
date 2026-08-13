"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export const SupportModal = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-4 rounded-3xl bg-white w-full font-semibold text-[20px] text-black transition-all duration-200 hover:bg-[#f2f2f7] active:scale-[0.98]"
      >
        {t("supportModal.trigger")}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setIsOpen(false)}
        >
          <section
            className="w-full max-w-211.25 bg-slate-50 rounded-[30px] px-7 pt-5 pb-9 flex-col justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h1 className="text-black text-3xl font-semibold text-center mb-4.5">
              {t("supportModal.title")}
            </h1>
            <div className="flex flex-col gap-2.5 mb-8">
              <a
                href="https://t.me/Bron_Suport"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1.5 group text-left"
              >
                <span className="text-black text-xl font-semibold">
                  {t("supportModal.telegram")}
                </span>
                <div className="bg-white rounded-3xl py-7.5 px-6 w-full transition-all duration-200 group-hover:border-blue-500 group-hover:shadow-md group-active:scale-[0.99] group-active:bg-gray-50">
                  <span className="text-black text-2xl font-semibold  group-hover:text-blue-600 transition-colors">
                    @Bron_Suport
                  </span>
                </div>
              </a>

              <a
                href="tel:+998999999999"
                className="flex flex-col gap-1.5 group text-left"
              >
                <span className="text-black text-xl font-semibold">
                  {t("profile.phone")}
                </span>
                <div className="bg-white rounded-3xl py-7.5 px-6 w-full transition-all duration-200 group-hover:border-blue-500 group-hover:shadow-md group-active:scale-[0.99] group-active:bg-gray-50">
                  <span className="text-black text-2xl font-semibold  group-hover:text-blue-600 transition-colors">
                    +998 99 999 99 99
                  </span>
                </div>
              </a>

              <a
                href="mailto:Bron_Suport@gmail.com"
                className="flex flex-col gap-1.5 group text-left"
              >
                <span className="text-black text-xl font-semibold">Email</span>
                <div className="bg-white rounded-3xl py-7.5 px-6 w-full transition-all duration-200 group-hover:border-blue-500 group-hover:shadow-md group-active:scale-[0.99] group-active:bg-gray-50">
                  <span className="text-black text-2xl font-semibold  group-hover:text-blue-600 transition-colors">
                    Bron_Suport@gmail.com
                  </span>
                </div>
              </a>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full h-20 bg-blue-600 rounded-3xl p-6 transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
            >
              <span className=" text-white text-2xl font-semibold">
                {t("common.close")}
              </span>
            </button>
          </section>
        </div>
      )}
    </>
  );
};
