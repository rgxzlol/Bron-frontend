"use client";

import HeroSection from "@/components/features/home/HeroSection";
import Categories from "@/components/features/home/Categories";
import Popular from "@/components/features/home/Popular";
import WhyUs from "@/components/features/home/WhyUs";
import SearchResults from "@/components/features/home/SearchResults";
import { useSearchStore } from "@/store/search.store";
import s from "./homePage.module.css";

export default function HomePageContent() {
  const submittedQuery = useSearchStore((state) => state.submittedQuery);

  return (
    <div className={s.homePage}>
      <HeroSection />
      <SearchResults />
      {!submittedQuery ? <Categories /> : null}
      {!submittedQuery ? <Popular /> : null}
      <WhyUs />
    </div>
  );
}
