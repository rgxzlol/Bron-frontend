import { ApiError, apiRequest } from "./client";
import type { Category } from "./types";

function isCategory(value: unknown): value is Category {
  if (typeof value !== "object" || value === null) return false;

  const category = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(category.id) &&
    (category.id as number) > 0 &&
    typeof category.name === "string" &&
    category.name.trim().length > 0 &&
    typeof category.slug === "string" &&
    category.slug.trim().length > 0 &&
    (category.icon === undefined ||
      category.icon === null ||
      typeof category.icon === "string") &&
    (category.business_count === undefined ||
      (Number.isInteger(category.business_count) &&
        (category.business_count as number) >= 0)) &&
    (category.order === undefined || Number.isFinite(category.order))
  );
}

function parseCategoryList(response: unknown): Category[] {
  let categories: unknown;
  let count: unknown;

  if (Array.isArray(response)) {
    categories = response;
  } else if (typeof response === "object" && response !== null) {
    const record = response as Record<string, unknown>;
    categories = record.value ?? record.Value;
    count = record.Count ?? record.count;
  }

  if (!Array.isArray(categories) || !categories.every(isCategory)) {
    throw new ApiError(502, "Сервер вернул некорректный список категорий.");
  }

  if (
    count !== undefined &&
    (!Number.isSafeInteger(count) || count !== categories.length)
  ) {
    throw new ApiError(502, "Сервер вернул неполный список категорий.");
  }

  return categories;
}

export const categoriesApi = {
  list: async () =>
    parseCategoryList(await apiRequest<unknown>("/categories/")),

  get: (slug: string) =>
    apiRequest<Category>(`/categories/${encodeURIComponent(slug)}`),
};
