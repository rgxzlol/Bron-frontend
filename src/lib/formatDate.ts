export function formatDateRu(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatBookingDate(date: Date, locale = "ru-RU") {
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function toBookingDateTestId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `booking-date-${year}-${month}-${day}`;
}

export function toBookingTimeTestId(time: string) {
  return `booking-time-${time.replace(":", "-")}`;
}
