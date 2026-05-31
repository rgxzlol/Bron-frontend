import HeroPhotoCarousel from "@/components/HeroPhotoCarousel";
import Button from "@/components/UI/Button";
import Categories from "@/components/UI/Categories";
import Popular from "@/components/UI/Popular";
import WhyUs from "@/components/WhyUs";

export default function Home() {
  return (
    <div className="ml-[70px]" >
      <div className="flex flex-wrap items-center gap-[10px] bg-white rounded-[34px] py-[38px] px-[32px]">
        <div className="max-w-[471px] flex flex-col gap-[15px]">
          <h4 className="text-[36px] font-semibold max-w-[350px] ">
            Бронируй только в лучших сервисах
          </h4>
          <p className="font-semibold">
            Салон красоты,здоровье,спа,фитнес клуб,образованике и многое другое
            в твоем распорежении
          </p>
          <Button text='Найти местечко' />
        </div>
        <HeroPhotoCarousel />
      </div>
      <Categories/>
      <Popular/>
      <WhyUs/>
    </div>
  );
}
