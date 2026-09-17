import {
  BUSINESS_CATEGORY_KEYS,
  HOME_CATEGORY_KEYS,
  SHOP_TYPE_KEYS,
  translateLabel,
} from "@/lib/i18n/labels";
import type { Translator } from "@/lib/i18n/createTranslator";
import { pluralizeSearchServices } from "@/lib/pluralize";
import type { SearchCatalogItem } from "./catalog";

const CATEGORY_TITLE_KEYS: Record<string, string> = {
  "Салон красоты": "categories.beautySalon",
  "Здоровье": "categories.health",
  "Фитнес зал": "categories.gym",
  "Учебные заведения": "categories.education",
  Рестораны: "categories.restaurants",
  Кафейни: "categories.cafes",
  "Авто сервис": "categories.autoService",
  Кинотеатры: "categories.cinema",
  "Комп клуб": "categories.pcClub",
  Клининг: "categories.cleaning",
  Санатории: "categories.sanatoriums",
  Клиника: "categories.clinic",
};

const SEARCH_TITLE_KEYS: Record<string, string> = {
  ...CATEGORY_TITLE_KEYS,
  ...BUSINESS_CATEGORY_KEYS,
  ...SHOP_TYPE_KEYS,
};

const POPULAR_DESC_MARKERS = [
  "физической культурой",
  "physical activity",
  "jismoniy mashq",
];

function translateSearchTitle(t: Translator, title: string): string {
  return translateLabel(t, title, SEARCH_TITLE_KEYS);
}

function translateSearchDescription(
  t: Translator,
  item: SearchCatalogItem,
): string {
  const categoryMatch = item.id.match(/^category-(\d+)$/);
  if (categoryMatch) {
    const countMatch = item.description.match(/^(\d+)/);
    const count = countMatch ? Number(countMatch[1]) : 0;
    if (count > 0) {
      return `${count} ${pluralizeSearchServices(count, t)}`;
    }
  }

  const countMatch = item.description.match(/^(\d+)\s/);
  if (countMatch) {
    const count = Number(countMatch[1]);
    if (count > 0) {
      return `${count} ${pluralizeSearchServices(count, t)}`;
    }
  }

  const translatedType = translateLabel(t, item.description, SHOP_TYPE_KEYS);
  if (translatedType !== item.description) {
    return translatedType;
  }

  if (POPULAR_DESC_MARKERS.some((marker) => item.description.includes(marker))) {
    return t("map.popularDesc");
  }

  return item.description;
}

export function localizeSearchItem(
  t: Translator,
  item: SearchCatalogItem,
): SearchCatalogItem {
  const categoryMatch = item.id.match(/^category-(\d+)$/);
  const title = categoryMatch
    ? (() => {
        const key = HOME_CATEGORY_KEYS[Number(categoryMatch[1])];
        return key ? t(key) : translateSearchTitle(t, item.title);
      })()
    : translateSearchTitle(t, item.title);

  return {
    ...item,
    title,
    description: translateSearchDescription(t, item),
  };
}
