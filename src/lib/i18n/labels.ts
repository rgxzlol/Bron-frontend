import type { Translator } from "./createTranslator";
import type { TranslateParams } from "./types";

/** Canonical RU labels → message keys (kept as storage/API IDs). */
export const BUSINESS_CATEGORY_KEYS: Record<string, string> = {
  "Салон красоты": "categories.beautySalon",
  Здоровье: "categories.health",
  "Фитнес зал": "categories.gym",
  "Учебные заведения": "categories.education",
  Рестораны: "categories.restaurants",
  Кафейни: "categories.cafes",
  "Авто сервис": "categories.autoService",
  Кинотеатры: "categories.cinema",
  "Комп клуб": "categories.pcClub",
  Клининг: "categories.cleaning",
  Санатории: "categories.sanatoriums",
  "Кафе и рестораны": "categories.restaurants",
  "Спорт и фитнес": "categories.gym",
  "Красота и уход": "categories.beautySalon",
  Медицина: "categories.health",
  "Здоровье и SPA": "categories.sanatoriums",
  "Отели и отдых": "categories.sanatoriums",
  Автосервисы: "categories.autoService",
  Образование: "categories.education",
  Развлечения: "categories.cinema",
  "Спорт зал": "categories.sportGym",
  Красота: "categories.beauty",
  Еда: "categories.food",
  Другое: "categories.other",
  Клуб: "categories.club",
};

export const SERVICE_CATEGORY_KEYS: Record<string, string> = {
  Консультация: "categories.consultation",
  Процедура: "categories.procedure",
  Тренировка: "categories.training",
  Диагностика: "categories.diagnostics",
  Другое: "categories.other",
};

export const MAP_FILTER_KEYS: Record<string, string> = {
  Все: "map.filterAll",
  Кофейня: "map.filterCafe",
  Спортзал: "map.filterGym",
  Больница: "map.filterHospital",
  Ресторан: "map.filterRestaurant",
};

/** Plural/display labels for map filter pills. */
export const MAP_FILTER_PILL_KEYS: Record<string, string> = {
  Ресторан: "map.filterRestaurantPill",
  Спортзал: "map.filterGymPill",
  Кофейня: "map.filterCafePill",
  Больница: "map.filterHospitalPill",
};

/** Shop/business type badges shown on map & booking cards. */
export const SHOP_TYPE_KEYS: Record<string, string> = {
  "Салон красоты": "categories.beautySalon",
  Здоровье: "categories.health",
  "Фитнес зал": "categories.gym",
  "Учебные заведения": "categories.education",
  Рестораны: "categories.restaurants",
  Кафейни: "categories.cafes",
  "Авто сервис": "categories.autoService",
  Кинотеатры: "categories.cinema",
  "Комп клуб": "categories.pcClub",
  Клининг: "categories.cleaning",
  Санатории: "categories.sanatoriums",
  "Спорт зал": "categories.sportGym",
  Спортзал: "map.filterGym",
  Кофейня: "map.filterCafe",
  Больница: "map.filterHospital",
  Ресторан: "map.filterRestaurant",
  Красота: "categories.beauty",
  Еда: "categories.food",
  Другое: "categories.other",
  Клуб: "categories.club",
  "Кафе и рестораны": "categories.restaurants",
  "Спорт и фитнес": "categories.gym",
  "Красота и уход": "categories.beautySalon",
  Медицина: "categories.health",
  "Здоровье и SPA": "categories.sanatoriums",
  "Отели и отдых": "categories.sanatoriums",
  Автосервисы: "categories.autoService",
  Развлечения: "categories.cinema",
};

export const SHOP_CATEGORY_KEYS: Record<string, string> = {
  ...SERVICE_CATEGORY_KEYS,
  "Тренажерный зал": "categories.gymFloor",
  "Услуги красоты": "categories.beautyServices",
  Кофейня: "map.filterCafe",
  Консультация: "categories.consultation",
};

export const PAYMENT_TITLE_KEYS: Record<string, string> = {
  "Оплата бронирования": "profile.paymentBooking",
};

export const DEMO_SERVICE_KEYS: Record<string, { title: string; description: string }> = {
  therapist: {
    title: "demo.therapistTitle",
    description: "demo.therapistDesc",
  },
  cardio: {
    title: "demo.cardioTitle",
    description: "demo.cardioDesc",
  },
  dentist: {
    title: "demo.dentistTitle",
    description: "demo.dentistDesc",
  },
  pediatrics: {
    title: "demo.pediatricsTitle",
    description: "demo.pediatricsDesc",
  },
};

export const DEMO_SHOP_DESC_KEYS: Record<number | string, string> = {
  1: "demo.shop1Desc",
  2: "demo.shop2Desc",
  3: "demo.shop3Desc",
  4: "demo.shop4Desc",
};

export const HOME_CATEGORY_KEYS: Record<number, string> = {
  1: "categories.beautySalon",
  2: "categories.health",
  3: "categories.gym",
  4: "categories.education",
  5: "categories.restaurants",
  6: "categories.cafes",
  7: "categories.autoService",
  8: "categories.cinema",
  9: "categories.pcClub",
  10: "categories.cleaning",
  11: "categories.sanatoriums",
  12: "categories.other",
};

export const REVIEW_TAG_KEYS: Record<string, string> = {
  Оборудование: "review.tagEquipment",
  Расположение: "review.tagLocation",
  Чистота: "review.tagCleanliness",
  Персонал: "review.tagStaff",
  Атмосфера: "review.tagAtmosphere",
  Цена: "review.tagPrice",
  Услуга: "review.tagService",
  Другое: "review.tagOther",
};

export const EXTRAS_NAME_KEYS: Record<string, string> = {
  isotonic: "extras.isotonic",
  "protein-bar": "extras.proteinBar",
  "protein-shake": "extras.proteinShake",
  water: "extras.water",
  towel: "extras.towel",
};

export const EXTRAS_DESC_KEYS: Record<string, string> = {
  isotonic: "extras.isotonicDesc",
  "protein-bar": "extras.proteinBarDesc",
  "protein-shake": "extras.proteinShakeDesc",
  water: "extras.waterDesc",
  towel: "extras.towelDesc",
};

export const SCHEDULE_DAY_KEYS: Record<string, { label: string; short: string }> = {
  mon: { label: "schedule.mon", short: "schedule.monShort" },
  tue: { label: "schedule.tue", short: "schedule.tueShort" },
  wed: { label: "schedule.wed", short: "schedule.wedShort" },
  thu: { label: "schedule.thu", short: "schedule.thuShort" },
  fri: { label: "schedule.fri", short: "schedule.friShort" },
  sat: { label: "schedule.sat", short: "schedule.satShort" },
  sun: { label: "schedule.sun", short: "schedule.sunShort" },
};

const KNOWN_ERROR_KEYS = new Set([
  "errors.geocodingConnection",
  "errors.geocodingLookup",
  "errors.geocodingAddressRequired",
  "errors.geocodingNotFound",
  "errors.apiHtml",
  "errors.apiInvalid",
  "errors.apiJsonParse",
  "errors.apiNetwork",
  "errors.apiRequest",
  "errors.backendProxy",
  "errors.businessCreatedNotFound",
  "errors.loginToSaveBusiness",
  "errors.userUnknown",
]);

export function translateLabel(
  t: Translator,
  value: string,
  map: Record<string, string>,
): string {
  const key = map[value];
  return key ? t(key) : value;
}

export function translateBusinessCategory(t: Translator, category: string): string {
  return translateLabel(t, category, BUSINESS_CATEGORY_KEYS);
}

export function translateHomeCategory(t: Translator, categoryId: number): string {
  const key = HOME_CATEGORY_KEYS[categoryId];
  return key ? t(key) : "";
}

export function translateErrorMessage(
  t: Translator,
  message: string,
  params?: TranslateParams,
): string {
  if (
    KNOWN_ERROR_KEYS.has(message) ||
    message.startsWith("errors.") ||
    message.startsWith("profile.") ||
    message.startsWith("bookings.") ||
    message.startsWith("businessErrors.")
  ) {
    return t(message, params);
  }
  return message;
}
