import type { Metadata } from "next";
import { BookingNav } from "@/components/features/booking/BookingNav";
import BookingsPageClient from "@/components/features/booking/BookingsPageClient";

export const metadata: Metadata = { title: "Мои брони" };

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || "upcoming";

  return (
    <main>
      <h1 className="font-semibold text-[32px] text-[var(--text-primary)] mb-[22px]">
        Мои брони
      </h1>

      <BookingNav />

      <BookingsPageClient currentTab={currentTab} />
    </main>
  );
}
