import type { ProfileLanguage } from "@/store/profile.store";

const LOCALE_MAP: Record<ProfileLanguage, string> = {
  ru: "ru-RU",
  uz: "uz-UZ",
  en: "en-US",
};

export function toBcp47(language: ProfileLanguage): string {
  return LOCALE_MAP[language];
}

export function toHtmlLang(language: ProfileLanguage): string {
  return language;
}
