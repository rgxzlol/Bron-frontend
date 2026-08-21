export function formatPrice(price: number): string {
  return price.toLocaleString("ru-RU");
}

export function parsePrice(value: string): number {
  const normalized = value
    .replace(/[\s\u00a0\u202f]/g, "")
    .replace(/,/g, "");
  const price = Number(normalized);
  return Number.isFinite(price) ? price : 0;
}

export function formatPriceInput(price: number): string {
  return price > 0 ? formatPrice(price) : "";
}

export function formatPriceInputOnChange(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = Number(digits);
  return Number.isFinite(num) ? formatPrice(num) : "";
}

export function formatRating(rating: number): string {
  return rating.toLocaleString("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
