import { categories } from "@/data/categories";
import { popularPlaces } from "@/data/popular";
import { ShopsPlace } from "@/data/shops";

export type SearchCatalogItem = {
  id: string;
  title: string;
  description: string;
  shopId: number;
  rating?: number;
  reviews?: number;
  keywords: string[];
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "салон красоты": ["beauty", "salon", "hair", "парикмахерская"],
  здоровье: ["health", "clinic", "клиника", "медицина"],
  "фитнес зал": ["gym", "fitness", "sport", "спорт", "тренажерный зал"],
  "учебные заведения": ["education", "school", "образование"],
  рестораны: ["restaurant", "food", "еда"],
  кафейни: ["cafe", "coffee", "кофе"],
  "авто сервис": ["car wash", "auto", "автомойка", "мойка", "car service"],
  кинотеатры: ["cinema", "movie", "кино"],
  "комп клуб": ["pc club", "gaming", "игры"],
  клининг: ["cleaning", "уборка"],
  санатории: ["sanatorium", "spa", "отдых"],
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => normalize(value)).filter(Boolean))];
}

function buildKeywords(...parts: Array<string | undefined>) {
  const normalized = unique(parts.filter((part): part is string => Boolean(part)));

  for (const part of [...normalized]) {
    const aliases = CATEGORY_KEYWORDS[part];
    if (aliases) {
      normalized.push(...aliases.map(normalize));
    }
  }

  return unique(normalized);
}

function buildCatalog(): SearchCatalogItem[] {
  const categoryItems = categories.map((category) => ({
    id: `category-${category.id}`,
    title: category.title,
    description: `${category.count} услуг`,
    shopId: 1,
    keywords: buildKeywords(category.title),
  }));

  const shopItems = ShopsPlace.map((shop) => ({
    id: `shop-${shop.id}`,
    title: shop.title,
    description: shop.type,
    shopId: shop.id,
    rating: shop.rating,
    reviews: shop.reviews,
    keywords: buildKeywords(shop.title, shop.type, shop.category, shop.desc),
  }));

  const popularItems = popularPlaces.map((place) => ({
    id: `popular-${place.id}`,
    title: place.title,
    description: place.desc,
    shopId: place.shopId ?? 1,
    rating: place.rating,
    reviews: place.reviews,
    keywords: buildKeywords(place.title, place.desc),
  }));

  return [...categoryItems, ...shopItems, ...popularItems];
}

export const SEARCH_CATALOG = buildCatalog();

function matchesQuery(item: SearchCatalogItem, query: string) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) return false;

  if (normalize(item.title).includes(normalizedQuery)) return true;
  if (normalize(item.description).includes(normalizedQuery)) return true;

  return item.keywords.some(
    (keyword) =>
      keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword),
  );
}

export function getSearchSuggestions(query: string, limit = 6) {
  if (!query.trim()) return [];

  return SEARCH_CATALOG.filter((item) => matchesQuery(item, query)).slice(0, limit);
}

export function searchCatalog(query: string) {
  if (!query.trim()) return [];

  return SEARCH_CATALOG.filter((item) => matchesQuery(item, query));
}
