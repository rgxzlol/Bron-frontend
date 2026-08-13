import type { Metadata } from "next";
import { BookingNav } from "@/components/features/booking/BookingNav";
import BookingsPageClient, {
  BookingsPageHeading,
} from "@/components/features/booking/BookingsPageClient";

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
      <BookingsPageHeading />

      <BookingNav />

      <BookingsPageClient currentTab={currentTab} />
    </main>
  );
}
