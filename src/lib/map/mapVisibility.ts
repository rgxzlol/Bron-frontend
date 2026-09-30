import { hasValidCoords } from "@/lib/geocoding";
import type { SavedBusiness } from "@/store/business.store";
import type { ShopsType } from "@/types/shops.types";

export function canShowBusinessOnMap(business: SavedBusiness): boolean {
  return (
    hasValidCoords(business) &&
    business.services.some((service) => service.active && service.type === "service")
  );
}

export function canShowShopOnMap(shop: ShopsType): boolean {
  if (!hasValidCoords(shop)) return false;

  if (shop.apiBusinessId != null) {
    return shop.services?.some((service) => service.kind === "service") ?? false;
  }

  return true;
}
