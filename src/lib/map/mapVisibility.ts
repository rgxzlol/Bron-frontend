import { hasValidCoords } from "@/lib/geocoding";
import type { SavedBusiness } from "@/store/business.store";
import type { ShopsType } from "@/types/shops.types";

export function canShowBusinessOnMap(business: SavedBusiness): boolean {
  return hasValidCoords(business);
}

export function canShowShopOnMap(shop: ShopsType): boolean {
  if (!hasValidCoords(shop)) return false;

  if (shop.apiBusinessId != null) {
    return (shop.services?.length ?? 0) > 0;
  }

  return true;
}
