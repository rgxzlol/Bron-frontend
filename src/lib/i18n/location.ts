import type { ProfileLanguage } from "@/store/profile.store";

const LOCATION_REPLACEMENTS: Record<ProfileLanguage, Array<[string, string]>> = {
  ru: [],
  en: [
    ["ул.", "st."],
    ["Ташкент", "Tashkent"],
    ["Яккасарайский район", "Yakkasaray district"],
    ["Мирабадский район", "Mirobod district"],
  ],
  uz: [
    ["ул.", "ko‘chasi"],
    ["Ташкент", "Toshkent"],
    ["Яккасарайский район", "Yakkasaroy tumani"],
    ["Мирабадский район", "Mirobod tumani"],
  ],
};

export function translateLocation(value: string, language: ProfileLanguage) {
  return LOCATION_REPLACEMENTS[language].reduce(
    (translated, [source, target]) => translated.replaceAll(source, target),
    value,
  );
}
