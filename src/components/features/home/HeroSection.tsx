import Button from "@/components/shared/Button";
import HeroPhotoCarousel from "@/components/features/home/hero-photo-carousel";

export default function HeroSection() {
  return (
    <section className="flex flex-nowrap items-center gap-[42px] rounded-[34px] bg-white px-[32px] py-[38px]">
      <div className="flex max-w-[471px] flex-col">
        <h1 className="max-w-[350px] text-[36px] font-semibold mb-[15px] ">
          Бронируй только в лучших сервисах
        </h1>
        <p className="mb-[53px] font-semibold">
          Салон красоты, здоровье, спа, фитнес клуб, образование и многое другое
          в твоем распоряжении
        </p>
        <a href="#categories">
          <Button text="Найти местечко" />
        </a>
      </div>
      <HeroPhotoCarousel />
    </section>
  );
}
