import { bookingExtras } from "@/data/bookingExtras";
import { getBookingExtraLabels } from "@/lib/booking/extras";
import type { BookingOrderItem } from "@/lib/api/types";
import type { ShopsType } from "@/types/shops.types";

export function resolveOrderItemIcon(item: BookingOrderItem): string {
  if (item.kind === "service") return "hall";
  if (item.id.includes("protein-bar") || item.id.includes("bar")) return "bar";
  if (item.id.includes("water") || item.id.includes("bottle") || item.id.includes("isotonic")) {
    return "bottle";
  }
  if (item.id.includes("shake") || item.id.includes("towel")) return "bar";
  return item.kind === "extra" ? "bar" : "hall";
}

export function buildFallbackOrderItems(
  shop: ShopsType,
  totalPrice: number,
  t: (key: string) => string,
): BookingOrderItem[] {
  const serviceName =
    shop.services?.[0]?.title ??
    (shop.type === "Кофейня"
      ? t("bookingsCard.tableBooking")
      : shop.type === "Больница"
        ? t("bookingsCard.consultationBooking")
        : t("bookingsCard.hallBooking"));

  const servicePrice = shop.price > 0 && shop.price <= totalPrice ? shop.price : totalPrice;

  const items: BookingOrderItem[] = [
    {
      id: "service",
      name: serviceName,
      price: servicePrice,
      quantity: 1,
      kind: "service",
    },
  ];

  const remainder = Math.max(0, totalPrice - servicePrice);
  if (remainder > 0) {
    const extra =
      bookingExtras.find((item) => item.price === remainder) ??
      bookingExtras.find((item) => item.price <= remainder) ??
      bookingExtras[0];
    if (extra) {
      const labels = getBookingExtraLabels(extra.id, t);
      items.push({
        id: extra.id,
        name: labels.name,
        price: remainder,
        quantity: 1,
        kind: "extra",
      });
    }
  }

  return items;
}

export function resolveBookingOrderItems(
  items: BookingOrderItem[] | undefined,
  shop: ShopsType,
  totalPrice: number,
  t: (key: string) => string,
): BookingOrderItem[] {
  if (items && items.length > 0) {
    const fallbackServiceName = buildFallbackOrderItems(shop, totalPrice, t)[0]?.name;

    return items.map((item) => {
      if (item.kind === "service" || item.id === "service") {
        return {
          ...item,
          name: shop.services?.[0]?.title ?? fallbackServiceName ?? item.name,
        };
      }

      if (item.kind === "extra" || bookingExtras.some((extra) => extra.id === item.id)) {
        const labels = getBookingExtraLabels(item.id, t);
        return {
          ...item,
          name: labels.name !== item.id ? labels.name : item.name,
        };
      }

      return item;
    });
  }

  return buildFallbackOrderItems(shop, totalPrice, t);
}
