"use client";

import { useEffect } from "react";
import { BookingNav } from "@/components/features/booking/BookingNav";
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

  const filtered = bookings.filter((booking) => {
    const isFinished = ["finished", "completed", "cancelled", "canceled"].includes(
      booking.status.toLowerCase(),
    );
    return currentTab === "finished" ? isFinished : !isFinished;
  });

  if (!token) {
    return (
      <p className="text-[var(--text-secondary)] font-semibold">
        Войдите в аккаунт, чтобы увидеть свои брони.
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-[var(--text-secondary)] font-semibold">Загрузка броней...</p>;
  }

  if (error) {
    return <p className="text-[#e92026] font-semibold">{error}</p>;
  }

  if (filtered.length === 0) {
    return (
      <p className="text-[var(--text-secondary)] font-semibold">
        {currentTab === "finished" ? "Завершённых броней пока нет." : "Предстоящих броней пока нет."}
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
