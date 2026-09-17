import { apiRequest } from "./client";
import type {
  Booking,
  BookingCreate,
  BookingListItem,
  BookingUpdate,
} from "./types";

export const bookingsApi = {
  create: (body: BookingCreate, token?: string) =>
    apiRequest<Booking>("/bookings/create", {
      method: "POST",
      body,
      auth: true,
      token,
    }),

  my: (token?: string) =>
    apiRequest<BookingListItem[]>("/bookings/my", { auth: true, token }),

  get: (bookingId: number) =>
    apiRequest<Booking>(`/bookings/${bookingId}`),

  update: (bookingId: number, body: BookingUpdate, token?: string) =>
    apiRequest<Booking>(`/bookings/${bookingId}`, {
      method: "PUT",
      body,
      auth: true,
      token,
    }),

  remove: (bookingId: number, token?: string) =>
    apiRequest<unknown>(`/bookings/${bookingId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),

  listByBusiness: (businessId: number, token?: string) =>
    apiRequest<Booking[]>(`/bookings/business/${businessId}`, {
      auth: true,
      token,
    }),

  listByStaff: (staffId: number, token?: string) =>
    apiRequest<Booking[]>(`/bookings/staff/${staffId}`, {
      auth: true,
      token,
    }),

  availableSlots: (params: {
    business_id: number;
    service_id: number;
    branch_id: number;
    date: string;
    staff_id?: number;
  }) => {
    const query = new URLSearchParams({
      business_id: String(params.business_id),
      service_id: String(params.service_id),
      branch_id: String(params.branch_id),
      date: params.date,
    });

    if (params.staff_id != null) {
      query.set("staff_id", String(params.staff_id));
    }

    return apiRequest<string[]>(`/bookings/available-slots?${query.toString()}`);
  },

  cancel: (bookingId: number, token?: string) =>
    apiRequest<Booking>(`/bookings/${bookingId}/cancel`, {
      method: "PATCH",
      auth: true,
      token,
    }),

  approve: (bookingId: number, token?: string) =>
    apiRequest<Booking>(`/bookings/${bookingId}/approve`, {
      method: "PATCH",
      auth: true,
      token,
    }),

  reject: (bookingId: number, token?: string) =>
    apiRequest<Booking>(`/bookings/${bookingId}/reject`, {
      method: "PATCH",
      auth: true,
      token,
    }),
};
