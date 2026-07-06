import { apiRequest } from "./client";
import type {
  Business,
  BusinessCreate,
  BusinessListItem,
  BusinessStats,
  BusinessUpdate,
} from "./types";

export const businessesApi = {
  list: () => apiRequest<BusinessListItem[]>("/businesses/"),

  search: (query: string) =>
    apiRequest<Business[]>(
      `/businesses/search?q=${encodeURIComponent(query)}`,
    ),

  byCategory: (category: string) =>
    apiRequest<Business[]>(
      `/businesses/category/${encodeURIComponent(category)}`,
    ),

  get: (businessId: number) =>
    apiRequest<Business>(`/businesses/${businessId}`),

  stats: (businessId: number, token?: string) =>
    apiRequest<BusinessStats>(`/businesses/${businessId}/stats`, {
      auth: true,
      token,
    }),

  analytics: (businessId: number, token?: string) =>
    apiRequest<unknown>(`/businesses/${businessId}/analytics`, {
      auth: true,
      token,
    }),

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
