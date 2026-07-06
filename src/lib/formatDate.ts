import { useLocale } from 'next-intl';

export function useFormatDate() {
  const locale = useLocale();

  function formatDate(date: Date) {
    const localeMap: Record<string, string> = { ru: 'ru-RU', en: 'en-US', uz: 'uz-UZ' };
    return date.toLocaleDateString(localeMap[locale] || 'ru-RU', {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return { formatDate };
}
