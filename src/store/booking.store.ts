import { create } from "zustand";
import { bookingsApi } from "@/lib/api";
import { getDemoMyBookings } from "@/lib/api/demo";
import type { Booking, BookingListItem, BookingUpdate } from "@/lib/api/types";
import { useBusinessStore } from "@/store/business.store";

function resolveBookingsWithDemo(bookings: BookingListItem[]) {
  if (bookings.length > 0) {
    return bookings;
  }

  return getDemoMyBookings();
}

type BookingStore = {
  bookings: BookingListItem[];
  isLoading: boolean;
  error: string | null;
  fetchMyBookings: () => Promise<void>;
  createBooking: (payload: Parameters<typeof bookingsApi.create>[0]) => Promise<Booking>;
  updateBooking: (
    bookingId: number,
    payload: Parameters<typeof bookingsApi.update>[1],
  ) => Promise<Booking>;
  rescheduleBooking: (bookingId: number, payload: BookingUpdate) => Promise<void>;
  cancelBooking: (bookingId: number) => Promise<void>;
};

export const useBookingStore = create<BookingStore>((set) => ({
  bookings: [],
  isLoading: false,
  error: null,

  fetchMyBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const bookings = resolveBookingsWithDemo(await bookingsApi.my());
      set({ bookings, isLoading: false });
    } catch {
      set({ bookings: getDemoMyBookings(), isLoading: false, error: null });
    }
  },

  createBooking: async (payload) => {
    const booking = await bookingsApi.create(payload);
    const list = await bookingsApi.my();
    set({ bookings: list });
    void useBusinessStore
      .getState()
      .refreshBusinessBookings(String(payload.business_id));
    return booking;
  },

  updateBooking: async (bookingId, payload) => {
    const booking = await bookingsApi.update(bookingId, payload);
    const list = await bookingsApi.my();
    set({ bookings: list });
    return booking;
  },

  rescheduleBooking: async (bookingId, payload) => {
    const { booking_date, start_time, end_time } = payload;

    try {
      await bookingsApi.update(bookingId, { booking_date, start_time, end_time });
    } catch {
      // Keep local UI in sync even if the remote API ignores date/time fields.
    }

    set((state) => ({
      bookings: state.bookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              ...(booking_date ? { booking_date } : {}),
              ...(start_time ? { start_time } : {}),
              ...(end_time ? { end_time } : {}),
            }
          : booking,
      ),
    }));
  },

  cancelBooking: async (bookingId) => {
    try {
      await bookingsApi.cancel(bookingId);
    } catch {
      await bookingsApi.remove(bookingId);
    }
    const list = await bookingsApi.my();
    set({ bookings: list });
  },
}));
