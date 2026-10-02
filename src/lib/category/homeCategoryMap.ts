import { routes } from "@/config/routes";

export type HomeCategoryMapTarget = {
  businessCategory: string;
  mapPill: string;
};

const HOME_CATEGORY_MAP: Record<number, HomeCategoryMapTarget> = {
  1: { businessCategory: "Салон красоты", mapPill: "Все" },
  2: { businessCategory: "Здоровье", mapPill: "Больница" },
  3: { businessCategory: "Фитнес зал", mapPill: "Спортзал" },
  4: { businessCategory: "Учебные заведения", mapPill: "Все" },
  5: { businessCategory: "Рестораны", mapPill: "Ресторан" },
  6: { businessCategory: "Кафейни", mapPill: "Кофейня" },
  7: { businessCategory: "Авто сервис", mapPill: "Все" },
  8: { businessCategory: "Кинотеатры", mapPill: "Все" },
  9: { businessCategory: "Комп клуб", mapPill: "Все" },
  10: { businessCategory: "Клининг", mapPill: "Все" },
  11: { businessCategory: "Санатории", mapPill: "Все" },
  12: { businessCategory: "Другое", mapPill: "Все" },
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
