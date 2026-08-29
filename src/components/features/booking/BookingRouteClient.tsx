"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShopsPlace } from "@/data/shops";
import { routes } from "@/config/routes";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { useAuthStore } from "@/store/auth.store";
import BookingModal from "./BookingModal";
import BookingPage from "@/components/features/map/BookingPage";

type BookingRouteClientProps = {
  variant?: "sheet" | "page";
};

export default function BookingRouteClient({
  variant = "page",
}: BookingRouteClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const shopId = Number.parseInt(searchParams.get("shopId") ?? "", 10);
  const shop = ShopsPlace.find((item) => item.id === shopId) ?? null;

  useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      router.replace(routes.login);
      return;
    }

    if (!shop) {
      router.replace(routes.home);
    }
  }, [hydrated, token, shop, router]);

  if (!hydrated || !token || !shop) return null;

  if (variant === "sheet") {
    return (
      <BookingModal
        isOpen
        shop={shop}
        onClose={() => {
          router.back();
        }}
      />
    );
  }

  return (
    <BookingPage
      shop={shop}
      origin="home"
      onBack={() => {
        router.push(routes.home);
      }}
    />
  );
}
