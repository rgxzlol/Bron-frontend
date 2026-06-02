import HeroSection from "@/components/features/home/HeroSection";
import Categories from "@/components/features/home/Categories";
import Popular from "@/components/features/home/Popular";
import WhyUs from "@/components/features/home/WhyUs";

export default function Home() {
  return (
    <div className="ml-[50px]">
      <HeroSection />
      <Categories />
      <Popular />
      <WhyUs />
    </div>
  );
}
