"use client";

import HeroPhotoCarousel from "@/components/features/home/hero-photo-carousel";
import FindSpotButton from "@/components/features/home/FindSpotButton";
import { useTranslation } from "@/lib/i18n/useTranslation";
import s from "./homePage.module.css";

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section
      className={`${s.homeSection} flex flex-col items-center gap-[42px] rounded-[34px] bg-white px-5 py-8 lg:flex-row lg:items-start md:px-[32px] md:py-[38px]`}
    >
      <div className="flex w-full flex-col items-center lg:items-start md:max-w-[471px]">
        <h1 className="max-w-[350px] text-[28px] font-semibold mb-[15px] md:text-[36px]">
          {t("home.heroTitle")}
        </h1>
        <p className="mb-[53px] font-semibold">
          {t("home.heroSubtitle")}
        </p>
        <FindSpotButton />
      </div>
      <HeroPhotoCarousel />
    </section>
  );
}
