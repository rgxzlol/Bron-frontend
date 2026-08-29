import { apiRequest } from "./client";
import type { Booking, Staff, StaffCreate, StaffListItem, StaffUpdate, WorkingHours } from "./types";

export const staffApi = {
  list: () => apiRequest<StaffListItem[]>("/staff/"),

  get: (staffId: number) =>
    apiRequest<Staff>(`/staff/${staffId}`),

  listByBusiness: (businessId: number) =>
    apiRequest<StaffListItem[]>(`/staff/business/${businessId}`),

  schedule: (staffId: number) =>
    apiRequest<WorkingHours[]>(`/staff/${staffId}/schedule`),

  bookings: (staffId: number, token?: string) =>
    apiRequest<Booking[]>(`/staff/${staffId}/bookings`, {
      auth: true,
      token,
    }),

  create: (body: StaffCreate, token?: string) =>
    apiRequest<Staff>("/staff/create", {
      method: "POST",
      body,
      auth: true,
      token,
    }),

  update: (staffId: number, body: StaffUpdate, token?: string) =>
    apiRequest<Staff>(`/staff/${staffId}`, {
      method: "PUT",
      body,
      auth: true,
      token,
    }),

  remove: (staffId: number, token?: string) =>
    apiRequest<unknown>(`/staff/${staffId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};
