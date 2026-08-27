import Button from "@/components/shared/Button";
import HeroPhotoCarousel from "@/components/features/home/hero-photo-carousel";

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center gap-[42px] rounded-[34px] bg-white px-5 py-8 md:flex-row md:px-[32px] md:py-[38px]">
      <div className="flex w-full flex-col md:max-w-[471px]">
        <h1 className="max-w-[350px] text-[28px] font-semibold mb-[15px] md:text-[36px]">
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
