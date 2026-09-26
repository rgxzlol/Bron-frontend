import { apiRequest, apiUploadRequest } from "./client";
import type {
  Service,
  ServiceCreate,
  ServiceAvailability,
  ServiceAvailableDate,
  ServiceListItem,
  ServiceUpdate,
} from "./types";
import { assertApiImage } from "./media";

export const servicesApi = {
  list: () => apiRequest<ServiceListItem[]>("/services"),

  get: (serviceId: number) =>
    apiRequest<Service>(`/services/${serviceId}`),

  listByBusiness: (businessId: number) =>
    apiRequest<ServiceListItem[]>(`/services/business/${businessId}`),

  search: (query: string) =>
    apiRequest<ServiceListItem[]>(
      `/services/search?q=${encodeURIComponent(query)}`,
    ),

  categories: () => apiRequest<string[]>("/services/categories"),

  availableDates: (serviceId: number, days = 14, staffId?: number) => {
    const query = new URLSearchParams({ days: String(days) });
    if (staffId != null) query.set("staff_id", String(staffId));
    return apiRequest<ServiceAvailableDate[]>(
      `/services/${serviceId}/available-dates?${query.toString()}`,
    );
  },

  availability: (serviceId: number, date: string, staffId?: number) => {
    const query = new URLSearchParams({ date });
    if (staffId != null) query.set("staff_id", String(staffId));
    return apiRequest<ServiceAvailability>(
      `/services/${serviceId}/availability?${query.toString()}`,
    );
  },

  create: (body: ServiceCreate, token?: string) =>
    apiRequest<Service>("/services/create", {
      method: "POST",
      body,
      auth: true,
      token,
    }),

  update: (serviceId: number, body: ServiceUpdate, token?: string) =>
    apiRequest<Service>(`/services/${serviceId}`, {
      method: "PUT",
      body,
      auth: true,
      token,
    }),

  remove: (serviceId: number, token?: string) =>
    apiRequest<unknown>(`/services/${serviceId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),

  uploadImage: (serviceId: number, image: File | Blob, token?: string) => {
    assertApiImage(image);
    const formData = new FormData();
    formData.append("image", image);
    return apiUploadRequest<Service>(`/services/${serviceId}/image`, formData, {
      auth: true,
      token,
    });
  },

  deleteImage: (serviceId: number, token?: string) =>
    apiRequest<Service>(`/services/${serviceId}/image`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};
