import { assets } from "@/lib/assets";
import type { InAppNotificationType } from "@/lib/api/types";
import type { Translator } from "@/lib/i18n/createTranslator";

export function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const formattedDate = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const formattedTime = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${formattedDate}\n${formattedTime}`;
}

export function getNotificationPresentation(
  type: InAppNotificationType,
  t: Translator,
  notification?: { title?: string; description?: string },
) {
  switch (type) {
    case "booking":
    case "booking_created":
    case "booking_confirmed":
    case "booking_rejected":
    case "booking_cancelled":
    case "booking_rescheduled":
      return {
        icon: assets.notification.calendar,
        title: notification?.title ?? "Бронирование",
        description: notification?.description ?? "",
        testId: "notification-card-booking",
      };
    case "payment":
      return {
        icon: assets.notification.card,
        title: notification?.title ?? "Оплата",
        description: notification?.description ?? "",
        testId: "notification-card-payment",
      };
    case "promotion":
      return {
        icon: assets.notification.discount,
        title: notification?.title ?? "Уведомление",
        description: notification?.description ?? "",
        testId: "notification-card-promotion",
      };
  }
}
