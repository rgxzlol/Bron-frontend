"use client";

import { assets } from "@/lib/assets";
import Button from "@/components/shared/Button";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";

const steps = [
  {
    step: 1,
    titleKey: "home.step1Title",
    descriptionKey: "home.step1Desc",
  },
  {
    step: 2,
    titleKey: "home.step2Title",
    descriptionKey: "home.step2Desc",
  },
  {
    step: 3,
    titleKey: "home.step3Title",
    descriptionKey: "home.step3Desc",
  },
  {
    step: 4,
    titleKey: "home.step4Title",
    descriptionKey: "home.step4Desc",
  },
] as const;

export default function WhyUs() {
  const { t } = useTranslation();

  return (
    <section className="my-[36px] mb-[100px]">
      <h2 className="mb-[16px] text-[24px] font-semibold">{t("home.howItWorks")}</h2>

      <div className="flex flex-col gap-[22px] sm:flex-row sm:flex-wrap xl:flex-nowrap">
        {steps.map(({ step, titleKey, descriptionKey }) => (
          <div
            key={step}
            className="flex flex-1 items-center gap-[13px] rounded-[24px] bg-white py-4.5 pl-3 pr-5 pt-3.5"
          >
            <p className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-[#f9f9fd] text-[32px] font-semibold text-blue-600">
              {step}
            </p>
            <div className="flex flex-col gap-[7px]">
              <p className="max-w-[90px] font-semibold">{t(titleKey)}</p>
              <p className="max-w-[144px] text-[14px] font-semibold opacity-75">
                {t(descriptionKey)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-[70px] flex flex-col gap-4 overflow-hidden rounded-[24px] bg-white px-6 py-[27px] xl:flex-row xl:overflow-visible xl:px-[32px]">
        <div className="xl:flex-1">
          <div className="mb-8 flex flex-col gap-[9px] xl:mb-[70px]">
            <p className="max-w-[400px] text-[24px] font-semibold xl:text-[32px]">
              {t("home.businessTitle")}
            </p>
            <p className="max-w-[210px] font-semibold opacity-75">
              {t("home.businessSubtitle")}
            </p>
          </div>
          <Link href={routes.businessApplication} data-testid="business-get-started-btn">
            <Button
              text={t("home.start")}
              as="span"
              className="inline-block cursor-pointer"
            />
          </Link>
        </div>
        <Image
          className="mx-auto h-auto w-[220px] xl:absolute xl:right-0 xl:top-[-155px] xl:mx-0 xl:w-[493px]"
          src={assets.marketing.homePng}
          alt={t("home.businessAlt")}
          width={493}
          height={442}
        />
      </div>
    </section>
  );
}
