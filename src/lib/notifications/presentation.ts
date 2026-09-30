import { assets } from "@/lib/assets";
import type { InAppNotificationType } from "@/lib/api/types";
import type { Translator } from "@/lib/i18n/createTranslator";

function localizeNotificationTitle(
  title: string | undefined,
  t: Translator,
) {
  if (!title) return undefined;

  const normalized = title.trim().toLowerCase();
  const translatedTitles: Record<string, string> = {
    "new booking": t("headerFilters.notificationNewBooking"),
    "booking created": t("headerFilters.notificationNewBooking"),
    "booking confirmed": t("headerFilters.notificationBookingConfirmed"),
    "booking cancelled": t("headerFilters.notificationBookingCancelled"),
    "booking canceled": t("headerFilters.notificationBookingCancelled"),
    "booking rejected": t("headerFilters.notificationBookingCancelled"),
    "booking rescheduled": t("headerFilters.notificationBookingRescheduled"),
    "payment successful": t("headerFilters.notificationPaymentSuccessful"),
    "payment completed": t("headerFilters.notificationPaymentSuccessful"),
  };

  return translatedTitles[normalized] ?? title;
}

function localizeNotificationDescription(
  description: string | undefined,
  t: Translator,
) {
  if (!description) return "";

  const created = description.match(
    /^(.+?) booked (.+?) on (\d{4}-\d{2}-\d{2})(?: at (\d{2}:\d{2})(?::\d{2})?)?\.?$/i,
  );
  if (created) {
    return t("headerFilters.notificationBookingCreatedDescription", {
      phone: created[1].trim(),
      service: created[2].trim(),
      date: created[3],
      timeSuffix: created[4]
        ? t("headerFilters.notificationTimeSuffix", { time: created[4] })
        : "",
    });
  }

  const confirmed = description.match(
    /^(.+?) confirmed your booking on (\d{4}-\d{2}-\d{2})(?: at (\d{2}:\d{2})(?::\d{2})?)?\.?$/i,
  );
  if (confirmed) {
    return t("headerFilters.notificationBookingConfirmedDescription", {
      business: confirmed[1].trim(),
      date: confirmed[2],
      timeSuffix: confirmed[3]
        ? t("headerFilters.notificationTimeSuffix", { time: confirmed[3] })
        : "",
    });
  }

  return description;
}

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
        title:
          localizeNotificationTitle(notification?.title, t) ??
          t("bookings.navLabel"),
        description: localizeNotificationDescription(
          notification?.description,
          t,
        ),
        testId: "notification-card-booking",
      };
    case "payment":
      return {
        icon: assets.notification.card,
        title:
          localizeNotificationTitle(notification?.title, t) ??
          t("headerFilters.notificationPayment"),
        description: localizeNotificationDescription(
          notification?.description,
          t,
        ),
        testId: "notification-card-payment",
      };
    case "promotion":
      return {
        icon: assets.notification.discount,
        title:
          localizeNotificationTitle(notification?.title, t) ??
          t("headerFilters.notificationPromotion"),
        description: localizeNotificationDescription(
          notification?.description,
          t,
        ),
        testId: "notification-card-promotion",
      };
  }
}
