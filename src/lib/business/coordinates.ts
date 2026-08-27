const CATEGORY_TO_MAP_FILTER: Record<string, string> = {
  "Спорт зал": "Спортзал",
  Красота: "Все",
  Здоровье: "Больница",
  Образование: "Все",
  Еда: "Ресторан",
  Другое: "Все",
};

export function businessCategoryToMapFilter(category: string): string {
  return CATEGORY_TO_MAP_FILTER[category] ?? "Все";
}

export function businessMatchesMapFilter(
  category: string,
  activeFilter: string,
): boolean {
  if (activeFilter === "Все") return true;
  return businessCategoryToMapFilter(category) === activeFilter;
}
