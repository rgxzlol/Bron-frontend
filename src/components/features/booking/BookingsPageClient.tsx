"use client";

import { useEffect } from "react";
import { BookingCard } from "@/components/features/booking/BookingCard";
import { useBookingStore } from "@/store/booking.store";
import { useAuthStore } from "@/store/auth.store";

type BookingsPageClientProps = {
  currentTab: string;
};

export default function BookingsPageClient({ currentTab }: BookingsPageClientProps) {
  const token = useAuthStore((state) => state.token);
  const { bookings, isLoading, error, fetchMyBookings } = useBookingStore();

  useEffect(() => {
    if (token) {
      void fetchMyBookings();
    }
  }, [token, fetchMyBookings]);

  const isPastTab = currentTab === "past";

  const filtered = bookings.filter((booking) => {
    const isFinished = ["finished", "completed", "cancelled", "canceled", "past"].includes(
      booking.status.toLowerCase(),
    );
    return isPastTab ? isFinished : !isFinished;
  });

  if (!token) {
    return (
      <p className="pt-[24px] text-[var(--text-secondary)] font-semibold">
        Войдите в аккаунт, чтобы увидеть свои брони.
      </p>
    );
  }

  if (isLoading) {
    return <p className="pt-[24px] text-[var(--text-secondary)] font-semibold">Загрузка броней...</p>;
  }

  if (error) {
    return <p className="pt-[24px] text-[#e02424] font-semibold">{error}</p>;
  }

  if (filtered.length === 0) {
    return (
      <p className="pt-[24px] text-[var(--text-secondary)] font-semibold">
        {isPastTab ? "Прошлых броней пока нет." : "Предстоящих броней пока нет."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-[20px] pt-[24px] pb-[40px] lg:grid-cols-2 lg:gap-[24px] 2xl:grid-cols-3">
      {filtered.map((booking) => (
        <BookingCard
          key={booking.id}
          bookingId={booking.id}
          status={isPastTab ? "past" : "upcoming"}
          bookingDate={booking.booking_date}
          bookingTime={booking.start_time}
          totalPrice={booking.total_price}
        />
      ))}
    </div>
  );
}
