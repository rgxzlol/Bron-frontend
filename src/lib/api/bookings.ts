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
