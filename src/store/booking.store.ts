import { create } from "zustand";
import { persist } from "zustand/middleware";
import { bookingsApi } from "@/lib/api";
import { getDemoMyBookings } from "@/lib/api/demo";
import { normalizeBookingTime } from "@/lib/booking/classify";
import type {
  Booking,
  BookingCreate,
  BookingListItem,
  BookingUpdate,
} from "@/lib/api/types";
import { useBusinessStore } from "@/store/business.store";

function toApiTime(value: string) {
  return normalizeBookingTime(value) ?? value.trim();
}

function toApiCreatePayload(payload: BookingCreate): BookingCreate {
  return {
    business_id: payload.business_id,
    service_id: payload.service_id,
    branch_id: payload.branch_id,
    ...(payload.staff_id != null ? { staff_id: payload.staff_id } : {}),
    booking_date: payload.booking_date,
    start_time: toApiTime(payload.start_time),
    end_time: toApiTime(payload.end_time),
    guest_count: payload.guest_count ?? 1,
    product_ids: payload.product_ids ?? [],
  };
}

function slotKey(item: {
  business_id?: number | null;
  booking_date?: string | null;
  start_time?: string | null;
}) {
  const time = normalizeBookingTime(item.start_time) ?? item.start_time ?? "";
  const business = item.business_id != null ? String(item.business_id) : "*";
  return `${business}|${item.booking_date ?? ""}|${time.slice(0, 5)}`;
}

function toListItem(
  booking: Booking,
  extras?: Partial<
    Pick<
      BookingListItem,
      | "items"
      | "total_price"
      | "guest_count"
      | "booking_date"
      | "start_time"
      | "end_time"
      | "business_id"
    >
  >,
): BookingListItem {
  const start =
    normalizeBookingTime(booking.start_time) ??
    normalizeBookingTime(extras?.start_time) ??
    booking.start_time;
  const end =
    normalizeBookingTime(booking.end_time) ??
    normalizeBookingTime(extras?.end_time) ??
    booking.end_time;

  return {
    id: booking.id,
    booking_date: booking.booking_date || extras?.booking_date || "",
    start_time: start,
    end_time: end,
    status: booking.status || "confirmed",
    total_price: extras?.total_price ?? booking.total_price,
    business_id: booking.business_id ?? extras?.business_id,
    guest_count: extras?.guest_count ?? booking.guest_count,
    items: extras?.items?.length ? extras.items : booking.items,
  };
}

function buildLocalBooking(payload: BookingCreate): Booking {
  return {
    id: -Date.now(),
    user_id: 0,
    business_id: payload.business_id,
    service_id: payload.service_id,
    branch_id: payload.branch_id,
    staff_id: payload.staff_id ?? null,
    booking_date: payload.booking_date,
    start_time: toApiTime(payload.start_time),
    end_time: toApiTime(payload.end_time),
    guest_count: payload.guest_count ?? 1,
    total_price: payload.total_price ?? 0,
    status: "confirmed",
    items: payload.items,
  };
}

function mergeListItem(prev: BookingListItem | undefined, item: BookingListItem): BookingListItem {
  if (!prev) {
    return {
      ...item,
      status: item.status || "confirmed",
      start_time: normalizeBookingTime(item.start_time) ?? item.start_time,
      end_time: normalizeBookingTime(item.end_time) ?? item.end_time,
    };
  }

  return {
    ...prev,
    ...item,
    status: item.status || prev.status || "confirmed",
    booking_date: item.booking_date || prev.booking_date,
    start_time:
      normalizeBookingTime(item.start_time) ??
      normalizeBookingTime(prev.start_time) ??
      item.start_time ??
      prev.start_time,
    end_time:
      normalizeBookingTime(item.end_time) ??
      normalizeBookingTime(prev.end_time) ??
      item.end_time ??
      prev.end_time,
    items: item.items?.length ? item.items : prev.items,
    guest_count: item.guest_count ?? prev.guest_count,
    total_price: item.total_price || prev.total_price,
    business_id: item.business_id ?? prev.business_id,
  };
}

function mergeBookings(
  remote: BookingListItem[],
  local: BookingListItem[],
): BookingListItem[] {
  if (remote.length === 0) {
    return local;
  }

  const remoteIds = new Set(remote.map((item) => item.id));
  const localById = new Map(local.map((item) => [item.id, item]));
  const usedLocalIds = new Set<number>();

  const mergedRemote = remote.map((item) => {
    const byId = localById.get(item.id);
    if (byId) {
      usedLocalIds.add(byId.id);
      return mergeListItem(byId, item);
    }

    // Local optimistic booking (negative id) with the same slot → fold extras in.
    const remoteSlot = slotKey(item);
    const bySlot = local.find(
      (candidate) =>
        candidate.id < 0 &&
        !usedLocalIds.has(candidate.id) &&
        slotKey(candidate) === remoteSlot,
    );
    if (bySlot) {
      usedLocalIds.add(bySlot.id);
      return mergeListItem(bySlot, item);
    }

    return mergeListItem(undefined, item);
  });

  const localOnly = local.filter((item) => !remoteIds.has(item.id) && !usedLocalIds.has(item.id));
  return [...mergedRemote, ...localOnly];
}

function upsertBooking(
  bookings: BookingListItem[],
  item: BookingListItem,
): BookingListItem[] {
  const byId = bookings.find((booking) => booking.id === item.id);
  if (byId) {
    const normalized = mergeListItem(byId, item);
    return [normalized, ...bookings.filter((booking) => booking.id !== normalized.id)];
  }

  const itemSlot = slotKey(item);

  // Optimistic local booking: fold into an existing server row for the same slot.
  if (item.id < 0) {
    const bySlot = bookings.find(
      (booking) => booking.id > 0 && slotKey(booking) === itemSlot,
    );
    if (bySlot) {
      const normalized = mergeListItem(bySlot, { ...item, id: bySlot.id });
      return [
        normalized,
        ...bookings.filter(
          (booking) => booking.id !== bySlot.id && booking.id !== item.id,
        ),
      ];
    }
  }

  const without = bookings.filter((booking) => {
    if (booking.id === item.id) return false;
    // Drop optimistic duplicate once we have a server id for the same slot.
    if (item.id > 0 && booking.id < 0 && slotKey(booking) === itemSlot) {
      return false;
    }
    return true;
  });

  return [mergeListItem(undefined, item), ...without];
}

type BookingStore = {
  bookings: BookingListItem[];
  isLoading: boolean;
  error: string | null;
  fetchMyBookings: () => Promise<void>;
  createBooking: (payload: BookingCreate) => Promise<Booking>;
  updateBooking: (
    bookingId: number,
    payload: Parameters<typeof bookingsApi.update>[1],
  ) => Promise<Booking>;
  rescheduleBooking: (bookingId: number, payload: BookingUpdate) => Promise<void>;
  cancelBooking: (bookingId: number) => Promise<void>;
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      bookings: [],
      isLoading: false,
      error: null,

      fetchMyBookings: async () => {
        const hasLocal = get().bookings.length > 0;
        if (!hasLocal) {
          set({ isLoading: true, error: null });
        } else {
          set({ error: null });
        }

        try {
          const remote = await bookingsApi.my();
          const merged = mergeBookings(remote, get().bookings);
          set({
            bookings:
              merged.length > 0
                ? merged
                : get().bookings.length > 0
                  ? get().bookings
                  : getDemoMyBookings(),
            isLoading: false,
          });
        } catch {
          const local = get().bookings;
          set({
            bookings: local.length > 0 ? local : getDemoMyBookings(),
            isLoading: false,
            error: null,
          });
        }
      },

      createBooking: async (payload) => {
        const listExtras = {
          items: payload.items,
          total_price: payload.total_price,
          guest_count: payload.guest_count,
          booking_date: payload.booking_date,
          start_time: payload.start_time,
          end_time: payload.end_time,
          business_id: payload.business_id,
        };

        let booking: Booking;

        try {
          booking = await bookingsApi.create(toApiCreatePayload(payload));
          // Prefer values the user actually booked if the API omits them.
          booking = {
            ...booking,
            business_id: booking.business_id || payload.business_id,
            booking_date: booking.booking_date || payload.booking_date,
            start_time: booking.start_time || payload.start_time,
            end_time: booking.end_time || payload.end_time,
            guest_count: booking.guest_count || payload.guest_count || 1,
            status: booking.status || "confirmed",
            items: booking.items?.length ? booking.items : payload.items,
            total_price: booking.total_price || payload.total_price || 0,
          };
        } catch (error) {
          console.warn("Booking API create failed, saving locally:", error);
          booking = buildLocalBooking(payload);
        }

        const listItem = toListItem(booking, listExtras);
        set((state) => ({
          bookings: upsertBooking(state.bookings, listItem),
        }));

        try {
          const remote = await bookingsApi.my();
          set({
            bookings: upsertBooking(
              mergeBookings(remote, get().bookings),
              listItem,
            ),
          });
        } catch {
          // Keep the locally upserted booking.
        }

        void useBusinessStore
          .getState()
          .refreshBusinessBookings(String(payload.business_id));

        return booking;
      },

      updateBooking: async (bookingId, payload) => {
        const booking = await bookingsApi.update(bookingId, payload);
        const listItem = toListItem(booking);
        set((state) => ({
          bookings: upsertBooking(state.bookings, listItem),
        }));
        return booking;
      },

      rescheduleBooking: async (bookingId, payload) => {
        const { booking_date, start_time, end_time } = payload;

        try {
          await bookingsApi.update(bookingId, {
            booking_date,
            start_time: start_time ? toApiTime(start_time) : start_time,
            end_time: end_time ? toApiTime(end_time) : end_time,
          });
        } catch {
          // Keep local UI in sync even if the remote API ignores date/time fields.
        }

        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === bookingId
              ? {
                  ...booking,
                  ...(booking_date ? { booking_date } : {}),
                  ...(start_time ? { start_time: toApiTime(start_time) } : {}),
                  ...(end_time ? { end_time: toApiTime(end_time) } : {}),
                }
              : booking,
          ),
        }));
      },

      cancelBooking: async (bookingId) => {
        try {
          await bookingsApi.cancel(bookingId);
        } catch {
          try {
            await bookingsApi.remove(bookingId);
          } catch {
            // Still mark cancelled locally.
          }
        }

        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "cancelled" }
              : booking,
          ),
        }));
      },
    }),
    {
      name: "booking-storage",
      version: 3,
      migrate: (persisted) => {
        const state = persisted as { bookings?: BookingListItem[] } | null;
        return {
          bookings: Array.isArray(state?.bookings) ? state.bookings : [],
        };
      },
      partialize: (state) => ({ bookings: state.bookings }),
    },
  ),
);
