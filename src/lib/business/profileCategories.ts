export const BUSINESS_PROFILE_CATEGORIES = [
  { label: "Фитнес зал", slug: "gym", aliases: ["fitness", "sport"] },
  { label: "Спа", slug: "spa", aliases: ["wellness"] },
  {
    label: "Салон красоты",
    slug: "salon",
    aliases: ["beauty-salon", "salon-beauty", "beauty"],
  },
  { label: "Клиника", slug: "clinic", aliases: ["hospital"] },
  {
    label: "Учебные заведения",
    slug: "learning-center",
    aliases: ["education", "school"],
  },
  {
    label: "Здоровье",
    slug: "health",
    aliases: ["healthcare", "medicine", "medical"],
  },
  { label: "Рестораны", slug: "restaurant", aliases: ["restaurants", "food"] },
  { label: "Кафейни", slug: "coffee", aliases: ["cafe", "cafes"] },
  {
    label: "Авто сервис",
    slug: "auto-repair",
    aliases: ["auto-service", "autoservice", "car-service", "auto"],
  },
  { label: "Кинотеатры", slug: "cinema", aliases: ["cinemas", "movie-theater"] },
  {
    label: "Комп клуб",
    slug: "computer-club",
    aliases: ["pc-club", "gaming-club", "club"],
  },
  {
    label: "Клининг",
    slug: "cleaning-services",
    aliases: ["cleaning", "cleaning-service"],
  },
  { label: "Санатории", slug: "sanatorium", aliases: ["sanatoriums"] },
  { label: "Другое", slug: "other", aliases: ["другое"] },
] as const;

type ApiBusinessCategoryRef = {
  name: string;
  slug: string;
};

function normalizeCategorySlug(value: string) {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

export function findBusinessApiCategoryForUi<
  T extends ApiBusinessCategoryRef,
>(categories: T[], uiCategory: string): T | undefined {
  const target = BUSINESS_PROFILE_CATEGORIES.find(
    (category) => category.label === uiCategory,
  );
  if (!target) return undefined;

  const expectedSlugs = new Set([
    normalizeCategorySlug(target.slug),
    ...target.aliases.map(normalizeCategorySlug),
  ]);
  return categories.find(
    (category) => expectedSlugs.has(normalizeCategorySlug(category.slug)),
  );
}

export function apiBusinessCategoryToUi(category: unknown): string {
  if (typeof category === "string") {
    if (!category.trim()) return "";
    const normalized = normalizeCategorySlug(category);
    const match = BUSINESS_PROFILE_CATEGORIES.find(
      (item) =>
        normalizeCategorySlug(item.slug) === normalized ||
        item.aliases.some(
          (alias) => normalizeCategorySlug(alias) === normalized,
        ),
    );
    return match?.label ?? category.trim();
  }

  if (typeof category !== "object" || category === null) return "";

  const value = category as Record<string, unknown>;
  const slug = typeof value.slug === "string" ? value.slug : "";
  const name = typeof value.name === "string" ? value.name : "";
  const normalizedSlug = normalizeCategorySlug(slug || name);
  const match = BUSINESS_PROFILE_CATEGORIES.find(
    (item) =>
      normalizeCategorySlug(item.slug) === normalizedSlug ||
      item.aliases.some(
        (alias) => normalizeCategorySlug(alias) === normalizedSlug,
      ),
  );

  return match?.label ?? (name || slug);
}
