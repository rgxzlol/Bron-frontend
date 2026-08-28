import type { Metadata } from "next";
import { Suspense } from "react";
import BookingRouteClient from "@/components/features/booking/BookingRouteClient";

export const metadata: Metadata = {
  title: "Бронирование",
};

export default function BookPage() {
  return (
    <Suspense fallback={null}>
      <BookingRouteClient variant="page" />
    </Suspense>
  );
}
