"use client";

import { assets } from "@/lib/assets";
import Button from "@/components/shared/Button";
import Image from "next/image";
import { useBusinessFormStore } from "@/store/businessForm.store";

const steps = [
  { step: 1, title: "Выбираете сервис", description: "Выбираете сервис, который вам нужен" },
  { step: 2, title: "Подбираете время", description: "Выбираете время и дату" },
  { step: 3, title: "Оплачиваете", description: "Оплачиваете выбранный сервис" },
  { step: 4, title: "Получаете услугу", description: "Получайте услугу от профессионалов" },
] as const;

export default function WhyUs() {
  const openForm = useBusinessFormStore((state) => state.openForm);

  return (
    <section className="my-[36px] mb-[243px]">
      <h2 className="mb-[16px] text-[24px] font-semibold h-[29px]">
        Как это работает?
      </h2>

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
              <p className="max-w-[130px] max-h-[44px] font-semibold">{title}</p>
              <p className="max-w-[144px] max-h-[34px] text-[14px] font-semibold opacity-70">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-[70px] flex bg-white py-[27px] px-[32px] rounded-[24px]">
        <div>
          <div className="mb-[68px] flex flex-col gap-[9px]">
            <p className="max-w-[458px] text-[32px] font-semibold">
              Для крупных бизнесов и предпринимателей
            </p>
            <p className="max-w-[210px] font-semibold opacity-75">
              Заходи в Bron и развивай свой бизнес
            </p>
          </div>
          <Button
            text="Начать"
            onClick={openForm}
            paddingTop="pt-[16px]"
            paddingRight="pr-[82px]"
            paddingBottom="pb-[16px]"
            paddingLeft="pl-[82px]"
            className="leading-[24px] cursor-pointer inline-block text-[20px]"
          />
        </div>
        <Image
          className="absolute right-0 top-[-155px]"
          src={assets.marketing.homePng}
          alt="Bron для бизнеса"
          width={493}
          height={442}
        />
      </div>
    </section>
  );
}
