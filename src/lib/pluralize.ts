/** Склонение «сервис / сервиса / сервисов» */
export function pluralizeServices(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 14) return "сервисов";
  if (mod10 === 1) return "сервис";
  if (mod10 >= 2 && mod10 <= 4) return "сервиса";
  return "сервисов";
}

/** Склонение «отзыв / отзыва / отзывов» */
export function pluralizeReviews(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 14) return "отзывов";
  if (mod10 === 1) return "отзыв";
  if (mod10 >= 2 && mod10 <= 4) return "отзыва";
  return "отзывов";
}

/** Длительность в минутах → «15 мин.» / «1 ч.» / «1 ч. 30 мин.» */
export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} мин.`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (rest === 0) return `${hours} ч.`;
  return `${hours} ч. ${rest} мин.`;
}
