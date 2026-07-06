import { useTranslations } from 'next-intl';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Профиль",
};

export default function ProfilePage() {
  const t = useTranslations('ProfilePage');
  return <div>{t('title')}</div>;
}
