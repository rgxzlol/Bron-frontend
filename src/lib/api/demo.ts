import { ApiError } from "./client";
import { DEMO_BUSINESS_BOOKINGS } from "@/lib/business/demoBookings";
import type { Booking, BookingListItem, LoginResponse } from "./types";

/**
 * Демо-режим: подставные ответы API на случай, когда удалённый бэкенд
 * недоступен (сейчас uzbalpha.pythonanywhere.com отдаёт заглушку хостинга).
 * Позволяет пройти все флоу приложения без сервера.
 */

let demoBookingId = 100;

const demoBookings: Booking[] = [
  {
    id: 1,
    user_id: 1,
    business_id: 1,
    service_id: 1,
    branch_id: 1,
    staff_id: null,
    booking_date: "2026-09-12",
    start_time: "12:00",
    end_time: "13:00",
    guest_count: 12,
    total_price: 98000,
    status: "confirmed",
  },
  {
    id: 2,
    user_id: 1,
    business_id: 1,
    service_id: 1,
    branch_id: 1,
    staff_id: null,
    booking_date: "2026-10-03",
    start_time: "18:00",
    end_time: "19:00",
    guest_count: 2,
    total_price: 98000,
    status: "confirmed",
  },
  {
    id: 3,
    user_id: 1,
    business_id: 1,
    service_id: 1,
    branch_id: 1,
    staff_id: null,
    booking_date: "2026-05-12",
    start_time: "12:00",
    end_time: "13:00",
    guest_count: 12,
    total_price: 98000,
    status: "completed",
  },
  {
    id: 4,
    user_id: 1,
    business_id: 1,
    service_id: 1,
    branch_id: 1,
    staff_id: null,
    booking_date: "2026-04-20",
    start_time: "10:00",
    end_time: "11:00",
    guest_count: 1,
    total_price: 80000,
    status: "completed",
  },
];

function toListItem(booking: Booking): BookingListItem {
  return {
    id: booking.id,
    booking_date: booking.booking_date,
    start_time: booking.start_time,
    end_time: booking.end_time,
    status: booking.status,
    total_price: booking.total_price,
    business_id: booking.business_id,
    guest_count: booking.guest_count,
  };
}

const demoNotificationSettings = {
  push: true,
  email: true,
  bookingReminder: true,
  promotions: false,
};

const demoInAppNotifications = [
  { id: "booking-1", type: "booking" as const, time: "09:00", read: true },
  { id: "payment-1", type: "payment" as const, time: "09:00", read: true },
  { id: "promotion-1", type: "promotion" as const, time: "09:00", read: true },
];

const demoUser = {
  id: 1,
  username: "Иван Иванович",
  email: "ivan@gmail.com",
  phone: "+998 99 999 99 99",
  telegram_id: null,
  role: "user",
  language: "ru",
  is_verified: true,
  notification_settings: demoNotificationSettings,
};

/**
 * Возвращает демо-ответ для известного эндпоинта или undefined,
 * если эндпоинт не поддерживается (тогда ошибка пробрасывается дальше).
 */
export function getDemoResponse(
  path: string,
  method: string,
  body?: unknown,
): unknown {
  const cleanPath = path.split("?")[0].replace(/\/$/, "") || "/";
  const m = method.toUpperCase();

  if (m === "POST" && cleanPath === "/auth/login") {
    const username =
      body && typeof body === "object" && "username" in body
        ? String((body as { username: unknown }).username)
        : demoUser.username;
    return {
      access_token: "demo-token",
      user_id: demoUser.id,
      username,
    } satisfies LoginResponse;
  }

  if (m === "POST" && cleanPath === "/auth/register") return { ok: true };

  if (m === "GET" && cleanPath === "/auth/me") return demoUser;

  if (m === "GET" && cleanPath === "/bookings/my") {
    return demoBookings.map(toListItem);
  }

  const businessBookingsMatch = cleanPath.match(/^\/bookings\/business\/(\d+)$/);
  if (m === "GET" && businessBookingsMatch) {
    const businessId = Number(businessBookingsMatch[1]);
    return DEMO_BUSINESS_BOOKINGS.filter((booking) => booking.business_id === businessId);
  }

  const approveMatch = cleanPath.match(/^\/bookings\/(\d+)\/approve$/);
  if (m === "PATCH" && approveMatch) {
    const id = Number(approveMatch[1]);
    const booking = DEMO_BUSINESS_BOOKINGS.find((item) => item.id === id);
    if (booking) {
      booking.status = "approved";
      return booking;
    }
    return { ok: true };
  }

  const rejectMatch = cleanPath.match(/^\/bookings\/(\d+)\/reject$/);
  if (m === "PATCH" && rejectMatch) {
    const id = Number(rejectMatch[1]);
    const booking = DEMO_BUSINESS_BOOKINGS.find((item) => item.id === id);
    if (booking) {
      booking.status = "rejected";
      return booking;
    }
    return { ok: true };
  }

  if (m === "POST" && cleanPath === "/bookings/create") {
    const payload = (body ?? {}) as Partial<Booking>;
    const businessId = Number(payload.business_id ?? 1);
    const branchId = Number(payload.branch_id ?? 1);
    const bookingDate = String(payload.booking_date ?? "2026-09-01");
    const startTime = String(payload.start_time ?? "12:00");

    const conflict = demoBookings.find(
      (item) =>
        item.business_id === businessId &&
        item.branch_id === branchId &&
        item.booking_date === bookingDate &&
        item.start_time === startTime &&
        item.status !== "cancelled" &&
        item.status !== "rejected",
    );

    if (conflict) {
      throw new ApiError(409, "Slot no longer available");
    }

    const booking: Booking = {
      id: ++demoBookingId,
      user_id: demoUser.id,
      business_id: businessId,
      service_id: Number(payload.service_id ?? 1),
      branch_id: branchId,
      staff_id: null,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: String(payload.end_time ?? "13:00"),
      guest_count: Number(payload.guest_count ?? 1),
      total_price: 98000,
      status: "confirmed",
    };
    demoBookings.unshift(booking);
    return booking;
  }

  const bookingMatch = cleanPath.match(/^\/bookings\/(\d+)$/);
  if (bookingMatch) {
    const id = Number(bookingMatch[1]);
    const index = demoBookings.findIndex((item) => item.id === id);

    if (m === "DELETE") {
      if (index >= 0) demoBookings.splice(index, 1);
      return { ok: true };
    }
    if (m === "PUT" || m === "PATCH") {
      if (index >= 0) {
        const patch = (body ?? {}) as {
          status?: string | null;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
        };
        if (patch.status) demoBookings[index].status = patch.status;
        if (patch.booking_date) demoBookings[index].booking_date = patch.booking_date;
        if (patch.start_time) demoBookings[index].start_time = patch.start_time;
        if (patch.end_time) demoBookings[index].end_time = patch.end_time;
        return demoBookings[index];
      }
      return { ok: true };
    }
    if (m === "GET" && index >= 0) return demoBookings[index];
  }

  if (m === "GET" && (cleanPath === "/businesses" || cleanPath === "/businesses/my")) {
    return [];
  }

  if (cleanPath === "/users/profile") {
    if (m === "PUT" || m === "PATCH") {
      const patch = (body ?? {}) as Partial<typeof demoUser>;
      if (typeof patch.username === "string") demoUser.username = patch.username;
      if (typeof patch.email === "string") demoUser.email = patch.email;
      if (typeof patch.phone === "string") demoUser.phone = patch.phone;
      if (typeof patch.language === "string") demoUser.language = patch.language;
    }
    return { ...demoUser, notification_settings: { ...demoNotificationSettings } };
  }

  if (cleanPath === "/users/profile/notifications") {
    if (m === "PUT" || m === "PATCH") {
      const patch = (body ?? {}) as Partial<typeof demoNotificationSettings>;
      if (typeof patch.push === "boolean") demoNotificationSettings.push = patch.push;
      if (typeof patch.email === "boolean") demoNotificationSettings.email = patch.email;
      if (typeof patch.bookingReminder === "boolean") {
        demoNotificationSettings.bookingReminder = patch.bookingReminder;
      }
      if (typeof patch.promotions === "boolean") {
        demoNotificationSettings.promotions = patch.promotions;
      }
    }
    return { ...demoNotificationSettings };
  }

  if (cleanPath === "/users/notifications/read" && m === "DELETE") {
    const remaining = demoInAppNotifications.filter((item) => !item.read);
    demoInAppNotifications.splice(0, demoInAppNotifications.length, ...remaining);
    return [...demoInAppNotifications];
  }

  if (cleanPath === "/users/notifications" && m === "GET") {
    return [...demoInAppNotifications];
  }

  if (cleanPath.startsWith("/users/")) return { ok: true };

  return undefined;
}
