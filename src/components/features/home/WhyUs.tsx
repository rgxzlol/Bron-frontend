import { assets } from "@/lib/assets";
import Button from "@/components/shared/Button";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { useTranslations } from 'next-intl';

import { steps } from "@/data/whyUs";

export default function WhyUs() {
  const t = useTranslations('WhyUs');
  const tData = useTranslations('data');
  const td = (text: string) => text?.startsWith('data.') ? tData(text.replace('data.', '') as any) : text;

  return (
    <section className="my-[36px] mb-[100px]">
      <h2 className="mb-[16px] text-[24px] font-semibold">{t('title')}</h2>

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
              <p className="max-w-[90px] font-semibold">{td(title)}</p>
              <p className="max-w-[144px] text-[14px] font-semibold opacity-75">
                {td(description)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-[70px] flex bg-white py-[27px] px-[32px] rounded-[24px]">
        <div>
          <div className="mb-[70px] flex flex-col gap-[9px]">
            <p className="max-w-[400px] text-[32px] font-semibold">
              {t('businessTitle')}
            </p>
            <p className="max-w-[210px] font-semibold opacity-75">
              {t('businessDesc')}
            </p>
          </div>
          <Link href={routes.business}>
            <Button text={t('start')} as="span" className="cursor-pointer inline-block" />
          </Link>
        </div>
        <Image
          className="absolute right-0 top-[-155px]"
          src={assets.marketing.homePng}
          alt={t('businessAlt')}
          width={493}
          height={442}
        />
      </div>
    </section>
  );
}
