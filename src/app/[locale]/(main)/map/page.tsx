"use client";

import { useState, useEffect } from "react";
import FullMap from "@/components/features/map/FullMap";
import BookingPage from "@/components/features/map/BookingPage";
import { ShopsPlace } from "@/data/shops";
import type { ShopsType } from "@/types/shops.types";

export type MapBookingState = {
  shop: ShopsType;
  serviceIds?: string[];
};

export default function MapPage() {
  const [booking, setBooking] = useState<MapBookingState | null>(null);

  useEffect(() => {
    // Read the shopId query parameter on mount safely on the client
    const params = new URLSearchParams(window.location.search);
    const shopIdParam = params.get("shopId");
    if (shopIdParam) {
      const id = parseInt(shopIdParam, 10);
      const foundShop = ShopsPlace.find((s) => s.id === id);
      if (foundShop) {
        setBooking({ shop: foundShop });
      }
    }
  }, []);

  const handleBack = () => {
    setBooking(null);
    // Clear the shopId parameter from the URL bar without reloading
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("shopId");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  };

  if (booking) {
    return (
      <BookingPage
        shop={booking.shop}
        selectedServiceIds={booking.serviceIds}
        onBack={handleBack}
      />
    );
  }

  return <FullMap onStartBooking={(shop, serviceIds) => setBooking({ shop, serviceIds })} />;
}
