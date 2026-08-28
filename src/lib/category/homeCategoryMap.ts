import { routes } from "@/config/routes";

export type HomeCategoryMapTarget = {
  businessCategory: string;
  mapPill: string;
};

const HOME_CATEGORY_MAP: Record<number, HomeCategoryMapTarget> = {
  1: { businessCategory: "Красота", mapPill: "Все" },
  2: { businessCategory: "Здоровье", mapPill: "Больница" },
  3: { businessCategory: "Спорт зал", mapPill: "Спортзал" },
  4: { businessCategory: "Образование", mapPill: "Все" },
  5: { businessCategory: "Еда", mapPill: "Ресторан" },
  6: { businessCategory: "Еда", mapPill: "Кофейня" },
  7: { businessCategory: "Другое", mapPill: "Все" },
  8: { businessCategory: "Другое", mapPill: "Все" },
  9: { businessCategory: "Другое", mapPill: "Все" },
  10: { businessCategory: "Другое", mapPill: "Все" },
  11: { businessCategory: "Здоровье", mapPill: "Больница" },
};

export function getHomeCategoryMapTarget(
  categoryId: number,
): HomeCategoryMapTarget | null {
  return HOME_CATEGORY_MAP[categoryId] ?? null;
}

export function buildMapCategoryHref(categoryId: number): string {
  const target = getHomeCategoryMapTarget(categoryId);
  if (!target) return routes.map;

  const params = new URLSearchParams();
  params.set("category", target.businessCategory);
  if (target.mapPill !== "Все") {
    params.set("filter", target.mapPill);
  }

  return `${routes.map}?${params.toString()}`;
}
