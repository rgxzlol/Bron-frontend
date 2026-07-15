export function formatDateRu(date: Date, locale = "ru-RU") {
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
