"use client";

import Button from "@/components/shared/Button";
import HeroPhotoCarousel from "@/components/features/home/hero-photo-carousel";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-nowrap items-center gap-[42px] rounded-[34px] bg-white px-[32px] py-[38px]">
      <div className="flex max-w-[471px] flex-col">
        <h1 className="max-w-[350px] text-[36px] font-semibold mb-[15px] ">
          {t("home.heroTitle")}
        </h1>
        <p className="mb-[53px] font-semibold">
          {t("home.heroSubtitle")}
        </p>
        <a href="#categories">
          <Button text={t("home.findPlace")} />
        </a>
      </div>
      <HeroPhotoCarousel />
    </section>
  );
}
