import type { SavedBusiness } from "@/store/business.store";

export function isLegacyDemoBusiness(
  business: Pick<SavedBusiness, "id" | "name">,
) {
  return (
    (business.id === "1" && business.name === "BronFitness Club") ||
    business.id === "demo-preview-business"
  );
}
