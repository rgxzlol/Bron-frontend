"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BookingCard } from "@/components/features/booking/BookingCard";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useBookingStore } from "@/store/booking.store";
import { useAuthStore } from "@/store/auth.store";

const FINISHED_STATUSES = new Set([
  "finished",
  "completed",
  "cancelled",
  "canceled",
  "past",
  "rejected",
]);

function isFinishedBooking(status: string) {
  return FINISHED_STATUSES.has(status.toLowerCase());
}

export default function BookingsPageClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") === "past" ? "past" : "upcoming";
  const token = useAuthStore((state) => state.token);
  const { bookings, isLoading, error, fetchMyBookings } = useBookingStore();

  useEffect(() => {
    if (token) {
      void fetchMyBookings();
    }
  }, [token, fetchMyBookings]);

  const isPastTab = currentTab === "past";

  const filtered = bookings.filter((booking) => {
    const finished = isFinishedBooking(booking.status);
    return isPastTab ? finished : !finished;
  });

  if (!token) {
    return (
      <p
        className="pt-[24px] font-semibold text-[var(--text-secondary)]"
        data-testid="bookings-login-required"
      >
        {t("bookings.loginRequired")}
      </p>
    );
  }

  if (isLoading) {
    return (
      <p
        className="pt-[24px] font-semibold text-[var(--text-secondary)]"
        data-testid="bookings-loading"
      >
        {t("bookings.loading")}
      </p>
    );
  }

  if (error) {
    return (
      <p className="pt-[24px] font-semibold text-[#e02424]" data-testid="bookings-error">
        {error}
      </p>
    );
  }

  if (filtered.length === 0) {
    return (
      <p
        className="pt-[24px] font-semibold text-[var(--text-secondary)]"
        data-testid="bookings-empty"
      >
        {isPastTab ? t("bookings.emptyFinished") : t("bookings.emptyUpcoming")}
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-1 items-start gap-[20px] pt-[24px] pb-[40px] lg:grid-cols-2 lg:gap-[24px] 2xl:grid-cols-3"
      data-testid={`bookings-list-${currentTab}`}
    >
      {filtered.map((booking) => (
        <BookingCard
          key={booking.id}
          bookingId={booking.id}
          status={isPastTab ? "past" : "upcoming"}
          bookingDate={booking.booking_date}
          bookingTime={booking.start_time}
          bookingEndTime={booking.end_time}
          totalPrice={booking.total_price}
          businessId={booking.business_id}
          bookingStatus={booking.status}
          guestsCount={booking.guest_count}
          orderItems={booking.items}
        />
      ))}
    </div>
  );
}
