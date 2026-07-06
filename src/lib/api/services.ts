import { apiRequest } from "./client";
import type {
  Service,
  ServiceCreate,
  ServiceListItem,
  ServiceUpdate,
} from "./types";

export const servicesApi = {
  list: () => apiRequest<ServiceListItem[]>("/services/"),

  get: (serviceId: number) =>
    apiRequest<Service>(`/services/${serviceId}`),

  listByBusiness: (businessId: number) =>
    apiRequest<ServiceListItem[]>(`/services/business/${businessId}`),

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
};
