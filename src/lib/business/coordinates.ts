const CATEGORY_TO_MAP_FILTER: Record<string, string> = {
  "Салон красоты": "Все",
  Здоровье: "Больница",
  "Фитнес зал": "Спортзал",
  "Учебные заведения": "Все",
  Рестораны: "Ресторан",
  Кафейни: "Кофейня",
  "Авто сервис": "Все",
  Кинотеатры: "Все",
  "Комп клуб": "Все",
  Клининг: "Все",
  Санатории: "Все",
  "Спорт зал": "Спортзал",
  Красота: "Все",
  "Спорт и фитнес": "Спортзал",
  "Красота и уход": "Все",
  "Здоровье и SPA": "Все",
  "Кафе и рестораны": "Ресторан",
  "Отели и отдых": "Все",
  Автосервисы: "Все",
  Медицина: "Больница",
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
