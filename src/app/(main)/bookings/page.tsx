import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingNav } from "@/components/features/booking/BookingNav";
import { BookingsPageTitle } from "@/components/features/booking/BookingsPageTitle";
import BookingsPageClient from "@/components/features/booking/BookingsPageClient";

export const metadata: Metadata = { title: "My bookings" };

export default function BookingsPage() {
  return (
    <main data-testid="bookings-page">
      <BookingsPageTitle />

      <Suspense fallback={null}>
        <BookingNav />
      </Suspense>

      <Suspense fallback={null}>
        <BookingsPageClient />
      </Suspense>
    </main>
  );
}
