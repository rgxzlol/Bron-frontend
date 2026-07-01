const SHOP_TYPE_TO_BUSINESS_CATEGORY: Record<string, string> = {
  "Спорт зал": "Спорт зал",
  Спортзал: "Спорт зал",
  Кофейня: "Еда",
  Больница: "Здоровье",
  Ресторан: "Еда",
  Красота: "Красота",
  Образование: "Образование",
};

export function shopMatchesBusinessCategory(
  shopType: string,
  shopCategory: string,
  businessCategory: string,
): boolean {
  if (!businessCategory) return true;

  if (shopCategory === businessCategory) return true;

  const mappedType = SHOP_TYPE_TO_BUSINESS_CATEGORY[shopType];
  if (mappedType === businessCategory) return true;

  const normalizedShopCategory = shopCategory.replace(/\s+/g, " ").trim();
  const normalizedFilter = businessCategory.replace(/\s+/g, " ").trim();
  if (normalizedShopCategory === normalizedFilter) return true;

  return shopCategory.toLowerCase().includes(businessCategory.toLowerCase());
}

export function businessMatchesBusinessCategory(
  category: string,
  businessCategory: string,
): boolean {
  if (!businessCategory) return true;
  return category === businessCategory;
}
