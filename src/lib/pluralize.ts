import type { ProfileLanguage } from "@/store/profile.store";

function russianPlural(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/** Склонение «сервис / сервиса / сервисов» */
export function pluralizeServices(
  count: number,
  language: ProfileLanguage = "ru",
): string {
  if (language === "en") return count === 1 ? "service" : "services";
  if (language === "uz") return "xizmat";
  return russianPlural(count, "сервис", "сервиса", "сервисов");
}

/** Склонение «отзыв / отзыва / отзывов» */
export function pluralizeReviews(
  count: number,
  language: ProfileLanguage = "ru",
): string {
  if (language === "en") return count === 1 ? "review" : "reviews";
  if (language === "uz") return "sharh";
  return russianPlural(count, "отзыв", "отзыва", "отзывов");
}

/** Длительность в минутах → «15 мин.» / «1 ч.» / «1 ч. 30 мин.» */
export function formatDurationMinutes(
  minutes: number,
  language: ProfileLanguage = "ru",
): string {
  const minLabel =
    language === "en" ? "min" : language === "uz" ? "daq." : "мин.";
  const hourLabel =
    language === "en" ? "h" : language === "uz" ? "soat" : "ч.";

  if (minutes < 60) return `${minutes} ${minLabel}`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (rest === 0) return `${hours} ${hourLabel}`;
  return `${hours} ${hourLabel} ${rest} ${minLabel}`;
}
