import { apiRequest } from "./client";
import type {
  WorkingHours,
  WorkingHoursCreate,
  WorkingHoursUpdate,
} from "./types";

export const workingHoursApi = {
  getByBusiness: (businessId: number) =>
    apiRequest<WorkingHours[]>(`/working-hours/business/${businessId}`),

  get: (workingHoursId: number) =>
    apiRequest<WorkingHours>(`/working-hours/${workingHoursId}`),

  create: (body: WorkingHoursCreate, token?: string) =>
    apiRequest<WorkingHours>("/working-hours/create", {
      method: "POST",
      body,
      auth: true,
      token,
    }),

  update: (workingHoursId: number, body: WorkingHoursUpdate, token?: string) =>
    apiRequest<WorkingHours>(`/working-hours/${workingHoursId}`, {
      method: "PUT",
      body,
      auth: true,
      token,
    }),

  remove: (workingHoursId: number, token?: string) =>
    apiRequest<unknown>(`/working-hours/${workingHoursId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};
