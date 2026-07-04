import { apiRequest } from "./client";
import type { Staff, StaffCreate, StaffListItem, StaffUpdate } from "./types";

export const staffApi = {
  list: () => apiRequest<StaffListItem[]>("/staff/"),

  get: (staffId: number) =>
    apiRequest<Staff>(`/staff/${staffId}`),

  listByBusiness: (businessId: number) =>
    apiRequest<StaffListItem[]>(`/staff/business/${businessId}`),

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
