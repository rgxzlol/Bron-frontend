import { useTranslations, useLocale } from 'next-intl';

export function usePluralize() {
  const t = useTranslations('pluralize');
  const locale = useLocale();

  function pluralizeServices(count: number): string {
    if (locale !== 'ru') {
      return count === 1 ? t('services.one') : t('services.other');
    }
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 14) return t('services.many');
    if (mod10 === 1) return t('services.one');
    if (mod10 >= 2 && mod10 <= 4) return t('services.few');
    return t('services.many');
  }

  function pluralizeReviews(count: number): string {
    if (locale !== 'ru') {
      return count === 1 ? t('reviews.one') : t('reviews.other');
    }
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 14) return t('reviews.many');
    if (mod10 === 1) return t('reviews.one');
    if (mod10 >= 2 && mod10 <= 4) return t('reviews.few');
    return t('reviews.many');
  }

  function formatDurationMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes} ${t('time.min')}`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (rest === 0) return `${hours} ${t('time.hour')}`;
    return `${hours} ${t('time.hour')} ${rest} ${t('time.min')}`;
  }

  return { pluralizeServices, pluralizeReviews, formatDurationMinutes };
}
