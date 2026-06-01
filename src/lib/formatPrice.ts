export function formatPrice(price: number): string {
  return price.toLocaleString("ru-RU");
}

export function formatRating(rating: number): string {
  return rating.toLocaleString("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
