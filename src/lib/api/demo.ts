import { ApiError } from "./client";
import { DEMO_BUSINESS_BOOKINGS } from "@/lib/business/demoBookings";
import {
  DEMO_BUSINESS_ID,
  getDemoBusinessBranches,
  getDemoBusinessServices,
  getDemoBusinessStats,
  getDemoOwnedBusinessRecord,
} from "@/lib/business/demoBusiness";
import type { Booking, BookingListItem, LoginResponse } from "./types";

/**
 * Демо-режим: подставные ответы API на случай, когда удалённый бэкенд
 * недоступен (сейчас uzbalpha.pythonanywhere.com отдаёт заглушку хостинга).
 * Позволяет пройти все флоу приложения без сервера.
 */

let demoBookingId = 100;

function formatBookingDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function buildSeedBookings(): Booking[] {
  const today = new Date();

  return [
    {
      id: 1,
      user_id: 1,
      business_id: 1,
      service_id: 1,
      branch_id: 1,
      staff_id: null,
      booking_date: formatBookingDate(addDays(today, 4)),
      start_time: "12:00",
      end_time: "13:00",
      guest_count: 2,
      total_price: 98000,
      status: "confirmed",
      items: [
        {
          id: "service",
          name: "Бронирование зала",
          price: 80000,
          quantity: 1,
          kind: "service",
        },
        {
          id: "protein-bar",
          name: "Протеиновый батончик",
          price: 10000,
          quantity: 1,
          kind: "extra",
        },
        {
          id: "water",
          name: "Минеральная вода",
          price: 8000,
          quantity: 1,
          kind: "extra",
        },
      ],
    },
    {
      id: 2,
      user_id: 1,
      business_id: 2,
      service_id: 1,
      branch_id: 1,
      staff_id: null,
      booking_date: formatBookingDate(addDays(today, 11)),
      start_time: "18:00",
      end_time: "19:00",
      guest_count: 1,
      total_price: 45000,
      status: "confirmed",
      items: [
        {
          id: "service",
          name: "Бронирование столика",
          price: 45000,
          quantity: 1,
          kind: "service",
        },
      ],
    },
    {
      id: 3,
      user_id: 1,
      business_id: 3,
      service_id: 1,
      branch_id: 1,
      staff_id: null,
      booking_date: formatBookingDate(addDays(today, -12)),
      start_time: "10:00",
      end_time: "11:00",
      guest_count: 1,
      total_price: 120000,
      status: "completed",
      items: [
        {
          id: "service",
          name: "Консультация терапевта",
          price: 120000,
          quantity: 1,
          kind: "service",
        },
      ],
    },
  ];
}

const demoBookings: Booking[] = buildSeedBookings();

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
    items: booking.items,
  };
}

export function getDemoMyBookings(): BookingListItem[] {
  return demoBookings.map(toListItem);
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

let demoOwnedBusinesses: Array<ReturnType<typeof getDemoOwnedBusinessRecord>> = [
  getDemoOwnedBusinessRecord(),
];

let demoServiceId = 1;
let demoProductId = 1;

let demoServices = getDemoBusinessServices().map((service) => ({
  ...service,
  business_id: DEMO_BUSINESS_ID,
  image: null as string | null,
}));

let demoProducts: Array<{
  id: number;
  business_id: number;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  is_active: boolean;
}> = [];

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
    const payload = (body ?? {}) as Partial<Booking> & {
      items?: Booking["items"];
      total_price?: number;
    };
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
      total_price: Number(payload.total_price ?? 98000),
      status: "confirmed",
      items: payload.items,
    };
    demoBookings.unshift(booking);
    return booking;
  }

  const cancelMatch = cleanPath.match(/^\/bookings\/(\d+)\/cancel$/);
  if (m === "PATCH" && cancelMatch) {
    const id = Number(cancelMatch[1]);
    const index = demoBookings.findIndex((item) => item.id === id);
    if (index >= 0) {
      demoBookings[index].status = "cancelled";
      return demoBookings[index];
    }
    return { ok: true };
  }

  if (m === "GET" && path.includes("/bookings/available-slots")) {
    return ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
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
    return demoOwnedBusinesses.map((business) => ({
      id: business.id,
      name: business.name,
      category: business.category,
      address: business.address,
      phone: business.phone,
      logo: business.logo,
      owner_id: business.owner_id,
    }));
  }

  const businessDetailMatch = cleanPath.match(/^\/businesses\/(\d+)$/);
  if (businessDetailMatch) {
    const businessId = Number(businessDetailMatch[1]);
    const index = demoOwnedBusinesses.findIndex((item) => item.id === businessId);

    if (m === "GET") {
      const business = demoOwnedBusinesses.find((item) => item.id === businessId);
      return business ?? undefined;
    }

    if (m === "PUT" || m === "PATCH") {
      const patch = (body ?? {}) as Partial<(typeof demoOwnedBusinesses)[number]>;

      if (index >= 0) {
        demoOwnedBusinesses[index] = {
          ...demoOwnedBusinesses[index],
          ...patch,
          id: businessId,
        };
        return demoOwnedBusinesses[index];
      }

      return { ok: true };
    }

    if (m === "DELETE") {
      if (index >= 0) {
        demoOwnedBusinesses.splice(index, 1);
      }
      return { ok: true };
    }
  }

  const businessStatsMatch = cleanPath.match(/^\/businesses\/(\d+)\/stats$/);
  if (m === "GET" && businessStatsMatch && Number(businessStatsMatch[1]) === DEMO_BUSINESS_ID) {
    return getDemoBusinessStats();
  }

  const servicesBusinessMatch = cleanPath.match(/^\/services\/business\/(\d+)$/);
  if (
    m === "GET" &&
    servicesBusinessMatch &&
    Number(servicesBusinessMatch[1]) === DEMO_BUSINESS_ID
  ) {
    return demoServices.map(({ business_id: _businessId, ...item }) => item);
  }

  if (m === "POST" && cleanPath === "/services/create") {
    const payload = (body ?? {}) as {
      business_id?: number;
      title?: string;
      description?: string;
      category?: string;
      duration?: number;
      price?: number;
    };
    const service = {
      id: ++demoServiceId,
      business_id: Number(payload.business_id ?? DEMO_BUSINESS_ID),
      title: String(payload.title ?? "Услуга"),
      description: String(payload.description ?? ""),
      category: String(payload.category ?? "other"),
      duration: Number(payload.duration ?? 60),
      price: Number(payload.price ?? 0),
      is_active: true,
      image: null as string | null,
    };
    demoServices = [service, ...demoServices];
    return service;
  }

  const serviceUpdateMatch = cleanPath.match(/^\/services\/(\d+)$/);
  if (serviceUpdateMatch) {
    const serviceId = Number(serviceUpdateMatch[1]);
    const index = demoServices.findIndex((item) => item.id === serviceId);

    if (m === "PUT" || m === "PATCH") {
      const payload = (body ?? {}) as {
        title?: string;
        description?: string | null;
        category?: string;
        duration?: number;
        price?: number;
        is_active?: boolean;
      };
      const existing = index >= 0 ? demoServices[index] : undefined;
      const updated = {
        id: serviceId,
        business_id: existing?.business_id ?? DEMO_BUSINESS_ID,
        title: payload.title ?? existing?.title ?? "Услуга",
        description: payload.description ?? existing?.description ?? "",
        category: payload.category ?? existing?.category ?? "other",
        duration: payload.duration ?? existing?.duration ?? 60,
        price: payload.price ?? existing?.price ?? 0,
        is_active: payload.is_active ?? existing?.is_active ?? true,
        image: existing?.image ?? null,
      };
      if (index >= 0) demoServices[index] = updated;
      else demoServices = [updated, ...demoServices];
      return updated;
    }

    if (m === "DELETE" && index >= 0) {
      demoServices.splice(index, 1);
      return { ok: true };
    }

    if (m === "GET" && index >= 0) {
      return demoServices[index];
    }
  }

  if (m === "POST" && cleanPath === "/products/create") {
    const payload = (body ?? {}) as {
      business_id?: number;
      name?: string;
      description?: string | null;
      price?: number;
    };
    const product = {
      id: ++demoProductId,
      business_id: Number(payload.business_id ?? DEMO_BUSINESS_ID),
      name: String(payload.name ?? "Товар"),
      description: payload.description ?? null,
      image: null as string | null,
      price: Number(payload.price ?? 0),
      is_active: true,
    };
    demoProducts = [product, ...demoProducts];
    return product;
  }

  const productUpdateMatch = cleanPath.match(/^\/products\/(\d+)$/);
  if (productUpdateMatch) {
    const productId = Number(productUpdateMatch[1]);
    const index = demoProducts.findIndex((item) => item.id === productId);

    if (m === "PUT" || m === "PATCH") {
      const payload = (body ?? {}) as {
        name?: string;
        description?: string | null;
        price?: number;
        is_active?: boolean;
      };
      const existing = index >= 0 ? demoProducts[index] : undefined;
      const updated = {
        id: productId,
        business_id: existing?.business_id ?? DEMO_BUSINESS_ID,
        name: payload.name ?? existing?.name ?? "Товар",
        description: payload.description ?? existing?.description ?? null,
        image: existing?.image ?? null,
        price: payload.price ?? existing?.price ?? 0,
        is_active: payload.is_active ?? existing?.is_active ?? true,
      };
      if (index >= 0) demoProducts[index] = updated;
      else demoProducts = [updated, ...demoProducts];
      return updated;
    }

    if (m === "DELETE" && index >= 0) {
      demoProducts.splice(index, 1);
      return { ok: true };
    }

    if (m === "GET" && index >= 0) {
      return demoProducts[index];
    }
  }

  const productsBusinessMatch = cleanPath.match(/^\/products\/business\/(\d+)$/);
  if (
    m === "GET" &&
    productsBusinessMatch &&
    Number(productsBusinessMatch[1]) === DEMO_BUSINESS_ID
  ) {
    return demoProducts.map(({ business_id: _businessId, ...item }) => item);
  }

  const branchDetailMatch = cleanPath.match(/^\/branches\/(\d+)$/);
  if (m === "GET" && branchDetailMatch && Number(branchDetailMatch[1]) === 1) {
    return getDemoBusinessBranches()[0];
  }

  const galleryBusinessMatch = cleanPath.match(/^\/business-gallery\/business\/(\d+)$/);
  if (
    m === "GET" &&
    galleryBusinessMatch &&
    Number(galleryBusinessMatch[1]) === DEMO_BUSINESS_ID
  ) {
    return [];
  }

  if (m === "POST" && cleanPath === "/businesses/create") {
    const payload = (body ?? {}) as {
      name?: string;
      category?: string;
      address?: string;
      phone?: string;
    };

    const business = {
      id: demoOwnedBusinesses.length + 1,
      owner_id: demoUser.id,
      owner_username: demoUser.username,
      name: String(payload.name ?? ""),
      description: null,
      logo: null,
      category: String(payload.category ?? ""),
      address: String(payload.address ?? ""),
      phone: String(payload.phone ?? ""),
      latitude: null,
      longitude: null,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    demoOwnedBusinesses = [business, ...demoOwnedBusinesses];
    return business;
  }

  if (m === "GET" && (cleanPath === "/branches" || cleanPath === "/staff")) {
    return [];
  }

  const businessBranchesMatch = cleanPath.match(
    /^\/(?:branches\/business|staff\/business|working-hours\/business|blocked-dates\/business)\/(\d+)$/,
  );
  if (m === "GET" && businessBranchesMatch) {
    const businessId = Number(businessBranchesMatch[1]);
    if (businessId === DEMO_BUSINESS_ID && cleanPath.startsWith("/branches/business/")) {
      return getDemoBusinessBranches();
    }
    return [];
  }

  const workingHoursTodayMatch = cleanPath.match(/^\/working-hours\/today\/(\d+)$/);
  if (m === "GET" && workingHoursTodayMatch) {
    return null;
  }

  if (m === "GET" && cleanPath === "/blocked-dates/check") {
    return { is_blocked: false };
  }

  const staffBookingsMatch = cleanPath.match(/^\/staff\/(\d+)\/bookings$/);
  if (m === "GET" && staffBookingsMatch) {
    return [];
  }

  const staffScheduleMatch = cleanPath.match(/^\/staff\/(\d+)\/schedule$/);
  if (m === "GET" && staffScheduleMatch) {
    return [];
  }

  const staffBookingsApiMatch = cleanPath.match(/^\/bookings\/staff\/(\d+)$/);
  if (m === "GET" && staffBookingsApiMatch) {
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
