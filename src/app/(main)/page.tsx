"use client";

import { useEffect } from "react";
import HeroSection from "@/components/features/home/HeroSection";
import Categories from "@/components/features/home/Categories";
import Popular from "@/components/features/home/Popular";
import WhyUs from "@/components/features/home/WhyUs";
import BusinessFormModal from "@/components/features/home/BusinessFormModal";
import { useBusinessFormStore } from "@/store/businessForm.store";

export default function Home() {
  const isFormOpen = useBusinessFormStore((state) => state.isFormOpen);
  const hasHydrated = useBusinessFormStore((state) => state.hasHydrated);

  useEffect(() => {
    useBusinessFormStore.persist.rehydrate();
  }, []);

  if (!hasHydrated) {
    return <div className="ml-[50px]" />;
  }

  if (isFormOpen) {
    return (
      <div className="ml-[50px]">
        <BusinessFormModal />
      </div>
    );
  }

  return (
    <div className="ml-[50px]">
      <HeroSection />
      <Categories />
      <Popular />
      <WhyUs />
    </div>
  );
}