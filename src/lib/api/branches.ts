import { apiRequest } from "./client";
import type { Branch, BranchCreate, BranchListItem, BranchUpdate } from "./types";

export const branchesApi = {
  list: () => apiRequest<BranchListItem[]>("/branches/"),

  get: (branchId: number) =>
    apiRequest<Branch>(`/branches/${branchId}`),

  listByBusiness: (businessId: number) =>
    apiRequest<BranchListItem[]>(`/branches/business/${businessId}`),

  create: (body: BranchCreate, token?: string) =>
    apiRequest<Branch>("/branches/create", {
      method: "POST",
      body,
      auth: true,
      token,
    }),

  update: (branchId: number, body: BranchUpdate, token?: string) =>
    apiRequest<Branch>(`/branches/${branchId}`, {
      method: "PUT",
      body,
      auth: true,
      token,
    }),

  remove: (branchId: number, token?: string) =>
    apiRequest<unknown>(`/branches/${branchId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};
