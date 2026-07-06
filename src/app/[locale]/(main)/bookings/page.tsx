import { getTranslations } from 'next-intl/server';
import type { Metadata } from "next";
import { BookingNav } from "@/components/features/booking/BookingNav";
import { BookingCard } from "@/components/features/booking/BookingCard";

export const metadata: Metadata = { title: "Мои брони" };

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const t = await getTranslations('BookingsPage');

  const resolvedParams = await searchParams;

  const currentTab = resolvedParams.tab || 'upcoming';

  return (
    <main>
      <h1 className="font-semibold text-[32px] text-black mb-[22px]">
        {t('title')}
      </h1>

      <BookingNav />

      <div className="flex flex-col gap-[25px] pt-[75px] pb-[75px]">
        {currentTab === 'upcoming' ? (
          Array.from({ length: 2 }).map((_, i) => <BookingCard status="upcoming" key={i} />)
        ) : (
          Array.from({ length: 4 }).map((_, i) => <BookingCard status="finished" key={i} />)
        )}
      </div>
    </main>
  );
}