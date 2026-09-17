type TranslateFn = (key: string) => string;

function pluralize(
  count: number,
  t: TranslateFn | undefined,
  keys: { one: string; few: string; many: string },
  fallback: { one: string; few: string; many: string },
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 14) {
    return t ? t(keys.many) : fallback.many;
  }
  if (mod10 === 1) {
    return t ? t(keys.one) : fallback.one;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return t ? t(keys.few) : fallback.few;
  }
  return t ? t(keys.many) : fallback.many;
}

/** Склонение «сервис / сервиса / сервисов» */
export function pluralizeServices(count: number, t?: TranslateFn): string {
  return pluralize(
    count,
    t,
    {
      one: "plural.servicesOne",
      few: "plural.servicesFew",
      many: "plural.servicesMany",
    },
    { one: "сервис", few: "сервиса", many: "сервисов" },
  );
}

/** Склонение «услуга / услуги / услуг» (для поиска) */
export function pluralizeSearchServices(count: number, t?: TranslateFn): string {
  return pluralize(
    count,
    t,
    {
      one: "map.serviceWordOne",
      few: "map.serviceWordFew",
      many: "map.serviceWordMany",
    },
    { one: "услуга", few: "услуги", many: "услуг" },
  );
}

/** Склонение «отзыв / отзыва / отзывов» */
export function pluralizeReviews(count: number, t?: TranslateFn): string {
  return pluralize(
    count,
    t,
    {
      one: "plural.reviewsOne",
      few: "plural.reviewsFew",
      many: "plural.reviewsMany",
    },
    { one: "отзыв", few: "отзыва", many: "отзывов" },
  );
}

/** Длительность в минутах → «15 мин.» / «1 ч.» / «1 ч. 30 мин.» */
export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} мин.`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (rest === 0) return `${hours} ч.`;
  return `${hours} ч. ${rest} мин.`;
}
