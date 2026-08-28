import type { MapFilterSubmitResult } from "@/store/mapFilter.store";

export type FilterModalError = "invalid_price" | null;

export function getFilterModalErrorMessage(
  error: FilterModalError,
  t: (key: string) => string,
): string | null {
  if (error === "invalid_price") {
    return t("map.priceInvalidError");
  }

  return null;
}

export function isFilterSubmitSuccess(result: MapFilterSubmitResult) {
  return result === "applied" || result === "cleared";
}

export function getFilterSubmitError(
  result: MapFilterSubmitResult,
): FilterModalError {
  if (result === "invalid_price") {
    return "invalid_price";
  }

  return null;
}
