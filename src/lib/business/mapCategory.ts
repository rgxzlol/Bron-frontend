const SHOP_TYPE_TO_BUSINESS_CATEGORY: Record<string, string> = {
  "Спорт зал": "Фитнес зал",
  Спортзал: "Фитнес зал",
  Кофейня: "Кафейни",
  Больница: "Здоровье",
  Ресторан: "Рестораны",
  Красота: "Салон красоты",
  Образование: "Учебные заведения",
  Еда: "Рестораны",
  Клуб: "Комп клуб",
};

const LEGACY_BUSINESS_CATEGORIES: Record<string, string> = {
  "Кафе и рестораны": "Рестораны",
  "Спорт и фитнес": "Фитнес зал",
  "Красота и уход": "Салон красоты",
  Медицина: "Здоровье",
  "Здоровье и SPA": "Санатории",
  "Отели и отдых": "Санатории",
  Автосервисы: "Авто сервис",
  Образование: "Учебные заведения",
  Развлечения: "Кинотеатры",
  "Спорт зал": "Фитнес зал",
  Ресторан: "Рестораны",
  Кофейня: "Кафейни",
  Клиника: "Здоровье",
  Автомойка: "Авто сервис",
  "Компьютерный клуб": "Комп клуб",
};

function normalizeBusinessCategory(category: string) {
  const normalized = category.replace(/\s+/g, " ").trim();
  return LEGACY_BUSINESS_CATEGORIES[normalized] ?? normalized;
}

export function shopMatchesBusinessCategory(
  shopType: string,
  shopCategory: string,
  businessCategory: string,
): boolean {
  if (!businessCategory) return true;

  const normalizedFilter = normalizeBusinessCategory(businessCategory);
  if (normalizeBusinessCategory(shopCategory) === normalizedFilter) return true;

  const mappedType = SHOP_TYPE_TO_BUSINESS_CATEGORY[shopType];
  if (mappedType && normalizeBusinessCategory(mappedType) === normalizedFilter) {
    return true;
  }

  const normalizedShopCategory = shopCategory.replace(/\s+/g, " ").trim();
  if (normalizeBusinessCategory(normalizedShopCategory) === normalizedFilter) {
    return true;
  }

  return normalizeBusinessCategory(shopCategory)
    .toLowerCase()
    .includes(normalizedFilter.toLowerCase());
}

export function businessMatchesBusinessCategory(
  category: string,
  businessCategory: string,
): boolean {
  if (!businessCategory) return true;
  const normalizedFilter = normalizeBusinessCategory(businessCategory);
  if (normalizeBusinessCategory(category) === normalizedFilter) return true;

  const mappedType = SHOP_TYPE_TO_BUSINESS_CATEGORY[category];
  if (mappedType && normalizeBusinessCategory(mappedType) === normalizedFilter) {
    return true;
  }

  const normalizedCategory = category.replace(/\s+/g, " ").trim();
  if (normalizeBusinessCategory(normalizedCategory) === normalizedFilter) {
    return true;
  }

  return normalizeBusinessCategory(category)
    .toLowerCase()
    .includes(normalizedFilter.toLowerCase());
}
