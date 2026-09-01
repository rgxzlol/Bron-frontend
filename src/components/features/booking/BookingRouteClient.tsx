"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { routes } from "@/config/routes";
import { useAuthReady } from "@/lib/auth/useAuthReady";
import { resolveShopById } from "@/lib/home/discovery";
import { canShowShopOnMap } from "@/lib/map/mapVisibility";
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
  const authReady = useAuthReady();
  const token = useAuthStore((state) => state.token);
  const shopId = Number.parseInt(searchParams.get("shopId") ?? "", 10);
  const [shop, setShop] = useState<ShopsType | null>(null);
  const [isShopLoading, setIsShopLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(shopId)) {
      setShop(null);
      setIsShopLoading(false);
      return;
    }

    let cancelled = false;
    setIsShopLoading(true);

    void resolveShopById(shopId)
      .then((resolvedShop) => {
        if (cancelled) return;

        setShop(
          resolvedShop && canShowShopOnMap(resolvedShop) ? resolvedShop : null,
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsShopLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  useEffect(() => {
    if (!authReady || isShopLoading) return;

    if (!token) {
      router.replace(routes.login);
      return;
    }

    if (!shop) {
      router.replace(routes.home);
    }
  }, [authReady, isShopLoading, token, shop, router]);

  if (!authReady || isShopLoading || !token || !shop) return null;

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
