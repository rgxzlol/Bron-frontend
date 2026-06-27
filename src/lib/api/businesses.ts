import { apiRequest } from "./client";
import type {
  Business,
  BusinessCreate,
  BusinessListItem,
  BusinessUpdate,
} from "./types";

export const businessesApi = {
  list: () => apiRequest<BusinessListItem[]>("/businesses/"),

  get: (businessId: number) =>
    apiRequest<Business>(`/businesses/${businessId}`),

  create: async (body: BusinessCreate, token?: string) => {
    const result = await apiRequest<Business | null>("/businesses/create", {
      method: "POST",
      body,
      auth: true,
      token,
    });
    return result;
  },

  update: (businessId: number, body: BusinessUpdate, token?: string) =>
    apiRequest<Business>(`/businesses/${businessId}`, {
      method: "PUT",
      body,
      auth: true,
      token,
    }),

  remove: (businessId: number, token?: string) =>
    apiRequest<unknown>(`/businesses/${businessId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};
