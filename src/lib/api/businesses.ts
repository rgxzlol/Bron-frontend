import { apiRequest, apiUploadRequest } from "./client";
import type {
  Business,
  BusinessCreate,
  BusinessCreateResponse,
  BusinessListItem,
  BusinessStats,
  BusinessUpdate,
  BusinessViewResponse,
} from "./types";
import { assertApiImage } from "./media";

export const businessesApi = {
  list: () => apiRequest<BusinessListItem[]>("/businesses"),

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

  recordView: (businessId: number, token?: string) =>
    apiRequest<BusinessViewResponse>(`/businesses/${businessId}/view`, {
      method: "POST",
      auth: Boolean(token),
      token,
    }),

  create: (body: BusinessCreate, token?: string) =>
    apiRequest<BusinessCreateResponse>("/businesses/create", {
      method: "POST",
      body,
      auth: true,
      token,
    }),

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

  uploadLogo: (businessId: number, image: File | Blob, token?: string) => {
    assertApiImage(image);
    const formData = new FormData();
    formData.append("image", image);
    return apiUploadRequest<import("./types").BusinessLogoResponse>(
      `/businesses/${businessId}/logo`,
      formData,
      { auth: true, token },
    );
  },

  deleteLogo: (businessId: number, token?: string) =>
    apiRequest<unknown>(`/businesses/${businessId}/logo`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};
