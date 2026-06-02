import Button from "@/components/shared/Button";
import HeroPhotoCarousel from "@/components/features/home/hero-photo-carousel";

export default function HeroSection() {
  return (
    <section className="flex flex-wrap items-center gap-[10px] rounded-[34px] bg-white px-[32px] py-[38px]">
      <div className="flex max-w-[471px] flex-col gap-[15px] mr-[20px]">
        <h1 className="max-w-[350px] text-[36px] font-semibold">
          Бронируй только в лучших сервисах
        </h1>
        <p className="mb-[38px] font-semibold">
          Салон красоты, здоровье, спа, фитнес клуб, образование и многое другое
          в твоем распоряжении
        </p>
        <Button text="Найти местечко" />
      </div>
      <HeroPhotoCarousel />
    </section>
  );
}
