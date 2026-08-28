"use client";

import { Suspense } from "react";
import BookingRouteClient from "@/components/features/booking/BookingRouteClient";

export default function BookModalSlotPage() {
  return (
    <Suspense fallback={null}>
      <BookingRouteClient variant="sheet" />
    </Suspense>
  );
}
