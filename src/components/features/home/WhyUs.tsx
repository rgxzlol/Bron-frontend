import { assets } from "@/lib/assets";
import Button from "@/components/shared/Button";
import Image from "next/image";

const steps = [
  {
    step: 1,
    title: "Выбираете сервис",
    description: "Выбираете сервис, который вам нужен",
  },
  {
    step: 2,
    title: "Подбираете время",
    description: "Выбираете время и дату",
  },
  {
    step: 3,
    title: "Оплачиваете",
    description: "Оплачиваете выбранный сервис",
  },
  {
    step: 4,
    title: "Получаете услугу",
    description: "Получайте услугу от профессионалов",
  },
] as const;

export default function WhyUs() {
  return (
    <section className="my-[36px] mb-[100px]">
      <h2 className="mb-[16px] text-[24px] font-semibold">Как это работает?</h2>

      <div className="flex gap-[22px]">
        {steps.map(({ step, title, description }) => (
          <div
            key={step}
            className="flex items-center gap-[13px] bg-white px-[15px] py-[15px]"
          >
            <p className="max-w-[80px] rounded-full bg-[#f9f9fd] px-[32px] py-[18px] text-center text-[32px] font-semibold text-[#0a6af7]">
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

      <div className="relative mt-[70px] flex">
        <div>
          <div className="mb-[70px] flex flex-col gap-[9px]">
            <p className="max-w-[400px] text-[32px] font-semibold">
              Для крупных бизнесов и предпринимателей
            </p>
            <p className="max-w-[210px] font-semibold opacity-75">
              Заходи в Bron и развивай свой бизнес
            </p>
          </div>
          <Button text="Начать" />
        </div>
        <Image
          className="absolute right-0 top-[-150px]"
          src={assets.marketing.homePng}
          alt="Bron для бизнеса"
        />
      </div>
    </section>
  );
}
