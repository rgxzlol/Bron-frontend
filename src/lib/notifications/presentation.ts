import { assets } from "@/lib/assets";
import type { InAppNotificationType } from "@/lib/api/types";
import type { Translator } from "@/lib/i18n/createTranslator";

export function getNotificationPresentation(
  type: InAppNotificationType,
  t: Translator,
) {
  switch (type) {
    case "booking":
      return {
        icon: assets.notification.calendar,
        title: t("headerFilters.demoReminderTitle"),
        description: t("headerFilters.demoReminderDesc"),
        testId: "notification-card-booking",
      };
    case "payment":
      return {
        icon: assets.notification.card,
        title: t("headerFilters.demoPaymentTitle"),
        description: t("headerFilters.demoPaymentDesc"),
        testId: "notification-card-payment",
      };
    case "promotion":
      return {
        icon: assets.notification.discount,
        title: t("headerFilters.demoPromoTitle"),
        description: t("headerFilters.demoPromoDesc"),
        testId: "notification-card-promotion",
      };
  }
}
