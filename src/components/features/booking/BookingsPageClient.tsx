"use client";

import { useEffect } from "react";
import { BookingCard } from "@/components/features/booking/BookingCard";
import { useBookingStore } from "@/store/booking.store";
import { useAuthStore } from "@/store/auth.store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { translateErrorMessage } from "@/lib/i18n/labels";

type BookingsPageClientProps = {
  currentTab: string;
};

export function BookingsPageHeading() {
  const { t } = useTranslation();

  return (
    <h1 className="font-semibold text-[32px] text-[var(--text-primary)] mb-[22px]">
      {t("meta.bookings")}
    </h1>
  );
}

export default function BookingsPageClient({ currentTab }: BookingsPageClientProps) {
  const token = useAuthStore((state) => state.token);
  const { bookings, isLoading, error, fetchMyBookings } = useBookingStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (token) {
      void fetchMyBookings();
    }
  }, [token, fetchMyBookings]);

  const filtered = bookings.filter((booking) => {
    const isFinished = ["finished", "completed", "cancelled", "canceled"].includes(
      booking.status.toLowerCase(),
    );
    return currentTab === "finished" ? isFinished : !isFinished;
  });

  if (!token) {
    return (
      <p className="text-[var(--text-secondary)] font-semibold">
        {t("bookings.loginRequired")}
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-[var(--text-secondary)] font-semibold">{t("bookings.loading")}</p>;
  }

  if (error) {
    return (
      <p className="text-[#e92026] font-semibold">
        {translateErrorMessage(t, error)}
      </p>
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="text-[var(--text-secondary)] font-semibold">
        {currentTab === "finished" ? t("bookings.emptyFinished") : t("bookings.emptyUpcoming")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-[25px] pt-[75px] pb-[75px]">
      {filtered.map((booking) => (
        <BookingCard
          key={booking.id}
          status={currentTab === "finished" ? "finished" : "upcoming"}
          bookingDate={booking.booking_date}
          bookingTime={booking.start_time}
          totalPrice={booking.total_price}
        />
      ))}
    </div>
  );
}
