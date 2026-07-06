import Button from "@/components/shared/Button";
import HeroPhotoCarousel from "@/components/features/home/hero-photo-carousel";
import { useTranslations } from 'next-intl';

export default function HeroSection() {
  const t = useTranslations('HeroSection');
  return (
    <section className="flex flex-nowrap items-center gap-[42px] rounded-[34px] bg-white px-[32px] py-[38px]">
      <div className="flex max-w-[471px] flex-col">
        <h1 className="max-w-[350px] text-[36px] font-semibold mb-[15px] ">
          {t('title')}
        </h1>
        <p className="mb-[53px] font-semibold">
          {t('subtitle')}
        </p>
        <a href="#categories">
          <Button text={t('findPlace')} />
        </a>
      </div>
      <HeroPhotoCarousel />
    </section>
  );
}
