"use client";

import { assets } from "@/lib/assets";
import Button from "@/components/shared/Button";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function WhyUs() {
  const { t } = useTranslation();

  const steps = [
    {
      step: 1,
      title: t("home.step1Title"),
      description: t("home.step1Desc"),
    },
    {
      step: 2,
      title: t("home.step2Title"),
      description: t("home.step2Desc"),
    },
    {
      step: 3,
      title: t("home.step3Title"),
      description: t("home.step3Desc"),
    },
    {
      step: 4,
      title: t("home.step4Title"),
      description: t("home.step4Desc"),
    },
  ] as const;

  return (
    <section className="my-[36px] mb-[100px]">
      <h2 className="mb-[16px] text-[24px] font-semibold">{t("home.howItWorks")}</h2>

      <div className="flex gap-[22px]">
        {steps.map(({ step, title, description }) => (
          <div
            key={step}
            className="flex items-center gap-[13px] bg-white pt-3.5 pb-4.5 pl-3 pr-5 rounded-[24px]"
          >
            <p className="w-[74px] h-[74px] flex items-center justify-center rounded-full bg-[#f9f9fd] text-blue-600 text-[32px] font-semibold">
              {step}
            </p>
            <div className="flex flex-col gap-[7px]">
              <p className="max-w-[90px] font-semibold">{title}</p>
              <p className="max-w-[144px] text-[14px] font-semibold opacity-75">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-[70px] flex bg-white py-[27px] px-[32px] rounded-[24px]">
        <div>
          <div className="mb-[70px] flex flex-col gap-[9px]">
            <p className="max-w-[400px] text-[32px] font-semibold">
              {t("home.businessTitle")}
            </p>
            <p className="max-w-[210px] font-semibold opacity-75">
              {t("home.businessSubtitle")}
            </p>
          </div>
          <Link href={routes.business}>
            <Button text={t("home.start")} as="span" className="cursor-pointer inline-block" />
          </Link>
        </div>
        <Image
          className="absolute right-0 top-[-155px]"
          src={assets.marketing.homePng}
          alt={t("home.businessAlt")}
          width={493}
          height={442}
        />
      </div>
    </section>
  );
}
