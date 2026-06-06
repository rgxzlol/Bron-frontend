const TASHKENT_BOUNDS = {
  latMin: 41.2,
  latMax: 41.39,
  lngMin: 69.15,
  lngMax: 69.35,
} as const;

export function randomTashkentCoords(): { lat: number; lng: number } {
  const lat =
    TASHKENT_BOUNDS.latMin +
    Math.random() * (TASHKENT_BOUNDS.latMax - TASHKENT_BOUNDS.latMin);
  const lng =
    TASHKENT_BOUNDS.lngMin +
    Math.random() * (TASHKENT_BOUNDS.lngMax - TASHKENT_BOUNDS.lngMin);
  return {
    lat: Math.round(lat * 10000) / 10000,
    lng: Math.round(lng * 10000) / 10000,
  };
}

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
