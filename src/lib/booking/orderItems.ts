import type { BookingOrderItem } from "@/lib/api/types";

export function resolveOrderItemIcon(item: BookingOrderItem): string {
  if (item.kind === "service") return "hall";
  const id = String(item.id);
  if (id.includes("protein-bar") || id.includes("bar")) return "bar";
  if (id.includes("water") || id.includes("bottle") || id.includes("isotonic")) {
    return "bottle";
  }
  if (id.includes("shake") || id.includes("towel")) return "bar";
  return "bottle";
}

export function resolveBookingOrderItems(
  items: BookingOrderItem[] | undefined,
): BookingOrderItem[] {
  return items ?? [];
}
