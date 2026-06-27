import { apiRequest } from "./client";
import type {
  BlockedDate,
  BlockedDateCreate,
  BlockedDateUpdate,
} from "./types";

export const blockedDatesApi = {
  getByBusiness: (businessId: number) =>
    apiRequest<BlockedDate[]>(`/blocked-dates/business/${businessId}`),

  get: (blockedDateId: number) =>
    apiRequest<BlockedDate>(`/blocked-dates/${blockedDateId}`),

  create: (body: BlockedDateCreate, token?: string) =>
    apiRequest<BlockedDate>("/blocked-dates/create", {
      method: "POST",
      body,
      auth: true,
      token,
    }),

  update: (blockedDateId: number, body: BlockedDateUpdate, token?: string) =>
    apiRequest<BlockedDate>(`/blocked-dates/${blockedDateId}`, {
      method: "PUT",
      body,
      auth: true,
      token,
    }),

  remove: (blockedDateId: number, token?: string) =>
    apiRequest<unknown>(`/blocked-dates/${blockedDateId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};
