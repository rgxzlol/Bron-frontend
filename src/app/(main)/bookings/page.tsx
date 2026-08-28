import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingNav } from "@/components/features/booking/BookingNav";
import BookingsPageClient from "@/components/features/booking/BookingsPageClient";

export const metadata: Metadata = { title: "Мои брони" };

export default function BookingsPage() {
  return (
    <main data-testid="bookings-page">
      <h1 className="mb-[22px] text-[32px] font-semibold text-[var(--text-primary)]">
        Мои брони
      </h1>

      <Suspense fallback={null}>
        <BookingNav />
      </Suspense>

      <Suspense fallback={null}>
        <BookingsPageClient />
      </Suspense>
    </main>
  );
}
