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
    status: booking.status,
    total_price: booking.total_price,
  };
}

const demoUser = {
  id: 1,
  username: "Иван Иванович",
  email: "ivan@gmail.com",
  phone: "+998 99 999 99 99",
  telegram_id: null,
  role: "user",
  language: "ru",
  is_verified: true,
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

  if (m === "POST" && cleanPath === "/bookings/create") {
    const payload = (body ?? {}) as Partial<Booking>;
    const booking: Booking = {
      id: ++demoBookingId,
      user_id: demoUser.id,
      business_id: Number(payload.business_id ?? 1),
      service_id: Number(payload.service_id ?? 1),
      branch_id: Number(payload.branch_id ?? 1),
      staff_id: null,
      booking_date: String(payload.booking_date ?? "2026-09-01"),
      start_time: String(payload.start_time ?? "12:00"),
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
        const patch = (body ?? {}) as { status?: string | null };
        if (patch.status) demoBookings[index].status = patch.status;
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
      if (typeof patch.email === "string") demoUser.email = patch.email;
      if (typeof patch.phone === "string") demoUser.phone = patch.phone;
      if (typeof patch.language === "string") demoUser.language = patch.language;
    }
    return { ...demoUser };
  }

  if (cleanPath.startsWith("/users/")) return { ok: true };

  return undefined;
}
