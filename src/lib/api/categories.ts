import { apiRequest } from "./client";
import type { Category } from "./types";

export const categoriesApi = {
  list: () => apiRequest<Category[]>("/categories/"),

  get: (slug: string) =>
    apiRequest<Category>(`/categories/${encodeURIComponent(slug)}`),
};
