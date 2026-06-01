"use client";

import { useState } from "react";
import FullMap from "@/components/features/map/FullMap";
import BookingPage from "@/components/features/map/BookingPage";
import type { ShopsType } from "@/types/shops.types";

export type MapBookingState = {
  shop: ShopsType;
  serviceIds?: string[];
};

export default function MapPage() {
  const [booking, setBooking] = useState<MapBookingState | null>(null);

  if (booking) {
    return (
      <BookingPage
        shop={booking.shop}
        selectedServiceIds={booking.serviceIds}
        onBack={() => setBooking(null)}
      />
    );
  }

  return <FullMap onStartBooking={(shop, serviceIds) => setBooking({ shop, serviceIds })} />;
}
