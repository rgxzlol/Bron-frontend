"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShopsPlace } from "@/data/shops";
import { routes } from "@/config/routes";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { resolveShopById } from "@/lib/home/discovery";
import { useAuthStore } from "@/store/auth.store";
import type { ShopsType } from "@/types/shops.types";
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
  const [shop, setShop] = useState<ShopsType | null>(() =>
    ShopsPlace.find((item) => item.id === shopId) ?? null,
  );
  const [isResolvingShop, setIsResolvingShop] = useState(
    () => !ShopsPlace.some((item) => item.id === shopId),
  );

  useEffect(() => {
    if (!Number.isFinite(shopId)) {
      setShop(null);
      setIsResolvingShop(false);
      return;
    }

    const mockShop = ShopsPlace.find((item) => item.id === shopId) ?? null;
    if (mockShop) {
      setShop(mockShop);
      setIsResolvingShop(false);
      return;
    }

    let cancelled = false;
    setIsResolvingShop(true);

    void resolveShopById(shopId)
      .then((resolvedShop) => {
        if (!cancelled) {
          setShop(resolvedShop);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolvingShop(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      router.replace(routes.login);
      return;
    }

    if (!isResolvingShop && !shop) {
      router.replace(routes.home);
    }
  }, [hydrated, token, shop, isResolvingShop, router]);

  if (!hydrated || !token || isResolvingShop || !shop) return null;

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
