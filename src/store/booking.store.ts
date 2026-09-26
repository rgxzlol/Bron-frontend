import { create } from "zustand";
import { persist } from "zustand/middleware";
import { bookingsApi, businessesApi } from "@/lib/api";
import { normalizeBookingTime } from "@/lib/booking/classify";
import type {
  Booking,
  BookingCreate,
  BookingListItem,
  BookingReschedule,
} from "@/lib/api/types";
import { useBusinessStore } from "@/store/business.store";
import { useNotificationStore } from "@/store/notification.store";
import { ApiError } from "@/lib/api/client";
import { getAuthToken } from "@/lib/api/token";

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
    ...(payload.items?.length ? { items: payload.items } : {}),
    ...(payload.total_price != null ? { total_price: payload.total_price } : {}),
  };
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
    status: booking.status || "pending",
    total_price: extras?.total_price ?? booking.total_price,
    business_id: booking.business_id ?? extras?.business_id,
    guest_count: extras?.guest_count ?? booking.guest_count,
    items: extras?.items?.length ? extras.items : booking.items,
  };
}

function mergeListItem(prev: BookingListItem | undefined, item: BookingListItem): BookingListItem {
  if (!prev) {
    return {
      ...item,
      status: item.status || "pending",
      start_time: normalizeBookingTime(item.start_time) ?? item.start_time,
      end_time: normalizeBookingTime(item.end_time) ?? item.end_time,
    };
  }

  return {
    ...prev,
    ...item,
    status: item.status || prev.status || "pending",
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
    total_price: item.total_price ?? prev.total_price,
    business_id: item.business_id ?? prev.business_id,
  };
}

function mergeBookings(
  remote: BookingListItem[],
  local: BookingListItem[],
): BookingListItem[] {
  const localById = new Map(local.map((item) => [item.id, item]));
  return remote.map((item) => {
    const byId = localById.get(item.id);
    return mergeListItem(byId, item);
  });
}

async function enrichBookingForDisplay(item: BookingListItem) {
  try {
    const detail = await bookingsApi.get(item.id);
    const business = await businessesApi.get(detail.business_id);
    return {
      ...item,
      ...detail,
      business_id: detail.business_id,
      business_name: business.name,
      business_address: business.address,
      business_category:
        typeof business.category === "string"
          ? business.category
          : business.category.name,
      business_logo: business.logo,
    };
  } catch (error) {
    console.error(`Не удалось загрузить детали брони ${item.id}:`, error);
    return item;
  }
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

  const without = bookings.filter((booking) => booking.id !== item.id);

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
  rescheduleBooking: (bookingId: number, payload: BookingReschedule) => Promise<void>;
  cancelBooking: (bookingId: number) => Promise<void>;
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      bookings: [],
      isLoading: false,
      error: null,

      fetchMyBookings: async () => {
        if (get().isLoading) return;

        const hasLocal = get().bookings.length > 0;
        if (!hasLocal) {
          set({ isLoading: true, error: null });
        } else {
          set({ error: null });
        }

        try {
          const remote = await Promise.all(
            (await bookingsApi.my()).map(enrichBookingForDisplay),
          );
          const previousById = new Map(
            get().bookings.map((booking) => [booking.id, booking]),
          );
          remote.forEach((booking) => {
            const previous = previousById.get(booking.id);
            if (previous && previous.status !== booking.status) {
              useNotificationStore.getState().addBookingStatusNotification(
                booking.id,
                booking.status,
                booking.booking_date,
                booking.start_time,
              );
            }
          }          );
          const merged = mergeBookings(remote, get().bookings);
          set({
            bookings: merged,
            isLoading: false,
          });
        } catch (error) {
          const local = get().bookings;
          set({
            bookings: local,
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Не удалось загрузить бронирования",
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
            status: booking.status || "pending",
            items: booking.items?.length ? booking.items : payload.items,
            total_price: booking.total_price || payload.total_price || 0,
          };
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Не удалось создать бронирование" });
          throw error;
        }

        const listItem = toListItem(booking, listExtras);
        set((state) => ({
          bookings: upsertBooking(state.bookings, listItem),
        }));

        useNotificationStore.getState().addLocalNotification({
          id: `local-booking-${booking.id}`,
          type: "booking",
          title:
            booking.status === "approved" || booking.status === "accepted"
              ? "Бронирование подтверждено"
              : "Бронирование создано",
          description: `Бронь на ${booking.booking_date} в ${booking.start_time}${
            booking.status === "approved" || booking.status === "accepted"
              ? " подтверждена"
              : " отправлена бизнесу на подтверждение"
          }`,
        });
        useNotificationStore.getState().addBookingReminder(
          booking.id,
          booking.booking_date,
          booking.start_time,
        );

        try {
          const remote = await Promise.all(
            (await bookingsApi.my()).map(enrichBookingForDisplay),
          );
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
        if (bookingId > 0) {
          const updated = await bookingsApi.reschedule(bookingId, {
            booking_date: payload.booking_date,
            start_time: toApiTime(payload.start_time),
            end_time: toApiTime(payload.end_time),
          }, getAuthToken() ?? undefined);
          set((state) => ({
            bookings: upsertBooking(state.bookings, toListItem(updated)),
          }));
          useNotificationStore.getState().removeBookingReminder(bookingId);
          useNotificationStore.getState().addBookingReminder(
            bookingId,
            updated.booking_date,
            updated.start_time,
          );
          return;
        }

        const { booking_date, start_time, end_time } = payload;
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

        const updated = get().bookings.find((booking) => booking.id === bookingId);
        if (updated) {
          useNotificationStore.getState().removeBookingReminder(bookingId);
          useNotificationStore.getState().addBookingReminder(
            bookingId,
            updated.booking_date,
            updated.start_time,
          );
        }
      },

      cancelBooking: async (bookingId) => {
        try {
          await bookingsApi.cancel(bookingId);
        } catch (error) {
          if (
            !(error instanceof ApiError) ||
            (error.status !== 404 && error.status !== 405)
          ) {
            throw error;
          }
          await bookingsApi.remove(bookingId);
        }

        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "cancelled" }
              : booking,
          ),
        }));

        useNotificationStore.getState().addLocalNotification({
          id: `local-booking-status-${bookingId}-cancelled-by-user`,
          type: "booking",
          title: "Бронирование отменено",
          description: "Вы отменили бронирование",
        });
      },
    }),
    {
      name: "booking-storage",
      version: 4,
      migrate: () => {
        return {
          // Clear records from the former demo-booking flow. Real bookings
          // are reloaded from the API after authentication.
          bookings: [],
        };
      },
      partialize: (state) => ({ bookings: state.bookings }),
    },
  ),
);
