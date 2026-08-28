import { bookingExtras } from "@/data/bookingExtras";

const EXTRA_TRANSLATION_KEYS: Record<string, { name: string; description: string }> = {
  isotonic: { name: "extras.isotonic", description: "extras.isotonicDesc" },
  "protein-bar": { name: "extras.proteinBar", description: "extras.proteinBarDesc" },
  "protein-shake": { name: "extras.proteinShake", description: "extras.proteinShakeDesc" },
  water: { name: "extras.water", description: "extras.waterDesc" },
  towel: { name: "extras.towel", description: "extras.towelDesc" },
};

export function getBookingExtraLabels(
  id: string,
  t: (key: string) => string,
) {
  const keys = EXTRA_TRANSLATION_KEYS[id];
  const fallback = bookingExtras.find((item) => item.id === id);

  if (!keys) {
    return {
      name: fallback?.name ?? id,
      description: fallback?.description ?? "",
    };
  }

  return {
    name: t(keys.name),
    description: t(keys.description),
  };
}
