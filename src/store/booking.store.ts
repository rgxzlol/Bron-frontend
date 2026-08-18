import { create } from "zustand";
import { bookingsApi } from "@/lib/api";
import type { Booking, BookingListItem } from "@/lib/api/types";
import { useBusinessStore } from "@/store/business.store";

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
  cancelBooking: (bookingId: number) => Promise<void>;
};

export const useBookingStore = create<BookingStore>((set) => ({
  bookings: [],
  isLoading: false,
  error: null,

  fetchMyBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const bookings = await bookingsApi.my();
      set({ bookings, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Не удалось загрузить брони",
      });
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

  cancelBooking: async (bookingId) => {
    await bookingsApi.remove(bookingId);
    const list = await bookingsApi.my();
    set({ bookings: list });
  },
}));
